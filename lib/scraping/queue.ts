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

  async addJob(jobId: string, config: ScrapingConfig, userId: string) {
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
      // Fetch user's API keys
      const { prisma } = await import('@/lib/prisma');
      const { decrypt } = await import('@/lib/encryption');
      
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: item.userId },
        select: { geminiApiKey: true, googlePlacesApiKey: true },
      });

      const userApiKeys = {
        geminiApiKey: userProfile?.geminiApiKey ? decrypt(userProfile.geminiApiKey) : undefined,
        googlePlacesApiKey: userProfile?.googlePlacesApiKey ? decrypt(userProfile.googlePlacesApiKey) : undefined,
      };

      await scraper.initialize();
      await scraper.scrapeLeads(item.jobId, item.config, item.userId, userApiKeys);
    } catch (error) {
      console.error(`Scraping job ${item.jobId} failed:`, error);
    } finally {
      await scraper.close();
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