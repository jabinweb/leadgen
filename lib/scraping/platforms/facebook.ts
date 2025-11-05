import { Page } from 'playwright';
import { ScrapedLead } from '../scraper';

export interface FacebookConfig {
  searchQuery: string;
  maxResults: number;
  searchType: 'pages' | 'groups'; // Search for business pages or groups
}

export class FacebookScraper {
  async scrape(page: Page, config: FacebookConfig): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    try {
      // Note: Facebook requires login and has strict scraping policies
      // This is a basic implementation that works with public data only
      
      const searchUrl = `https://www.facebook.com/search/${config.searchType}/?q=${encodeURIComponent(config.searchQuery)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
      
      await page.waitForTimeout(3000);
      
      // Scroll to load more results
      let scrollCount = 0;
      const maxScrolls = Math.ceil(config.maxResults / 10);
      
      while (scrollCount < maxScrolls && leads.length < config.maxResults) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(2000);
        scrollCount++;
        
        // Try to extract business pages
        const pageElements = await page.$$('div[role="article"]');
        
        for (const element of pageElements) {
          if (leads.length >= config.maxResults) break;
          
          try {
            const lead: ScrapedLead = {
              source: 'Facebook',
              sourceUrl: page.url(),
            };
            
            // Business name
            const nameElement = await element.$('a[role="link"] span');
            if (nameElement) {
              lead.companyName = await nameElement.textContent() || undefined;
            }
            
            // Facebook URL
            const linkElement = await element.$('a[role="link"]');
            if (linkElement) {
              const href = await linkElement.getAttribute('href');
              if (href) {
                (lead as any).facebookUrl = href.startsWith('http') ? href : `https://www.facebook.com${href}`;
                lead.sourceUrl = (lead as any).facebookUrl;
              }
            }
            
            // Category/Description
            try {
              const descElements = await element.$$('span');
              for (const desc of descElements) {
                const text = await desc.textContent();
                if (text && text.length > 20 && text.length < 500) {
                  lead.description = text;
                  break;
                }
              }
            } catch (error) {
              // Description optional
            }
            
            if (lead.companyName && !leads.find(l => l.companyName === lead.companyName)) {
              leads.push(lead);
            }
            
          } catch (error) {
            console.error('Error scraping Facebook page:', error);
            continue;
          }
        }
      }
      
    } catch (error) {
      console.error('Facebook scraping error:', error);
      throw error;
    }
    
    return leads;
  }
  
  async scrapePageDetails(page: Page, pageUrl: string): Promise<Partial<ScrapedLead>> {
    const details: Partial<ScrapedLead> = {};
    
    try {
      await page.goto(pageUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // Try to find About section with more details
      const aboutLink = await page.$('a[href*="/about"]');
      if (aboutLink) {
        await aboutLink.click();
        await page.waitForTimeout(2000);
        
        // Extract phone, email, website from About section
        const infoElements = await page.$$('div[class*="info"]');
        for (const info of infoElements) {
          const text = await info.textContent();
          
          // Email
          const emailMatch = text?.match(/[\w.-]+@[\w.-]+\.\w+/);
          if (emailMatch) {
            details.email = emailMatch[0];
          }
          
          // Phone
          const phoneMatch = text?.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
          if (phoneMatch) {
            details.phone = phoneMatch[0];
          }
          
          // Website
          const urlMatch = text?.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            details.website = urlMatch[0];
          }
        }
      }
      
    } catch (error) {
      console.error('Error scraping Facebook page details:', error);
    }
    
    return details;
  }
}
