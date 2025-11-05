import { Page } from 'playwright';
import { ScrapedLead } from '../scraper';

export interface YelpConfig {
  searchQuery: string;
  location: string;
  maxResults: number;
}

export class YelpScraper {
  async scrape(page: Page, config: YelpConfig): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    try {
      // Navigate to Yelp search
      const searchUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(config.searchQuery)}&find_loc=${encodeURIComponent(config.location)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
      
      let currentPage = 1;
      const maxPages = Math.ceil(config.maxResults / 10);
      
      while (leads.length < config.maxResults && currentPage <= maxPages) {
        await page.waitForTimeout(2000);
        
        // Get all business listings on current page
        const listings = await page.$$('div[data-testid="serp-ia-card"]');
        
        for (const listing of listings) {
          if (leads.length >= config.maxResults) break;
          
          try {
            const lead: ScrapedLead = {
              source: 'Yelp',
              sourceUrl: page.url(),
            };
            
            // Company name
            const nameElement = await listing.$('h3 a[class*="businessname"]');
            if (nameElement) {
              lead.companyName = await nameElement.textContent() || undefined;
              const href = await nameElement.getAttribute('href');
              if (href) {
                lead.sourceUrl = `https://www.yelp.com${href}`;
              }
            }
            
            // Rating
            try {
              const ratingElement = await listing.$('div[aria-label*="star rating"]');
              if (ratingElement) {
                const ariaLabel = await ratingElement.getAttribute('aria-label');
                const ratingMatch = ariaLabel?.match(/(\d+\.?\d*)/);
                if (ratingMatch) {
                  (lead as any).rating = parseFloat(ratingMatch[1]);
                }
              }
            } catch (error) {
              // Rating optional
            }
            
            // Review count
            try {
              const reviewElement = await listing.$('span[class*="reviewCount"]');
              if (reviewElement) {
                const reviewText = await reviewElement.textContent();
                const reviewMatch = reviewText?.match(/(\d+)/);
                if (reviewMatch) {
                  (lead as any).reviewCount = parseInt(reviewMatch[1]);
                }
              }
            } catch (error) {
              // Reviews optional
            }
            
            // Category/Industry
            try {
              const categoryElements = await listing.$$('a[href*="/c/"]');
              if (categoryElements.length > 0) {
                const categories: string[] = [];
                for (const cat of categoryElements.slice(0, 3)) {
                  const catText = await cat.textContent();
                  if (catText) categories.push(catText.trim());
                }
                lead.industry = categories.join(', ');
              }
            } catch (error) {
              // Category optional
            }
            
            // Address
            try {
              const addressElement = await listing.$('p[class*="secondaryAttributes"]');
              if (addressElement) {
                lead.address = await addressElement.textContent() || undefined;
              }
            } catch (error) {
              // Address optional
            }
            
            // Phone
            try {
              const phoneElement = await listing.$('p[class*="contact"]');
              if (phoneElement) {
                const phoneText = await phoneElement.textContent();
                const phoneMatch = phoneText?.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
                if (phoneMatch) {
                  lead.phone = phoneMatch[0];
                }
              }
            } catch (error) {
              // Phone optional
            }
            
            if (lead.companyName) {
              leads.push(lead);
            }
            
          } catch (error) {
            console.error('Error scraping Yelp listing:', error);
            continue;
          }
        }
        
        // Try to go to next page
        if (leads.length < config.maxResults && currentPage < maxPages) {
          const nextButton = await page.$('a[aria-label="Next"]');
          if (nextButton) {
            await nextButton.click();
            await page.waitForNavigation({ waitUntil: 'networkidle' });
            currentPage++;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      
    } catch (error) {
      console.error('Yelp scraping error:', error);
      throw error;
    }
    
    return leads;
  }
}
