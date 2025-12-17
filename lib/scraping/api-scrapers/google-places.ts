import { ScrapedLead } from '../scraper';

export interface GooglePlacesConfig {
  businessCategory: string;
  location: string;
  maxResults: number;
}

export class GooglePlacesAPI {
  private apiKey: string;

  constructor(customApiKey?: string) {
    this.apiKey = customApiKey || process.env.GOOGLE_PLACES_API_KEY || '';
  }

  async searchBusinesses(config: GooglePlacesConfig): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    if (!this.apiKey) {
      console.warn('Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to .env');
      return leads;
    }

    try {
      const searchQuery = `${config.businessCategory} in ${config.location}`;
      let nextPageToken: string | undefined = undefined;
      let pageCount = 0;
      const maxPages = Math.ceil(config.maxResults / 20); // 20 results per page
      
      console.log(`[Google Places] Searching for "${searchQuery}" (max ${config.maxResults} results, ~${maxPages} pages)`);

      // Fetch multiple pages of results
      while (leads.length < config.maxResults && pageCount < maxPages) {
        const searchUrl = nextPageToken
          ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${this.apiKey}`
          : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${this.apiKey}`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.status === 'ZERO_RESULTS') {
          console.log(`[Google Places] No more results found after ${leads.length} leads`);
          break;
        }

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          console.error(`[Google Places] API error: ${data.status}`, data.error_message);
          break;
        }

        if (!data.results || data.results.length === 0) {
          break;
        }

        console.log(`[Google Places] Page ${pageCount + 1}: Found ${data.results.length} results`);

        // Process results from this page
        for (const place of data.results) {
          if (leads.length >= config.maxResults) break;

          // Get detailed information
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,geometry,business_status,types&key=${this.apiKey}`;
          
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();

          if (detailsData.status === 'OK') {
            const details = detailsData.result;
            
            leads.push({
              companyName: details.name,
              address: details.formatted_address,
              phone: details.formatted_phone_number,
              website: details.website,
              rating: details.rating,
              reviewCount: details.user_ratings_total,
              latitude: details.geometry?.location?.lat,
              longitude: details.geometry?.location?.lng,
              industry: details.types?.[0]?.replace(/_/g, ' '),
              source: 'Google Places API',
              sourceUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            });
          }

          // Rate limiting - Google allows 10 requests per second for details
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Check for next page token
        nextPageToken = data.next_page_token;
        pageCount++;

        // If there's a next page, wait for it to become available (required by Google)
        if (nextPageToken && leads.length < config.maxResults) {
          console.log(`[Google Places] Waiting for next page token to activate...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Google requires 2 second delay
        } else {
          break;
        }
      }

      console.log(`[Google Places] Total fetched: ${leads.length} leads across ${pageCount} pages`);
      return leads;
    } catch (error) {
      console.error('Error fetching from Google Places API:', error);
      throw error;
    }
  }
}
