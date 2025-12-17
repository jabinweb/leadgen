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
    const startTime = Date.now();
    const maxScrapingTime = 10 * 60 * 1000; // 10 minutes max
    
    try {
      console.log(`[GoogleMaps] Starting scrape for "${config.searchQuery}" in "${config.location}"`);
      
      // Navigate to Google Maps with more lenient settings
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(config.searchQuery)}${config.location ? '+' + encodeURIComponent(config.location) : ''}`;
      console.log(`[GoogleMaps] Navigating to: ${searchUrl}`);
      
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log(`[GoogleMaps] Page loaded`);

      // Wait for results to load with multiple fallback selectors
      try {
        await page.waitForSelector('div[role="feed"]', { timeout: 15000 });
        console.log(`[GoogleMaps] Found results feed`);
      } catch (error) {
        console.log(`[GoogleMaps] Primary selector failed, trying alternative...`);
        try {
          await page.waitForSelector('.m6QErb', { timeout: 10000 });
          console.log(`[GoogleMaps] Found results with alternative selector`);
        } catch (altError) {
          console.error(`[GoogleMaps] Could not find results feed. Page might not have loaded correctly.`);
          throw new Error('No results found on Google Maps');
        }
      }

      // Additional wait to ensure content is loaded
      await page.waitForTimeout(3000);
      
      let scrapedCount = 0;
      let scrollAttempts = 0;
      const maxScrollAttempts = 200; // Increased to handle large requests
      let previousListingCount = 0;
      let noNewResultsCount = 0;
      const scrapedIndices = new Set<number>(); // Track which listings we've already scraped
      
      // First, scroll to load as many listings as possible before scraping
      console.log(`Target: ${config.maxResults} leads`);
      
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
        
        const currentListingCount = listings.length;
        console.log(`Found ${currentListingCount} listings on page, scraped ${scrapedCount}/${config.maxResults}, scroll attempt ${scrollAttempts}`);
        
        // Check if we got new listings after scrolling
        if (currentListingCount === previousListingCount) {
          noNewResultsCount++;
          // If no new results appear after multiple attempts, stop scrolling
          if (noNewResultsCount >= 8) {
            console.log(`No new results after ${noNewResultsCount} scroll attempts. Google Maps may not have more results for this query.`);
            break;
          }
        } else {
          noNewResultsCount = 0;
          previousListingCount = currentListingCount;
        }
        
        console.log(`\n\n⚠️⚠️⚠️ ABOUT TO SCRAPE LISTINGS ⚠️⚠️⚠️\n\n`);
        
        // Scrape new listings we haven't processed yet
        let newListingsProcessed = 0;
        console.log(`Processing ${listings.length} listings, already scraped ${scrapedIndices.size} indices...`);
        
        for (let i = 0; i < listings.length && scrapedCount < config.maxResults; i++) {
          // Skip if we've already scraped this index
          if (scrapedIndices.has(i)) {
            continue;
          }
          
          scrapedIndices.add(i);
          console.log(`[${i}] Clicking on listing ${i + 1}/${listings.length}...`);
          
          try {
            const listing = listings[i];
            
            // Click and wait for navigation
            try {
              await listing.click();
              console.log(`[${i}] Clicked, waiting for details to load...`);
              await page.waitForTimeout(2000);
            } catch (clickError) {
              console.error(`[${i}] Failed to click listing:`, clickError);
              continue;
            }
            
            // Extract business details
            const lead: ScrapedLead = {
              source: 'Google Maps',
              sourceUrl: page.url(),
            };
            
            console.log(`[${i}] Extracting data from ${page.url()}...`);
            
            // Company name
            const nameElement = await page.$('h1[class*="fontHeadline"]');
            if (nameElement) {
              lead.companyName = await nameElement.textContent() || undefined;
              console.log(`[${i}] Found company: ${lead.companyName}`);
            } else {
              console.warn(`[${i}] No company name found, might not be on detail page`);
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
              newListingsProcessed++;
              console.log(`✓ Scraped ${scrapedCount}/${config.maxResults}: ${lead.companyName}`);
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
        
        // If we processed new listings this iteration, continue immediately to next iteration
        if (newListingsProcessed > 0 && scrapedCount < config.maxResults) {
          scrollAttempts++;
          continue;
        }
        
        // Scroll to load more results
        const feedElement = await page.$('div[role="feed"]');
        if (feedElement) {
          // Scroll multiple times in one iteration to load more results faster
          for (let scrollCount = 0; scrollCount < 3; scrollCount++) {
            await feedElement.evaluate(el => el.scrollTo(0, el.scrollHeight));
            await page.waitForTimeout(1500);
          }
        }
        
        scrollAttempts++;
      }
      
      console.log(`Scraping completed: ${scrapedCount} leads collected from ${previousListingCount} total listings available`);
      
    } catch (error) {
      console.error('Google Maps scraping error:', error);
      throw error;
    }
    
    return leads;
  }
}
