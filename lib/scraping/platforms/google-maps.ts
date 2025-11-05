import { Page } from 'playwright';
import { ScrapedLead } from '../scraper';

export interface GoogleMapsConfig {
  searchQuery: string;
  location?: string;
  maxResults: number;
}

export class GoogleMapsScraper {
  async scrape(page: Page, config: GoogleMapsConfig): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    try {
      // Navigate to Google Maps with more lenient settings
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(config.searchQuery)}${config.location ? '+' + encodeURIComponent(config.location) : ''}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Wait for results to load with multiple fallback selectors
      try {
        await page.waitForSelector('div[role="feed"]', { timeout: 15000 });
      } catch (error) {
        // Try alternative selector
        await page.waitForSelector('.m6QErb', { timeout: 10000 });
      }

      // Additional wait to ensure content is loaded
      await page.waitForTimeout(3000);
      
      let scrapedCount = 0;
      let scrollAttempts = 0;
      const maxScrollAttempts = 50;
      
      while (scrapedCount < config.maxResults && scrollAttempts < maxScrollAttempts) {
        // Get all business listings with error handling
        let listings;
        try {
          listings = await page.$$('div[role="feed"] > div > div > a');
        } catch (error) {
          console.log('Could not find listings, trying alternative selector...');
          listings = await page.$$('a.hfpxzc');
        }
        
        if (!listings || listings.length === 0) {
          console.log('No listings found, waiting and retrying...');
          await page.waitForTimeout(2000);
          scrollAttempts++;
          continue;
        }
        
        for (let i = scrapedCount; i < Math.min(listings.length, config.maxResults); i++) {
          try {
            const listing = listings[i];
            await listing.click();
            await page.waitForTimeout(2000);
            
            // Extract business details
            const lead: ScrapedLead = {
              source: 'Google Maps',
              sourceUrl: page.url(),
            };
            
            // Company name
            const nameElement = await page.$('h1[class*="fontHeadline"]');
            if (nameElement) {
              lead.companyName = await nameElement.textContent() || undefined;
            }
            
            // Rating and review count
            try {
              const ratingElement = await page.$('div[class*="fontBodyMedium"] > span[role="img"]');
              if (ratingElement) {
                const ariaLabel = await ratingElement.getAttribute('aria-label');
                if (ariaLabel) {
                  const ratingMatch = ariaLabel.match(/(\d+\.?\d*)/);
                  if (ratingMatch) {
                    (lead as any).rating = parseFloat(ratingMatch[1]);
                  }
                }
              }
              
              const reviewElement = await page.$('div[class*="fontBodyMedium"] > span > span > span');
              if (reviewElement) {
                const reviewText = await reviewElement.textContent();
                const reviewMatch = reviewText?.match(/(\d+)/);
                if (reviewMatch) {
                  (lead as any).reviewCount = parseInt(reviewMatch[1]);
                }
              }
            } catch (error) {
              // Rating optional
            }
            
            // Address
            const addressButton = await page.$('button[data-item-id="address"]');
            if (addressButton) {
              const addressDiv = await addressButton.$('div[class*="fontBodyMedium"]');
              if (addressDiv) {
                lead.address = await addressDiv.textContent() || undefined;
              }
            }
            
            // Phone
            const phoneButton = await page.$('button[data-item-id^="phone:tel:"]');
            if (phoneButton) {
              const phoneDiv = await phoneButton.$('div[class*="fontBodyMedium"]');
              if (phoneDiv) {
                lead.phone = await phoneDiv.textContent() || undefined;
              }
            }
            
            // Website
            const websiteButton = await page.$('a[data-item-id="authority"]');
            if (websiteButton) {
              lead.website = await websiteButton.getAttribute('href') || undefined;
            }
            
            // Business type/category
            const categoryButton = await page.$('button[jsaction*="category"]');
            if (categoryButton) {
              const categorySpan = await categoryButton.$('span[class*="fontBodyMedium"]');
              if (categorySpan) {
                lead.industry = await categorySpan.textContent() || undefined;
              }
            }
            
            // Description
            try {
              const descriptionButton = await page.$('button[aria-label*="About"]');
              if (descriptionButton) {
                await descriptionButton.click();
                await page.waitForTimeout(1000);
                const descriptionDiv = await page.$('div[class*="fontBodyMedium"][class*="description"]');
                if (descriptionDiv) {
                  lead.description = await descriptionDiv.textContent() || undefined;
                }
              }
            } catch (error) {
              // Description optional
            }
            
            // Get coordinates from URL
            try {
              const url = page.url();
              const coordMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
              if (coordMatch) {
                (lead as any).latitude = parseFloat(coordMatch[1]);
                (lead as any).longitude = parseFloat(coordMatch[2]);
              }
            } catch (error) {
              // Coordinates optional
            }
            
            if (lead.companyName) {
              leads.push(lead);
              scrapedCount++;
            }
            
            // Go back to list
            const backButton = await page.$('button[aria-label*="Back"]');
            if (backButton) {
              await backButton.click();
              await page.waitForTimeout(1000);
            }
            
          } catch (error) {
            console.error(`Error scraping listing ${i}:`, error);
            continue;
          }
        }
        
        // Scroll to load more results
        const feedElement = await page.$('div[role="feed"]');
        if (feedElement) {
          await feedElement.evaluate(el => el.scrollTo(0, el.scrollHeight));
          await page.waitForTimeout(2000);
        }
        
        scrollAttempts++;
      }
      
    } catch (error) {
      console.error('Google Maps scraping error:', error);
      throw error;
    }
    
    return leads;
  }
}
