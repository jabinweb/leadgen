import { chromium, Browser, Page } from 'playwright';
import { prisma } from '@/lib/prisma';
import { ScrapingStatus } from '@prisma/client';
import { GoogleMapsScraper } from './platforms/google-maps';
import { FacebookScraper } from './platforms/facebook';
import { InstagramScraper } from './platforms/instagram';
import { GooglePlacesAPI } from './api-scrapers/google-places';
import { GeminiLeadsGenerator } from './api-scrapers/gemini-leads';

export interface ScrapingConfig {
  targetWebsite: string;
  platform?: 'google-maps' | 'google-maps-api' | 'yelp' | 'facebook' | 'instagram' | 'custom';
  searchQuery?: string;
  location?: string;
  maxResults: number;
  useAiEnrichment?: boolean;
  fields: string[];
  selectors: {
    [key: string]: string;
  };
  pagination?: {
    nextButton: string;
    hasNext: string;
  };
  filters?: {
    requireEmail?: boolean;
    requirePhone?: boolean;
    requireWebsite?: boolean;
  };
}

export interface ScrapedLead {
  companyName?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  industry?: string;
  employeeCount?: number;
  contactName?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  latitude?: number;
  longitude?: number;
  source: string;
  sourceUrl: string;
}

export class WebScraper {
  private browser: Browser | null = null;

