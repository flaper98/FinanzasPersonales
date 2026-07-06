import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, asegurarEsquema } from '../_lib/db.js';
import { hashPassword, crearSesionToken, setearCookieSesion } from '../_lib/auth.js';
import { conManejoDeErrores } from '../_lib/http.js';

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default conManejoDeErrores(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || !emailValido(email) || password.length < 8) {
    res.status(400).json({ error: 'Ingresa un correo válido y una contraseña de al menos 8 caracteres.' });
    return;
  }
  const emailNormalizado = email.trim().toLowerCase();

  await asegurarEsquema();

  const existentes = await sql`SELECT id FROM users WHERE email = ${emailNormalizado}`;
  if (existentes.length > 0) {
    res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [usuario] = await sql`
    INSERT INTO users (email, password_hash) VALUES (${emailNormalizado}, ${passwordHash})
    RETURNING id, email
  `;
  await sql`INSERT INTO finance_data (user_id) VALUES (${usuario.id})`;

  const token = await crearSesionToken(usuario.id);
  setearCookieSesion(res, token);
  res.status(201).json({ email: usuario.email });
});
