import { MacroInfo } from '../types';
import { GROQ_API_KEY } from '../config/nutrition';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface NutritionResult {
  label: string;
  macros: MacroInfo;
  items?: { name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }[];
}

const SYSTEM_PROMPT = `You are a nutrition expert. Given a meal description, return ONLY a JSON object with this exact structure (no markdown, no explanation):
{"calories": number, "protein": number, "carbs": number, "fats": number}

Use grams for protein, carbs, and fats. Estimate based on typical serving sizes. Be accurate and realistic.`;

function parseJsonContent(text: string): Record<string, number> {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();
  try {
    return JSON.parse(cleaned) as Record<string, number>;
  } catch {
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]) as Record<string, number>;
    throw new Error('Invalid JSON response from API');
  }
}

export async function fetchNutritionFromQuery(
  query: string,
  apiKey?: string
): Promise<NutritionResult | null> {
  const key = apiKey ?? GROQ_API_KEY;
  if (!key || !query.trim()) return null;

  if (key.startsWith('sk-') || key.startsWith('sk-proj-')) {
    throw new Error(
      'Wrong API key: This app uses Groq, not OpenAI. Get a free key at console.groq.com/keys and add it to src/config/nutrition.ts as GROQ_API_KEY.'
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Estimate macros for: ${query.trim()}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const data = await res.json();

    if (!res.ok) {
      const err = data?.error?.message || data?.error || JSON.stringify(data);
      let errStr = String(err).replace(/OpenAI|openai|ChatGPT/gi, 'Groq');
      if (res.status === 429 || /limit|rate|quota|exceed/i.test(errStr)) {
        throw new Error(
          "Groq API limit reached. Free tier: 30 requests/min. Try again in a minute or enter macros manually below."
        );
      }
      if (res.status === 401 || /invalid.*key|incorrect.*key|authentication/i.test(errStr)) {
        throw new Error(
          "Invalid Groq API key. Get a free key at console.groq.com/keys and add it to src/config/nutrition.ts."
        );
      }
      throw new Error(errStr);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('No response from Groq');

    const parsed = parseJsonContent(content);
    const calories = Math.round(Number(parsed.calories ?? parsed.cal) || 0);
    const protein = Math.round(Number(parsed.protein ?? parsed.protein_g) || 0);
    const carbs = Math.round(Number(parsed.carbs ?? parsed.carbs_g) || 0);
    const fats = Math.round(Number(parsed.fats ?? parsed.fat ?? parsed.fats_g) || 0);

    if (calories === 0 && protein === 0 && carbs === 0 && fats === 0) {
      return null;
    }

    const macros: MacroInfo = {
      calories: calories || Math.round(4 * protein + 4 * carbs + 9 * fats),
      protein,
      carbs,
      fats,
    };

    return {
      label: query.trim(),
      macros,
    };
  } catch (e) {
    let msg = e instanceof Error ? e.message : String(e);
    msg = msg.replace(/OpenAI|openai|ChatGPT/gi, 'Groq');
    const isAbort = e instanceof Error && e.name === 'AbortError';
    const isNetwork = /network|failed|fetch/i.test(msg);
    console.warn('[Nutrition API]', msg);
    throw new Error(
      isAbort ? 'Request timed out. Check your internet connection.' : isNetwork ? `Network error: ${msg}` : msg
    );
  }
}
