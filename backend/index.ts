import { router, json, error, db, ai } from '@appdeploy/sdk';

type Entry = { id: string; [key: string]: unknown };
const tables: Record<string, string> = {
  foods: 'meal_foods',
  pantry: 'meal_pantry',
  weights: 'meal_weights',
};
const validKinds = ['foods', 'pantry', 'weights'];

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
  'GET /api/tracker': [
    async () => {
      try {
        const result: Record<string, unknown[]> = {};
        for (const kind of validKinds) {
          const page = await db.list(tables[kind], { limit: 100 });
          result[kind] = page.items;
        }
        return json(result);
      } catch (e) {
        console.error('Tracker read failed', e);
        return error('Could not load tracker data', 500);
      }
    },
  ],
  'POST /api/tracker/:kind': [
    async ({ params, body }) => {
      const kind = params.kind;
      if (!validKinds.includes(kind))
        return error('Unknown tracker category', 400);
      if (!body || typeof body !== 'object' || Array.isArray(body))
        return error('A valid entry is required', 400);
      const record = body as Record<string, unknown>;
      if (
        kind === 'foods' &&
        (typeof record.name !== 'string' ||
          !record.name.trim() ||
          typeof record.calories !== 'number' ||
          record.calories < 0)
      )
        return error('Food name and valid calories are required', 400);
      if (
        kind === 'pantry' &&
        (typeof record.name !== 'string' || !record.name.trim())
      )
        return error('Ingredient name is required', 400);
      if (
        kind === 'weights' &&
        (typeof record.kg !== 'number' ||
          !Number.isFinite(record.kg) ||
          record.kg <= 0 ||
          typeof record.date !== 'string')
      )
        return error('A valid weight and date are required', 400);
      try {
        const [id] = await db.add(tables[kind], [record]);
        if (!id) return error('Could not save entry', 500);
        return json({ id, ...record }, 201);
      } catch (e) {
        console.error('Tracker write failed', e);
        return error('Could not save entry', 500);
      }
    },
  ],
  'DELETE /api/tracker/:kind/:id': [
    async ({ params }) => {
      const kind = params.kind;
      if (!validKinds.includes(kind))
        return error('Unknown tracker category', 400);
      try {
        const [ok] = await db.delete(tables[kind], [params.id]);
        if (!ok) return error('Entry not found', 404);
        return json({ deleted: true, id: params.id });
      } catch (e) {
        console.error('Tracker delete failed', e);
        return error('Could not delete entry', 500);
      }
    },
  ],
  'POST /api/ideas': [
    async ({ body }) => {
      const input = (body && typeof body === 'object' ? body : {}) as {
        pantry?: unknown;
        foods?: unknown;
        query?: unknown;
      };
      const pantry = Array.isArray(input.pantry)
        ? input.pantry
            .filter((x): x is string => typeof x === 'string')
            .slice(0, 60)
        : [];
      const foods = Array.isArray(input.foods)
        ? input.foods
            .filter((x): x is string => typeof x === 'string')
            .slice(0, 30)
        : [];
      const query =
        typeof input.query === 'string' ? input.query.slice(0, 400) : '';
      try {
        const result = await ai.generate({
          system:
            'You are a friendly meal-planning assistant. Suggest practical, flexible meals from the ingredients provided. Never prescribe restrictive diets or make medical claims. Respect stated preferences. If pantry is empty, offer simple adaptable ideas. Include short preparation steps and reasonable food-safety reminders. Be concise.',
          prompt:
            'Pantry ingredients: ' +
            (pantry.join(', ') || 'not specified') +
            '\nAlready logged today: ' +
            (foods.join(', ') || 'none') +
            '\nRequest: ' +
            (query || 'balanced, practical meal ideas') +
            '\nGive 3 meal ideas with names, ingredients, and brief steps. Do not invent exact nutrition facts.',
          maxTokens: 650,
          temperature: 0.7,
        });
        return json({ ideas: result.text });
      } catch (e) {
        console.error('AI meal ideas failed', e);
        return error('Meal ideas are temporarily unavailable', 500);
      }
    },
  ],
});
