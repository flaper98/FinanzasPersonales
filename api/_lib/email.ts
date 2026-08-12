function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

/** Envía un correo vía la API REST de Resend (resend.com). */
export async function enviarEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = requireEnv('RESEND_API_KEY');
  const from = requireEnv('EMAIL_FROM');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
  });

  if (!res.ok) {
    const texto = await res.text().catch(() => '');
    throw new Error(`No se pudo enviar el correo (${res.status}): ${texto}`);
  }
}
