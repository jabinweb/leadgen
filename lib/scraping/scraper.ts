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
  platform?: 'google-maps' | 'yelp' | 'facebook' | 'instagram' | 'custom';
  searchQuery?: string;
  location?: string;
  maxResults: number;
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
    // Skip Playwright browser launch for production
    // Use API-based scrapers only
    console.log('Using API-based scrapers only (no browser required)');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeLeads(
    jobId: string,
    config: ScrapingConfig,
    userId: string
  ): Promise<void> {
    // Don't initialize browser - use API scrapers only
    const leads: ScrapedLead[] = [];
    
    try {
      await this.updateJobStatus(jobId, ScrapingStatus.RUNNING);
      
      // Use API scrapers only (no browser scraping in production)
      if (config.platform === 'google-maps') {
        console.log('🔍 Fetching leads from multiple sources to maximize results...');
        
        // Strategy: Combine leads from all available sources
        const leadPromises: Promise<ScrapedLead[]>[] = [];
        
        // 1. Always try Google Places API first (real verified data)
        console.log('📍 Fetching from Google Places API...');
        const googlePlaces = new GooglePlacesAPI();
        leadPromises.push(
          googlePlaces.searchBusinesses({
            businessCategory: config.searchQuery || '',
            location: config.location || '',
            maxResults: config.maxResults,
          }).catch(error => {
            console.log('Google Places API error:', error.message);
            return [];
          })
        );
        
        // 2. Also fetch from Gemini AI (generates emails and additional leads)
        console.log('🤖 Fetching from Gemini AI...');
        const gemini = new GeminiLeadsGenerator();
        leadPromises.push(
          gemini.generateLeads({
            businessCategory: config.searchQuery || '',
            location: config.location || '',
            maxResults: Math.min(config.maxResults, 20), // Gemini has limits
          }).catch(error => {
            console.log('Gemini AI error:', error.message);
            return [];
          })
        );
        
        // Wait for all sources to complete
        const allLeads = await Promise.all(leadPromises);
        
        // Combine and deduplicate leads
        const googleLeads = allLeads[0] || [];
        const geminiLeads = allLeads[1] || [];
        
        console.log(`✅ Google Places: ${googleLeads.length} leads`);
        console.log(`✅ Gemini AI: ${geminiLeads.length} leads`);
        
        // Add all leads (deduplication happens in saveLeads)
        leads.push(...googleLeads);
        leads.push(...geminiLeads);
        
        console.log(`📊 Total leads before filtering: ${leads.length}`);
        
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

      // Save leads in batches
      if (leads.length > 0) {
        await this.saveLeads(leads, jobId, userId, config.filters);
      }

      await this.updateJobProgress(jobId, leads.length, config.maxResults);
      await this.updateJobStatus(jobId, ScrapingStatus.COMPLETED, leads.length);

    } catch (error) {
      console.error('Scraping error:', error);
      await this.updateJobStatus(jobId, ScrapingStatus.FAILED, 0, error as Error);
      throw error;
    }
  }

  private async saveLeads(
    leads: ScrapedLead[], 
    jobId: string, 
    userId: string,
    filters?: { requireEmail?: boolean; requirePhone?: boolean; requireWebsite?: boolean }
  ) {
    console.log('Saving leads with filters:', filters);
    console.log('Total leads to process:', leads.length);
    
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
    for (const leadData of uniqueLeads) {
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
      } else {
        duplicateCount++;
      }
    }
    
    console.log(`✅ Summary - Saved: ${savedCount}, Duplicates: ${duplicateCount}, Filtered: ${filteredCount}`);
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

  private async updateJobProgress(jobId: string, current: number, total: number) {
    const progress = Math.min(Math.round((current / total) * 100), 100);
    
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        progress,
        totalFound: current,
      },
    });
  }
}