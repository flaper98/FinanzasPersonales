import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, asegurarEsquema } from './_lib/db';
import { obtenerUserId } from './_lib/auth';
import { conManejoDeErrores } from './_lib/http';

export default conManejoDeErrores(async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await obtenerUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  await asegurarEsquema();

  if (req.method === 'GET') {
    const [fila] = await sql`SELECT data FROM finance_data WHERE user_id = ${userId}`;
    res.status(200).json(fila?.data ?? { months: {} });
    return;
  }

  if (req.method === 'PUT') {
    const data = req.body;
    if (!data || typeof data !== 'object' || typeof data.months !== 'object') {
      res.status(400).json({ error: 'Formato de datos inválido.' });
      return;
    }
    await sql`
      INSERT INTO finance_data (user_id, data, updated_at)
      VALUES (${userId}, ${JSON.stringify(data)}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Método no permitido.' });
});
