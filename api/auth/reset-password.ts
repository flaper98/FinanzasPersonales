import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'node:crypto';
import { sql, asegurarEsquema } from '../_lib/db.js';
import { hashPassword, crearSesionToken, setearCookieSesion } from '../_lib/auth.js';
import { conManejoDeErrores } from '../_lib/http.js';

export default conManejoDeErrores(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  const { token, password } = req.body ?? {};
  if (typeof token !== 'string' || !token || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Ingresa una contraseña de al menos 8 caracteres.' });
    return;
  }

  await asegurarEsquema();

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const [usuario] = await sql`
    SELECT id, email FROM users
    WHERE reset_token_hash = ${tokenHash} AND reset_token_expires_at > now()
  `;
  if (!usuario) {
    res.status(400).json({ error: 'El link es inválido o ya expiró. Pedí uno nuevo.' });
    return;
  }

  const passwordHash = await hashPassword(password);
  await sql`
    UPDATE users SET password_hash = ${passwordHash}, reset_token_hash = NULL, reset_token_expires_at = NULL
    WHERE id = ${usuario.id}
  `;

  const sesionToken = await crearSesionToken(usuario.id as string);
  setearCookieSesion(res, sesionToken);
  res.status(200).json({ email: usuario.email });
});
