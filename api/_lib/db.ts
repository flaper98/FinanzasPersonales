import { neon } from '@neondatabase/serverless';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

export const sql = neon(requireEnv('DATABASE_URL'));

let esquemaListo: Promise<void> | null = null;

/** Crea las tablas si no existen. Se llama una vez por invocación fría de la función. */
export function asegurarEsquema(): Promise<void> {
  if (!esquemaListo) {
    esquemaListo = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS finance_data (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          data JSONB NOT NULL DEFAULT '{"months":{}}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })();
  }
  return esquemaListo;
}
