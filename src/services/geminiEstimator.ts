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

const COOLDOWN_MS = 60_000;
const LS_KEY_PREFIX = 'ai-cooldown-';

export function getSecondsRemaining(feature: string): number {
  const last = parseInt(localStorage.getItem(LS_KEY_PREFIX + feature) ?? '0', 10);
  const diff = COOLDOWN_MS - (Date.now() - last);
  return diff > 0 ? Math.ceil(diff / 1000) : 0;
}

export function stampCooldown(feature: string) {
  localStorage.setItem(LS_KEY_PREFIX + feature, String(Date.now()));
}

export async function generateHashtags(input: {
  brideName: string;
  groomName: string;
  date: string;
  theme: string;
  venue: string;
}): Promise<string[]> {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured. Add REACT_APP_GEMINI_API_KEY to your .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  const prompt = `You are a witty, award-winning copywriter specializing in viral wedding hashtags. Your hashtags make people say "That's clever!", "LOL!", or "WOW — how did they think of that?!"

Couple details:
- Bride: ${input.brideName || 'unknown'}
- Groom: ${input.groomName || 'unknown'}
- Wedding Date: ${input.date || 'not specified'}
- Theme: ${input.theme || 'not specified'}
- Venue: ${input.venue || 'not specified'}

Generate exactly 10 hashtags. Each must fall into one of these styles — vary them across the 10:
1. PUN / WORDPLAY — mash up their names into a pun, rhyme, or double meaning (e.g. if groom is "Juan", use "TillDeathDoUsJuan", "JuanInAMillion", "JuanAndDone")
2. CLEVER MASHUP — fuse both names into one smooth portmanteau or blend (e.g. "MariaAndJuanForever" → "MariJuanForever")
3. POP CULTURE REFERENCE — twist a famous movie/song/show title using their names or date
4. UNEXPECTED TWIST — starts like a cliché then subverts it with something funny or surprising
5. RHYME / RHYTHM — reads like a little poem or chant guests will remember

Rules:
- No spaces, no # symbol in the output
- Make EVERY hashtag feel intentional and surprising — avoid generic filler like "ForeverAndAlways" or "TrueLove"
- Lean into humor, wit, and delight over sentimentality
- Return ONLY a JSON array of 10 strings, no markdown, no explanation
- Example format: ["TillDeathDoUsJuan","MariJuanForever","JuanInAMillion"]`;

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err: any) {
    const body = err?.message ?? '';
    if (body.includes('429') || body.includes('RESOURCE_EXHAUSTED') || body.includes('quota')) {
      throw new Error('Gemini quota exceeded. Please wait a moment and try again.');
    }
    throw new Error('Failed to reach Gemini API. Check your connection and try again.');
  }

  const text = result.response.text().trim()
    .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  let tags: string[];
  try {
    tags = JSON.parse(text);
    if (!Array.isArray(tags)) throw new Error();
  } catch {
    throw new Error('AI returned an unexpected format. Please try again.');
  }

  return tags.map(t => t.replace(/^#/, '').trim()).filter(Boolean);
}

export interface ProgramFlowItem {
  time: string;
  title: string;
  description: string;
  section: 'ceremony' | 'cocktail' | 'reception';
}

export async function generateProgramFlow(input: {
  brideName: string;
  groomName: string;
  date: string;
  ceremonyTime: string;
  church: string;
  receptionVenue: string;
  foodServiceType: string;
  theme: string;
  guestCount: number;
  attire: string;
}): Promise<ProgramFlowItem[]> {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  const prompt = `You are a professional wedding coordinator creating a detailed program flow.

Generate a complete wedding day program for:
- Bride: ${input.brideName || 'TBD'}
- Groom: ${input.groomName || 'TBD'}
- Date: ${input.date}
- Ceremony Time: ${input.ceremonyTime}
- Church / Ceremony Venue: ${input.church}
- Reception Venue: ${input.receptionVenue}
- Food Service: ${input.foodServiceType}
- Theme / Style: ${input.theme || 'Classic Elegant'}
- Guest Count: ${input.guestCount || 'TBD'}
- Attire: ${input.attire || 'Formal'}

Create a realistic minute-by-minute program. Include ALL three sections: ceremony, cocktail hour, and reception.

Return ONLY a JSON array (no markdown, no explanation):
[
  {
    "time": "3:00 PM",
    "title": "Guests Arrive",
    "description": "Ushers escort guests to their seats. String quartet plays background music.",
    "section": "ceremony"
  }
]

Rules:
- section must be exactly "ceremony", "cocktail", or "reception"
- Times must be realistic and sequential based on the ceremony start time
- Include 6–10 ceremony items, 3–5 cocktail items, 10–15 reception items
- Descriptions should be specific and actionable for the emcee or coordinator
- Do NOT wrap in markdown code fences`;

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err: any) {
    const body = err?.message ?? '';
    if (body.includes('429') || body.includes('RESOURCE_EXHAUSTED') || body.includes('quota')) {
      throw new Error('Gemini quota exceeded. Please wait a moment and try again.');
    }
    throw new Error('Failed to reach Gemini API. Check your connection and try again.');
  }

  const text = result.response.text().trim()
    .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  let items: ProgramFlowItem[];
  try {
    items = JSON.parse(text);
    if (!Array.isArray(items)) throw new Error();
  } catch {
    throw new Error('AI returned an unexpected format. Please try again.');
  }

  return items.filter(i => i.title && i.section);
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
