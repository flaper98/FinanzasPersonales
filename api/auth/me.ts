import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, asegurarEsquema } from '../_lib/db.js';
import { obtenerUserId } from '../_lib/auth.js';
import { conManejoDeErrores } from '../_lib/http.js';

export default conManejoDeErrores(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  const userId = await obtenerUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  await asegurarEsquema();
  const [usuario] = await sql`SELECT email FROM users WHERE id = ${userId}`;
  if (!usuario) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }
  res.status(200).json({ email: usuario.email });
});
