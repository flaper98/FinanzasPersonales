import type { VercelRequest, VercelResponse } from '@vercel/node';
import { borrarCookieSesion } from '../_lib/auth';
import { conManejoDeErrores } from '../_lib/http';

export default conManejoDeErrores(function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }
  borrarCookieSesion(res);
  res.status(200).json({ ok: true });
});
