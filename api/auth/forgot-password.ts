import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes, createHash } from 'node:crypto';
import { sql, asegurarEsquema } from '../_lib/db.js';
import { conManejoDeErrores } from '../_lib/http.js';
import { enviarEmail } from '../_lib/email.js';

const MINUTOS_EXPIRACION = 60;

function origenDesdeRequest(req: VercelRequest): string {
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host ?? 'localhost:5173';
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export default conManejoDeErrores(async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  const { email } = req.body ?? {};
  if (typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ error: 'Ingresa tu correo.' });
    return;
  }
  const emailNormalizado = email.trim().toLowerCase();

  await asegurarEsquema();

  const [usuario] = await sql`SELECT id FROM users WHERE email = ${emailNormalizado}`;

  if (usuario) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiraEn = new Date(Date.now() + MINUTOS_EXPIRACION * 60_000);

    await sql`
      UPDATE users SET reset_token_hash = ${tokenHash}, reset_token_expires_at = ${expiraEn.toISOString()}
      WHERE id = ${usuario.id}
    `;

    const link = `${origenDesdeRequest(req)}/?reset=${token}`;
    await enviarEmail({
      to: emailNormalizado,
      subject: 'Restablecer tu contraseña — Mis Finanzas',
      html: `
        <p>Pediste restablecer tu contraseña en Mis Finanzas.</p>
        <p><a href="${link}">Hacé clic acá para elegir una contraseña nueva</a></p>
        <p>El link vence en ${MINUTOS_EXPIRACION} minutos. Si no pediste esto, podés ignorar este correo.</p>
      `,
    });
  }

  // Misma respuesta exista o no la cuenta, para no revelar qué correos están registrados.
  res.status(200).json({ ok: true });
});
