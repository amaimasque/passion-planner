import { GoogleGenerativeAI } from '@google/generative-ai';
import type { BudgetCategory } from '../types/budget';

export interface AiCategoryEstimate {
  name: string;
  estimated: number;
  items: { name: string; estimated: number }[];
}

export interface AiEstimateResult {
  summary: string;
  categories: AiCategoryEstimate[];
}

interface EstimateInput {
  location: string;
  currencyCode: string;
  weddingDate: string;
  guestCount: number;
  receptionVenue: string;
  foodServiceType: string;
  theme: string;
  attire: string;
  existingCategories: BudgetCategory[];
}

export async function estimateBudgetWithAI(input: EstimateInput): Promise<AiEstimateResult> {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured. Add REACT_APP_GEMINI_API_KEY to your .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  const existingNames = input.existingCategories.map(c => c.name);

  const prompt = `You are a professional wedding budget consultant.

Generate a realistic wedding budget estimate based on these details:
- Country / Location: ${input.location}
- Currency: ${input.currencyCode} (ALL amounts must be in ${input.currencyCode})
- Wedding Date: ${input.weddingDate || 'Not specified'}
- Expected Guest Count: ${input.guestCount || 'Not specified'}
- Reception Venue: ${input.receptionVenue || 'Not specified'}
- Food Service Style: ${input.foodServiceType || 'Not specified'}
- Theme / Style: ${input.theme || 'Not specified'}
- Attire Style: ${input.attire || 'Not specified'}
${existingNames.length > 0 ? `- Existing budget categories (already tracked): ${existingNames.join(', ')}` : ''}

Return a JSON object with this exact shape (no markdown, no extra text, just the JSON):
{
  "summary": "One or two sentences contextualizing the estimate for this wedding.",
  "categories": [
    {
      "name": "Category Name",
      "estimated": 00000,
      "items": [
        { "name": "Line item", "estimated": 00000 }
      ]
    }
  ]
}

Rules:
- Include 8–12 categories covering all major wedding expenses relevant to ${input.location}.
- Each category should have 2–5 specific line items that sum to the category total.
- All numbers must be realistic for ${input.location} local market pricing in ${input.currencyCode}.
- Do NOT include any category already in the existing list (${existingNames.join(', ') || 'none'}).
- Do NOT include markdown code fences. Output raw JSON only.`;

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err: any) {
    const body = err?.message ?? '';
    if (body.includes('429') || body.includes('RESOURCE_EXHAUSTED') || body.includes('quota')) {
      throw new Error(
        'Gemini API quota exceeded. Please enable billing for your Google AI project at aistudio.google.com, then try again.'
      );
    }
    if (body.includes('403') || body.includes('API_KEY_INVALID') || body.includes('PERMISSION_DENIED')) {
      throw new Error('Invalid Gemini API key. Check your REACT_APP_GEMINI_API_KEY in .env.');
    }
    throw new Error('Failed to reach Gemini API. Check your connection and try again.');
  }
  const text = result.response.text().trim();

  // Strip markdown fences if the model ignores the instruction
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  let parsed: AiEstimateResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned an unexpected response format. Please try again.');
  }

  if (!parsed.categories || !Array.isArray(parsed.categories)) {
    throw new Error('AI returned an unexpected response format. Please try again.');
  }

  return parsed;
}
