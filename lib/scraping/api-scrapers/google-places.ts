import { ScrapedLead } from '../scraper';

export interface GooglePlacesConfig {
  businessCategory: string;
  location: string;
  maxResults: number;
}

export class GooglePlacesAPI {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
  }

  async searchBusinesses(config: GooglePlacesConfig): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];
    
    if (!this.apiKey) {
      console.warn('Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to .env');
      return leads;
    }

    try {
      // Text search for businesses
      const searchQuery = `${config.businessCategory} in ${config.location}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${this.apiKey}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Google Places API error:', data.status);
        return leads;
      }

      // Process results
      for (const place of data.results.slice(0, config.maxResults)) {
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

        // Rate limiting - Google allows 10 requests per second
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return leads;
    } catch (error) {
      console.error('Error fetching from Google Places API:', error);
      throw error;
    }
  }
}
