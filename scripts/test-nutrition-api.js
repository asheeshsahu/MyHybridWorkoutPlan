#!/usr/bin/env node
/**
 * Test Groq macro lookup.
 * Usage: node scripts/test-nutrition-api.js [YOUR_GROQ_API_KEY]
 * Or: GROQ_API_KEY=xxx node scripts/test-nutrition-api.js
 * Or add key to src/config/nutrition.ts (GROQ_API_KEY)
 */
const fs = require('fs');
const path = require('path');

let key = process.env.GROQ_API_KEY || process.argv[2];
if (!key) {
  try {
    const configPath = path.join(__dirname, '../src/config/nutrition.ts');
    const config = fs.readFileSync(configPath, 'utf8');
    const m = config.match(/GROQ_API_KEY\s*=\s*['"]([^'"]*)['"]/);
    if (m && m[1]) key = m[1];
  } catch (_) {}
}
if (!key) {
  console.log('Usage: node scripts/test-nutrition-api.js YOUR_GROQ_API_KEY');
  console.log('Or add GROQ_API_KEY to src/config/nutrition.ts');
  process.exit(1);
}

const queries = ['3 eggs', '3 eggs and 2 bread', '3 eggs + 2 brown breads', 'chicken rice'];
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function test(query) {
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
          {
            role: 'system',
            content:
              'Return ONLY a JSON object: {"calories": number, "protein": number, "carbs": number, "fats": number}. Use grams for protein, carbs, fats. No explanation.',
          },
          { role: 'user', content: `Estimate macros for: ${query}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    console.log(`\n--- Query: "${query}" (${res.status}) ---`);
    if (!res.ok) {
      console.log('Error:', data?.error?.message || JSON.stringify(data));
      return;
    }
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.log('Error: No response from Groq');
      return;
    }
    const p = JSON.parse(content);
    console.log('Total:', p.calories, 'cal,', p.protein, 'g P,', p.carbs, 'g C,', p.fats, 'g F');
  } catch (e) {
    console.log('Error:', e.message);
  }
}

(async () => {
  console.log('Testing Groq macro lookup...');
  for (const q of queries) {
    await test(q);
  }
  console.log('\nDone.');
})();
