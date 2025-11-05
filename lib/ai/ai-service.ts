import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface SubjectLineVariant {
  subject: string;
  strategy: string;
  targetAudience: string;
  expectedOpenRate: string;
}

export interface ContentOptimization {
  score: number; // 0-100
  suggestions: string[];
  optimizedContent: string;
  improvements: {
    clarity: number;
    persuasiveness: number;
    professionalism: number;
    callToAction: number;
  };
}

export interface LeadQualification {
  score: number; // 0-100
  quality: 'HOT' | 'WARM' | 'COLD';
  reasoning: string;
  nextSteps: string[];
  conversionProbability: number; // 0-100
}

export interface SentimentAnalysis {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  confidence: number; // 0-100
  intent: 'INTERESTED' | 'NOT_INTERESTED' | 'NEEDS_MORE_INFO' | 'READY_TO_BUY' | 'OBJECTION';
  keyPhrases: string[];
  suggestedResponse: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Extract and parse JSON from AI response (handles markdown code blocks)
 */
function extractJSON(text: string): any {
  let jsonText = text.trim();
  
  // Remove markdown code blocks
  if (jsonText.includes('```json')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonText.includes('```')) {
    jsonText = jsonText.replace(/```\n?/g, '');
  }
  
  // Find JSON object or array
  const jsonMatch = jsonText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('No valid JSON found in response');
}

/**
 * Generate multiple A/B test subject line variants
 */
export async function generateSubjectLines(params: {
  companyName: string;
  industry?: string;
  productService: string;
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'urgent' | 'friendly';
  count?: number;
}): Promise<SubjectLineVariant[]> {
  const { companyName, industry, productService, targetAudience, tone = 'professional', count = 5 } = params;

  const prompt = `You are an expert email marketer specializing in cold outreach campaigns.

Generate ${count} highly effective email subject lines for a cold email campaign with these details:
- Company: ${companyName}
- Industry: ${industry || 'Not specified'}
- Product/Service: ${productService}
- Target Audience: ${targetAudience || 'Business decision makers'}
- Tone: ${tone}

For each subject line, provide:
1. The subject line (keep it under 60 characters)
2. The strategy used (e.g., curiosity, personalization, value proposition, urgency, social proof)
3. Target audience it works best for
4. Expected open rate category (High/Medium/Low)

Make them varied using different psychological triggers. Avoid spam words like "FREE", "GUARANTEED", excessive punctuation.

Return ONLY a JSON array with this structure:
[
  {
    "subject": "subject line here",
    "strategy": "strategy description",
    "targetAudience": "who this works best for",
    "expectedOpenRate": "High/Medium/Low"
  }
]`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: prompt,
  });

  if (!response.text) {
    throw new Error('No response from AI');
  }

  return extractJSON(response.text);
}

/**
 * Optimize email content for better engagement
 */
export async function optimizeEmailContent(params: {
  content: string;
  companyName: string;
  goal?: string;
  targetAudience?: string;
}): Promise<ContentOptimization> {
  const { content, companyName, goal = 'Generate leads', targetAudience = 'Business decision makers' } = params;

  const prompt = `You are an expert copywriter specializing in cold email optimization.

Analyze and optimize this email content:

"""
${content}
"""

Context:
- Company: ${companyName}
- Goal: ${goal}
- Target Audience: ${targetAudience}

Provide:
1. Overall score (0-100) for the current content
2. Specific improvement suggestions (list of actionable items)
3. An optimized version of the email
4. Individual scores (0-100) for:
   - Clarity (is it easy to understand?)
   - Persuasiveness (does it convince?)
   - Professionalism (appropriate tone?)
   - Call to Action (clear next step?)

Focus on:
- Personalization opportunities
- Removing fluff and getting to the point
- Strong opening line
- Clear value proposition
- Compelling call to action
- Removing spam triggers
- Proper formatting

Return ONLY a JSON object:
{
  "score": 75,
  "suggestions": ["suggestion 1", "suggestion 2"],
  "optimizedContent": "improved email here",
  "improvements": {
    "clarity": 80,
    "persuasiveness": 75,
    "professionalism": 85,
    "callToAction": 70
  }
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: prompt,
  });

  if (!response.text) {
    throw new Error('No response from AI');
  }

  return extractJSON(response.text);
}

/**
 * Predict lead qualification score
 */
export async function qualifyLead(params: {
  companyName: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  revenue?: string;
  employeeCount?: number;
  description?: string;
  source?: string;
  targetCriteria?: string;
}): Promise<LeadQualification> {
  const { companyName, industry, website, email, phone, revenue, employeeCount, description, source, targetCriteria } = params;

  const prompt = `You are an expert sales analyst. Evaluate this lead's quality and conversion potential.

Lead Information:
- Company: ${companyName}
- Industry: ${industry || 'Unknown'}
- Website: ${website || 'Not provided'}
- Email: ${email ? 'Provided' : 'Missing'}
- Phone: ${phone ? 'Provided' : 'Missing'}
- Revenue: ${revenue || 'Unknown'}
- Employee Count: ${employeeCount || 'Unknown'}
- Description: ${description || 'None'}
- Source: ${source || 'Unknown'}

Target Criteria:
${targetCriteria || 'General B2B lead generation'}

Analyze and provide:
1. Overall lead score (0-100)
2. Quality rating (HOT: 80-100, WARM: 50-79, COLD: 0-49)
3. Detailed reasoning for the score
4. Recommended next steps (3-5 specific actions)
5. Conversion probability (0-100)

Consider:
- Data completeness (more contact info = higher score)
- Company fit (does it match target criteria?)
- Reachability (valid email/phone?)
- Company size and revenue indicators
- Industry relevance
- Source reliability

Return ONLY a JSON object:
{
  "score": 75,
  "quality": "WARM",
  "reasoning": "detailed explanation",
  "nextSteps": ["step 1", "step 2", "step 3"],
  "conversionProbability": 65
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: prompt,
  });

  if (!response.text) {
    throw new Error('No response from AI');
  }

  return extractJSON(response.text);
}

/**
 * Analyze sentiment and intent from email replies
 */
export async function analyzeSentiment(params: {
  replyContent: string;
  originalEmail?: string;
  context?: string;
}): Promise<SentimentAnalysis> {
  const { replyContent, originalEmail, context } = params;

  const prompt = `You are an expert at analyzing email communication sentiment and intent.

Reply to analyze:
"""
${replyContent}
"""

${originalEmail ? `Original email sent:\n"""\n${originalEmail}\n"""` : ''}
${context ? `Additional context: ${context}` : ''}

Analyze and provide:
1. Sentiment (POSITIVE, NEUTRAL, or NEGATIVE)
2. Confidence level (0-100)
3. Intent classification:
   - INTERESTED: Shows interest in continuing conversation
   - NOT_INTERESTED: Clearly not interested or unsubscribe request
   - NEEDS_MORE_INFO: Has questions, needs clarification
   - READY_TO_BUY: Ready to make a decision or purchase
   - OBJECTION: Has concerns or objections
4. Key phrases that indicate the sentiment/intent
5. Suggested response strategy (how to reply)
6. Urgency level (HIGH/MEDIUM/LOW - how soon should we respond?)

Return ONLY a JSON object:
{
  "sentiment": "POSITIVE",
  "confidence": 85,
  "intent": "INTERESTED",
  "keyPhrases": ["phrase 1", "phrase 2"],
  "suggestedResponse": "recommendation on how to respond",
  "urgency": "HIGH"
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: prompt,
  });

  if (!response.text) {
    throw new Error('No response from AI');
  }

  return extractJSON(response.text);
}

/**
 * Generate personalized email content
 */
export async function generatePersonalizedEmail(params: {
  companyName: string;
  contactName?: string;
  industry?: string;
  website?: string;
  yourCompany: string;
  yourService: string;
  valueProposition: string;
  tone?: string;
}): Promise<string> {
  const { companyName, contactName, industry, website, yourCompany, yourService, valueProposition, tone = 'professional' } = params;

  const prompt = `Write a personalized cold email for:

Recipient:
- Company: ${companyName}
- Contact: ${contactName || 'Decision maker'}
- Industry: ${industry || 'Unknown'}
- Website: ${website || 'Not provided'}

Sender:
- Company: ${yourCompany}
- Service: ${yourService}
- Value Proposition: ${valueProposition}

Requirements:
- Tone: ${tone}
- Keep it under 150 words
- Start with a personalized opening (reference their company/industry)
- Clearly state the value proposition
- Include ONE clear call to action
- NO spam words
- Professional but conversational

Return only the email body text, no subject line.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: prompt,
  });

  if (!response.text) {
    throw new Error('No response from AI');
  }

  return response.text.trim();
}