  async initialize() {
    try {
      // Launch browser for scraping
      console.log('[Scraper] Launching browser for scraping...');
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
      console.log('[Scraper] Browser launched successfully');
    } catch (error: any) {
      console.error('[Scraper] Failed to launch browser:', error.message);
      throw new Error(`Browser initialization failed: ${error.message}`);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeLeads(
    jobId: string,
    config: ScrapingConfig,
    userId: string,
    userApiKeys?: { geminiApiKey?: string; googlePlacesApiKey?: string; aiModel?: string }
  ): Promise<void> {
    const leads: ScrapedLead[] = [];

    try {
      await this.updateJobStatus(jobId, ScrapingStatus.RUNNING);

      // Use API-based scraping (fast and reliable)
      if (config.platform === 'google-maps' || config.platform === 'google-maps-api') {
        const useAI = config.useAiEnrichment === true;
        console.log(`🔍 Fetching leads from ${useAI ? 'multiple sources' : 'Google Places API only'}...`);

        // Strategy: Combine leads from all available sources
        const leadPromises: Promise<ScrapedLead[]>[] = [];

        // Split maxResults between sources when using AI enrichment
        const googlePlacesLimit = useAI ? Math.ceil(config.maxResults * 0.6) : config.maxResults;
        const geminiLimit = useAI ? Math.ceil(config.maxResults * 0.5) : 0;

        // 1. Always try Google Places API first (real verified data)
        console.log(`📍 Fetching from Google Places API (limit: ${googlePlacesLimit})...`);
        const googlePlaces = new GooglePlacesAPI(userApiKeys?.googlePlacesApiKey);
        leadPromises.push(
          googlePlaces.searchBusinesses({
            businessCategory: config.searchQuery || '',
            location: config.location || '',
            maxResults: googlePlacesLimit,
          }).catch(error => {
            console.log('Google Places API error:', error.message);
            return [];
          })
        );

        // 2. Optionally fetch from Gemini AI if enabled (generates emails and additional leads)
        if (useAI) {
          console.log(`🤖 Fetching from Gemini AI (limit: ${geminiLimit})...`);
          const gemini = new GeminiLeadsGenerator(userApiKeys?.geminiApiKey, userApiKeys?.aiModel);
          leadPromises.push(
            gemini.generateLeads({
              businessCategory: config.searchQuery || '',
              location: config.location || '',
              maxResults: geminiLimit,
            }).catch(error => {
              console.log('Gemini AI error:', error.message);
              return [];
            })
          );
        } else {
          console.log('⏭️ Skipping Gemini AI (disabled in configuration)');
        }

        // Wait for all sources to complete
        const allLeads = await Promise.all(leadPromises);

        // Combine and deduplicate leads
        const googleLeads = allLeads[0] || [];
        const geminiLeads = useAI ? (allLeads[1] || []) : [];

        console.log(`✅ Google Places: ${googleLeads.length} leads`);
        if (useAI) {
          console.log(`✅ Gemini AI: ${geminiLeads.length} leads`);
        }

        // Add all leads (deduplication happens in saveLeads)
        leads.push(...googleLeads);
        if (useAI) {
          leads.push(...geminiLeads);
        }

        console.log(`📊 Total leads before filtering: ${leads.length}`);
        console.log(`⚠️ Max allowed: ${config.maxResults}`);

      } else if (config.platform === 'yelp') {
        // Use Gemini AI to generate Yelp-style business leads
        const gemini = new GeminiLeadsGenerator();
        try {
          const geminiLeads = await gemini.generateLeads({
            businessCategory: config.searchQuery || '',
            location: config.location || '',
            maxResults: config.maxResults,
          });
          leads.push(...geminiLeads);
        } catch (error) {
          console.error('Gemini AI failed:', error);
          throw new Error('Failed to generate leads with Gemini AI');
        }

      } else if (config.platform === 'facebook' || config.platform === 'instagram') {
        // Social media scraping not supported without browser
        throw new Error('Social media scraping requires browser automation. Please use Google Maps or Yelp instead.');

      } else {
        // Custom scraping not supported without browser
        throw new Error('Custom website scraping requires browser automation. Please use Google Maps or Yelp instead.');
      }

      // Track the raw total found from APIs (before any filtering/dedup/trimming)
      const rawTotalFound = leads.length;

      // Enforce max limit before saving (hard cap)
      if (leads.length > config.maxResults) {
        console.log(`⚠️ Trimming ${leads.length} leads to max limit of ${config.maxResults}`);
        leads.splice(config.maxResults);
      }

      // Save leads in batches
      if (leads.length > 0) {
        const savedCount = await this.saveLeads(leads, jobId, userId, config.filters, config.maxResults);
        await this.updateJobProgress(jobId, rawTotalFound, savedCount);
        await this.updateJobStatus(jobId, ScrapingStatus.COMPLETED, savedCount);
      } else {
        await this.updateJobProgress(jobId, rawTotalFound, 0);
        await this.updateJobStatus(jobId, ScrapingStatus.COMPLETED, 0);
      }

    } catch (error) {
      console.error('Scraping error:', error);

      // Clean up any orphaned leads saved before the error
      try {
        const deletedLeads = await prisma.lead.deleteMany({
          where: { scrapingJobId: jobId },
        });
        if (deletedLeads.count > 0) {
          console.log(`🧹 Cleaned up ${deletedLeads.count} orphaned leads from failed job ${jobId}`);
        }
      } catch (cleanupError) {
        console.error('Failed to clean up orphaned leads:', cleanupError);
      }

      await this.updateJobStatus(jobId, ScrapingStatus.FAILED, 0, error as Error);
      throw error;
    }
  }

  private async saveLeads(
    leads: ScrapedLead[],
    jobId: string,
    userId: string,
    filters?: { requireEmail?: boolean; requirePhone?: boolean; requireWebsite?: boolean },
    maxLimit?: number
  ): Promise<number> {
    console.log('Saving leads with filters:', filters);
    console.log('Total leads to process:', leads.length);
    console.log('Max limit:', maxLimit || 'unlimited');

    let filteredCount = 0;
    let savedCount = 0;
    let duplicateCount = 0;
    const seenInBatch = new Map<string, ScrapedLead>(); // Track duplicates within this batch

    for (const leadData of leads) {
      // Skip if missing required fields
      if (!leadData.companyName) continue;

      // Apply quality filters
      if (filters?.requireEmail && !leadData.email) {
        console.log(`Filtered out ${leadData.companyName} - missing email`);
        filteredCount++;
        continue;
      }
      if (filters?.requirePhone && !leadData.phone) {
        console.log(`Filtered out ${leadData.companyName} - missing phone`);
        filteredCount++;
        continue;
      }
      if (filters?.requireWebsite && !leadData.website) {
        console.log(`Filtered out ${leadData.companyName} - missing website`);
        filteredCount++;
        continue;
      }

      // Create a unique key for deduplication (company name + location)
      const dedupeKey = `${leadData.companyName.toLowerCase().trim()}_${(leadData.address || '').toLowerCase().trim()}`;

      // Check if we've seen this lead in the current batch (from multiple sources)
      if (seenInBatch.has(dedupeKey)) {
        const existing = seenInBatch.get(dedupeKey)!;
        // Merge data - prefer data from Google Places (real data) over AI-generated
        if (leadData.source === 'Google Places API' && existing.source !== 'Google Places API') {
          // Replace AI data with real Google Places data
          seenInBatch.set(dedupeKey, leadData);
        } else if (existing.source !== 'Google Places API' && leadData.source !== 'Google Places API') {
          // Both are AI-generated or both are Google Places, merge to fill gaps
          seenInBatch.set(dedupeKey, {
            ...existing,
            email: existing.email || leadData.email,
            phone: existing.phone || leadData.phone,
            website: existing.website || leadData.website,
            rating: existing.rating || leadData.rating,
            reviewCount: existing.reviewCount || leadData.reviewCount,
          });
        }
        duplicateCount++;
        continue;
      }

      seenInBatch.set(dedupeKey, leadData);
    }

    console.log(`📊 After deduplication: ${seenInBatch.size} unique leads from ${leads.length} total`);

    // Now save the deduplicated leads
    const uniqueLeads = Array.from(seenInBatch.values());

    // Enforce max limit if specified
    const leadsToSave = maxLimit ? uniqueLeads.slice(0, maxLimit) : uniqueLeads;
    if (maxLimit && uniqueLeads.length > maxLimit) {
      console.log(`⚠️ Enforcing max limit: saving ${maxLimit} out of ${uniqueLeads.length} unique leads`);
    }

    for (const leadData of leadsToSave) {
      // Check for duplicates in database
      const existing = await prisma.lead.findFirst({
        where: {
          companyName: leadData.companyName,
          userId: userId,
        },
      });

      if (!existing) {
        await prisma.lead.create({
          data: {
            companyName: leadData.companyName || '',
            website: leadData.website,
            email: leadData.email,
            phone: leadData.phone,
            address: leadData.address,
            industry: leadData.industry,
            employeeCount: leadData.employeeCount,
            contactName: leadData.contactName,
            jobTitle: leadData.jobTitle,
            linkedinUrl: leadData.linkedinUrl,
            description: leadData.description,
            source: leadData.source || 'Unknown',
            sourceUrl: leadData.sourceUrl || '',
            scrapingJobId: jobId,
            userId: userId,
          },
        });
        savedCount++;

        // Stop if we've reached the max limit
        if (maxLimit && savedCount >= maxLimit) {
          console.log(`✅ Reached max limit of ${maxLimit} saved leads, stopping...`);
          break;
        }
      } else {
        duplicateCount++;
      }
    }

    console.log(`✅ Summary - Saved: ${savedCount}, Duplicates: ${duplicateCount}, Filtered: ${filteredCount}`);
    return savedCount;
  }

  private async updateJobStatus(
    jobId: string,
    status: ScrapingStatus,
    successCount: number = 0,
    error?: Error
  ) {
    const updateData: any = {
      status,
      successCount,
      updatedAt: new Date(),
    };

    if (status === ScrapingStatus.RUNNING) {
      updateData.startedAt = new Date();
    } else if (status === ScrapingStatus.COMPLETED || status === ScrapingStatus.FAILED) {
      updateData.completedAt = new Date();
    }

    if (error) {
      updateData.errorMessage = error.message;
    }

    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: updateData,
    });
  }

  private async updateJobProgress(jobId: string, totalFound: number, savedCount: number) {
    // Progress is 100% when we reach the save stage (job is about to complete)
    // totalFound = raw leads from APIs, savedCount = leads after filtering/dedup
    const progress = 100;

    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        progress,
        totalFound,
        errorCount: Math.max(0, totalFound - savedCount), // filtered/duplicate count
      },
    });
  }
}