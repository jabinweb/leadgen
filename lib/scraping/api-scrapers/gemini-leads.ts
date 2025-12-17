import { GoogleGenAI } from '@google/genai';
import { ScrapedLead } from '../scraper';

interface GeminiLeadRequest {
  businessCategory: string;
  location: string;
  maxResults?: number;
}

export class GeminiLeadsGenerator {
  private ai: GoogleGenAI;
  private model: string;

  constructor(customApiKey?: string, customModel?: string) {
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required. Please set it in your environment or provide your own API key in Settings.');
    }
    this.ai = new GoogleGenAI({ apiKey });
    // Use gemini-1.5-flash as default (more stable free tier)
    this.model = customModel || 'gemini-1.5-flash';
  }

  async generateLeads(params: GeminiLeadRequest): Promise<ScrapedLead[]> {
    const { businessCategory, location, maxResults = 20 } = params;

    try {
      const prompt = `Generate a list of ${maxResults} real ${businessCategory} businesses in ${location}. 
For each business, provide:
- name (business name)
- address (full street address in ${location})
- phone (phone number - use actual local format for ${location}, not +1-555 fake numbers)
- website (realistic URL like https://businessname.com, or empty string if small business)
- email (business email like contact@businessname.com, or empty string if not available)

IMPORTANT: 
- Use REALISTIC phone numbers for ${location} (not +1-555-XXX-XXXX)
- Use REALISTIC email addresses based on business names
- Make the data look authentic

Format the response as a JSON array with this exact structure:
[
  {
    "name": "Business Name",
    "address": "123 Main St, ${location}",
    "phone": "realistic phone for ${location}",
    "website": "https://example.com",
    "email": "contact@example.com"
  }
]

Only return the JSON array, no additional text or explanation.`;

      console.log(`[Gemini] Using model: ${this.model}`);
      
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text;
      
      if (!text) {
        throw new Error('No response from Gemini AI');
      }
      
      // Extract JSON from the response (handle markdown code blocks)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const businesses = JSON.parse(jsonText);

      console.log('🤖 Gemini AI Response:', JSON.stringify(businesses, null, 2));

      // Transform to ScrapedLead format
      const leads: ScrapedLead[] = businesses.map((business: any) => ({
        companyName: business.name || '',
        contactName: '',
        email: business.email || '',
        phone: business.phone || '',
        website: business.website || '',
        linkedinUrl: '',
        jobTitle: '',
        industry: businessCategory,
        employeeCount: undefined,
        address: business.address || location,
        description: `AI-generated lead for ${businessCategory} in ${location}. Note: Contact information may need verification.`,
        rating: 0,
        reviewCount: 0,
        latitude: 0,
        longitude: 0,
        source: 'Gemini AI',
        sourceUrl: 'https://ai.google.dev/',
      }));

      console.log(`✅ Generated ${leads.length} leads from Gemini AI`);
      leads.forEach((lead, idx) => {
        console.log(`Lead ${idx + 1}:`, {
          company: lead.companyName,
          phone: lead.phone,
          email: lead.email,
          website: lead.website,
        });
      });

      return leads;

    } catch (error) {
      console.error('Error generating leads with Gemini:', error);
      throw error;
    }
  }
}
