import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/api/recipes', async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'Please provide a list of ingredients.' });
  }

  const ingredientList = ingredients.join(', ');

  const prompt = `You are a helpful cooking assistant. The user has these ingredients available: ${ingredientList}.

Suggest 3 real, well-known meal recipes they can make (or mostly make) with these ingredients. Choose recipes that are genuinely popular and commonly made — not made-up or obscure dishes.

For each recipe, return a JSON object with exactly these fields:
- "name": the dish name (string)
- "description": 1-2 sentence description of the dish (string)
- "ingredients_needed": ingredients from the user's list that are used (array of strings)
- "missing_ingredients": key additional ingredients they would still need, if any — keep this list short and only include truly essential items (array of strings)
- "instructions": 4-6 clear cooking steps (array of strings)

Respond ONLY with valid JSON in this exact format, no extra text:
{
  "recipes": [
    {
      "name": "...",
      "description": "...",
      "ingredients_needed": ["..."],
      "missing_ingredients": ["..."],
      "instructions": ["..."]
    }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text;

    // Strip markdown code fences if present
    const jsonText = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const data = JSON.parse(jsonText);
    res.json(data);
  } catch (err) {
    console.error('Error calling Claude API:', err);
    res.status(500).json({ error: 'Failed to get recipe suggestions. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Cooking Agent running at http://localhost:${PORT}`);
});
