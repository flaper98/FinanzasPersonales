import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, asegurarEsquema } from '../_lib/db';
import { verificarPassword, crearSesionToken, setearCookieSesion } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
    return;
  }

  await asegurarEsquema();

  const emailNormalizado = email.trim().toLowerCase();
  const [usuario] = await sql`SELECT id, email, password_hash FROM users WHERE email = ${emailNormalizado}`;
  if (!usuario || !(await verificarPassword(password, usuario.password_hash as string))) {
    res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    return;
  }

  const token = await crearSesionToken(usuario.id as string);
  setearCookieSesion(res, token);
  res.status(200).json({ email: usuario.email });
}
