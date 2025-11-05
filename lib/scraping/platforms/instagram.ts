import { Page } from 'playwright';
import { ScrapedLead } from '../scraper';

export interface InstagramConfig {
  searchQuery: string;
  maxResults: number;
  accountType?: 'business' | 'all';
}

export class InstagramScraper {
  async scrape(page: Page, config: InstagramConfig): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    try {
      // Navigate to Instagram search
      await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // Search for accounts
      const searchInput = await page.$('input[placeholder*="Search"]');
      if (searchInput) {
        await searchInput.fill(config.searchQuery);
        await page.waitForTimeout(2000);
        
        // Get search results
        const searchResults = await page.$$('div[role="dialog"] a[href*="/"]');
        
        for (let i = 0; i < Math.min(searchResults.length, config.maxResults); i++) {
          try {
            const result = searchResults[i];
            const href = await result.getAttribute('href');
            
            if (href && href.includes('/')) {
              const accountUrl = `https://www.instagram.com${href}`;
              
              // Visit profile
              await page.goto(accountUrl, { waitUntil: 'networkidle' });
              await page.waitForTimeout(2000);
              
              const lead: ScrapedLead = {
                source: 'Instagram',
                sourceUrl: accountUrl,
              };
              
              // Account name/username
              const usernameElement = await page.$('header h2');
              if (usernameElement) {
                lead.companyName = await usernameElement.textContent() || undefined;
              }
              
              // Instagram URL
              (lead as any).instagramUrl = accountUrl;
              
              // Bio/Description
              const bioElement = await page.$('header section div > span');
              if (bioElement) {
                const bioText = await bioElement.textContent();
                if (bioText) {
                  lead.description = bioText;
                  
                  // Extract email from bio
                  const emailMatch = bioText.match(/[\w.-]+@[\w.-]+\.\w+/);
                  if (emailMatch) {
                    lead.email = emailMatch[0];
                  }
                  
                  // Extract phone from bio
                  const phoneMatch = bioText.match(/\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
                  if (phoneMatch) {
                    lead.phone = phoneMatch[0];
                  }
                }
              }
              
              // Website from bio
              const websiteElement = await page.$('a[href*="http"]');
              if (websiteElement) {
                const website = await websiteElement.getAttribute('href');
                if (website) {
                  lead.website = website;
                }
              }
              
              // Check if business account
              const categoryElement = await page.$('header section div.-vDIg span');
              if (categoryElement) {
                lead.industry = await categoryElement.textContent() || undefined;
              }
              
              if (lead.companyName) {
                leads.push(lead);
              }
            }
            
          } catch (error) {
            console.error(`Error scraping Instagram account ${i}:`, error);
            continue;
          }
        }
      }
      
    } catch (error) {
      console.error('Instagram scraping error:', error);
      throw error;
    }
    
    return leads;
  }
  
  async scrapeHashtag(page: Page, hashtag: string, maxResults: number): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    try {
      await page.goto(`https://www.instagram.com/explore/tags/${hashtag}/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      // Get top posts
      const posts = await page.$$('article a[href*="/p/"]');
      const accountsFound = new Set<string>();
      
      for (let i = 0; i < Math.min(posts.length, maxResults * 3); i++) {
        if (leads.length >= maxResults) break;
        
        try {
          const post = posts[i];
          const postUrl = await post.getAttribute('href');
          
          if (postUrl) {
            await page.goto(`https://www.instagram.com${postUrl}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1500);
            
            // Get account from post
            const accountLink = await page.$('article header a[href*="/"]');
            if (accountLink) {
              const accountHref = await accountLink.getAttribute('href');
              if (accountHref && !accountsFound.has(accountHref)) {
                accountsFound.add(accountHref);
                
                // Visit account profile
                await page.goto(`https://www.instagram.com${accountHref}`, { waitUntil: 'networkidle' });
                await page.waitForTimeout(1500);
                
                // Extract account details (similar to scrape method above)
                const lead: ScrapedLead = {
                  source: 'Instagram',
                  sourceUrl: `https://www.instagram.com${accountHref}`,
                };
                
                const usernameElement = await page.$('header h2');
                if (usernameElement) {
                  lead.companyName = await usernameElement.textContent() || undefined;
                }
                
                (lead as any).instagramUrl = `https://www.instagram.com${accountHref}`;
                
                if (lead.companyName) {
                  leads.push(lead);
                }
              }
            }
          }
          
        } catch (error) {
          console.error('Error scraping Instagram hashtag post:', error);
          continue;
        }
      }
      
    } catch (error) {
      console.error('Instagram hashtag scraping error:', error);
    }
    
    return leads;
  }
}
