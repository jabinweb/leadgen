import { WebScraper, ScrapingConfig } from './scraper';

interface QueueItem {
  jobId: string;
  config: ScrapingConfig;
  userId: string;
}

class ScrapingQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private currentJobs = new Set<string>();
  private maxConcurrent = 3;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    console.log('[Queue] Initializing queue and loading pending jobs...');
    
    try {
      const { prisma } = await import('@/lib/prisma');
      
      // Reset any RUNNING jobs to PENDING (they were interrupted by server restart)
      const resetResult = await prisma.scrapingJob.updateMany({
        where: { status: 'RUNNING' },
        data: { status: 'PENDING' },
      });
      
      if (resetResult.count > 0) {
        console.log(`[Queue] Reset ${resetResult.count} stuck RUNNING jobs to PENDING`);
      }
      
      // Find all PENDING jobs
      const pendingJobs = await prisma.scrapingJob.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
      });
      
      console.log(`[Queue] Found ${pendingJobs.length} pending jobs to process`);
      
      // Add them to the queue
      for (const job of pendingJobs) {
        this.queue.push({
          jobId: job.id,
          config: job.configuration as unknown as ScrapingConfig,
          userId: job.userId,
        });
      }
      
      this.initialized = true;
      
      // Start processing
      if (this.queue.length > 0) {
        this.processQueue();
      }
    } catch (error) {
      console.error('[Queue] Failed to initialize queue:', error);
    }
  }

  async addJob(jobId: string, config: ScrapingConfig, userId: string) {
    // Ensure queue is initialized
    await this.initialize();
    
    this.queue.push({ jobId, config, userId });
    this.processQueue();
  }

  private async processQueue() {
    if (this.processing || this.currentJobs.size >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.currentJobs.size < this.maxConcurrent) {
      const item = this.queue.shift();
      if (!item) continue;

      this.currentJobs.add(item.jobId);
      this.processJob(item);
    }

    this.processing = false;
  }

  private async processJob(item: QueueItem) {
    const scraper = new WebScraper();
    
    try {
      console.log(`[Queue] Starting job ${item.jobId}...`);
      
      // Fetch user's API keys
      const { prisma } = await import('@/lib/prisma');
      const { decrypt } = await import('@/lib/encryption');
      
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: item.userId },
        select: { geminiApiKey: true, googlePlacesApiKey: true, aiModel: true },
      });

      const userApiKeys = {
        geminiApiKey: userProfile?.geminiApiKey ? decrypt(userProfile.geminiApiKey) : undefined,
        googlePlacesApiKey: userProfile?.googlePlacesApiKey ? decrypt(userProfile.googlePlacesApiKey) : undefined,
        aiModel: userProfile?.aiModel || 'gemini-1.5-flash',
      };

      console.log(`[Queue] Starting API-based scraping for job ${item.jobId}...`);
      await scraper.scrapeLeads(item.jobId, item.config, item.userId, userApiKeys);
      
      console.log(`[Queue] Job ${item.jobId} completed successfully`);
    } catch (error: any) {
      console.error(`[Queue] Scraping job ${item.jobId} failed:`, error);
      console.error(`[Queue] Error details:`, error.message, error.stack);
      
      // Update job status to failed
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.scrapingJob.update({
          where: { id: item.jobId },
          data: { 
            status: 'FAILED',
            errorMessage: error.message || 'Unknown error',
          },
        });
      } catch (updateError) {
        console.error(`[Queue] Failed to update job status:`, updateError);
      }
    } finally {
      this.currentJobs.delete(item.jobId);
      
      // Process next items in queue
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  getQueueStatus() {
    return {
      pending: this.queue.length,
      running: this.currentJobs.size,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

export const scrapingQueue = new ScrapingQueue();

// Initialize queue on module load (will process pending jobs)
scrapingQueue.initialize();