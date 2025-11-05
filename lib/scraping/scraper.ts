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
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    });
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
    if (!this.browser) {
      await this.initialize();
    }

    const context = await this.browser!.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
    });
    
    const page = await context.newPage();
    const leads: ScrapedLead[] = [];
    
    try {
      await this.updateJobStatus(jobId, ScrapingStatus.RUNNING);
      
      // Use API scrapers first (more reliable), fallback to web scraping
      if (config.platform === 'google-maps') {
        // Try Google Places API first
        const googlePlaces = new GooglePlacesAPI();
        try {
          const apiLeads = await googlePlaces.searchBusinesses({
            businessCategory: config.searchQuery || '',
            location: config.location || '',
            maxResults: config.maxResults,
          });
          
          if (apiLeads.length > 0) {
            leads.push(...apiLeads);
          } else {
            throw new Error('No results from API');
          }
        } catch (error) {
          console.log('Google Places API unavailable, using web scraping');
          const googleMaps = new GoogleMapsScraper();
          const scrapedLeads = await googleMaps.scrape(page, {
            searchQuery: config.searchQuery || '',
            location: config.location,
            maxResults: config.maxResults,
          });
          leads.push(...scrapedLeads);
        }
        
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
        
      } else if (config.platform === 'facebook') {
        const facebook = new FacebookScraper();
        const fbLeads = await facebook.scrape(page, {
          searchQuery: config.searchQuery || '',
          maxResults: config.maxResults,
          searchType: 'pages',
        });
        leads.push(...fbLeads);
        
      } else if (config.platform === 'instagram') {
        const instagram = new InstagramScraper();
        const igLeads = await instagram.scrape(page, {
          searchQuery: config.searchQuery || '',
          maxResults: config.maxResults,
        });
        leads.push(...igLeads);
        
      } else {
        // Custom scraping logic
        await page.goto(config.targetWebsite, { waitUntil: 'networkidle' });
        
        // Handle search if query provided
        if (config.searchQuery) {
          await this.performSearch(page, config.searchQuery);
        }

        let currentPage = 1;
        let totalScraped = 0;

        while (totalScraped < config.maxResults) {
          const pageLeads = await this.extractLeadsFromPage(page, config);
          leads.push(...pageLeads);
          totalScraped += pageLeads.length;

          await this.updateJobProgress(jobId, totalScraped, config.maxResults);

          // Check if there's a next page
          if (config.pagination && totalScraped < config.maxResults) {
            const hasNext = await this.goToNextPage(page, config.pagination);
            if (!hasNext) break;
            currentPage++;
          } else {
            break;
          }
        }
      }

      // Save leads in batches
      if (leads.length > 0) {
        await this.saveLeads(leads, jobId, userId);
      }

      await this.updateJobProgress(jobId, leads.length, config.maxResults);
      await this.updateJobStatus(jobId, ScrapingStatus.COMPLETED, leads.length);

    } catch (error) {
      console.error('Scraping error:', error);
      await this.updateJobStatus(jobId, ScrapingStatus.FAILED, 0, error as Error);
      throw error;
    } finally {
      await page.close();
      await context.close();
    }
  }

  private async performSearch(page: Page, query: string) {
    // Generic search implementation - can be customized per website
    const searchSelector = 'input[type="search"], input[name*="search"], input[placeholder*="search"]';
    await page.waitForSelector(searchSelector, { timeout: 5000 });
    await page.fill(searchSelector, query);
    await page.press(searchSelector, 'Enter');
    await page.waitForLoadState('networkidle');
  }

  private async extractLeadsFromPage(page: Page, config: ScrapingConfig): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Extract leads based on configuration
    const leadElements = await page.$$eval('div[class*="result"], div[class*="listing"], div[class*="card"]', 
      (elements) => elements.slice(0, 20)
    );

    for (let i = 0; i < leadElements.length; i++) {
      try {
        const lead: ScrapedLead = {
          source: config.targetWebsite,
          sourceUrl: page.url(),
        };

        // Extract data based on selectors
        for (const [field, selector] of Object.entries(config.selectors)) {
          try {
            const element = await page.$(`div:nth-child(${i + 1}) ${selector}`);
            if (element) {
              const text = await element.textContent();
              if (text && text.trim()) {
                (lead as any)[field] = text.trim();
              }
            }
          } catch (error) {
            // Continue if selector fails
          }
        }

        // Only add lead if it has at least company name or contact info
        if (lead.companyName || lead.email || lead.phone) {
          leads.push(lead);
        }
      } catch (error) {
        console.error(`Error extracting lead ${i}:`, error);
      }
    }

    return leads;
  }

  private async goToNextPage(page: Page, pagination: { nextButton: string; hasNext: string }): Promise<boolean> {
    try {
      const hasNext = await page.$(pagination.hasNext);
      if (!hasNext) return false;

      const nextButton = await page.$(pagination.nextButton);
      if (!nextButton) return false;

      await nextButton.click();
      await page.waitForLoadState('networkidle');
      return true;
    } catch (error) {
      return false;
    }
  }

  private async saveLeads(leads: ScrapedLead[], jobId: string, userId: string) {
    for (const leadData of leads) {
      // Skip if missing required fields
      if (!leadData.companyName) continue;
      
      // Check for duplicates
      const existing = await prisma.lead.findFirst({
        where: {
          companyName: leadData.companyName,
          email: leadData.email,
          userId: userId,
        },
      });

      if (!existing) {
        await prisma.lead.create({
          data: {
            companyName: leadData.companyName,
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
      }
    }
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