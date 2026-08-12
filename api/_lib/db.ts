import { neon } from '@neondatabase/serverless';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

type ClienteNeon = ReturnType<typeof neon<false, false>>;

let clienteReal: ClienteNeon | undefined;

function obtenerCliente(): ClienteNeon {
  if (!clienteReal) {
    clienteReal = neon(requireEnv('DATABASE_URL'));
  }
  return clienteReal;
}

/**
 * Cliente Neon con inicialización perezosa: si falta DATABASE_URL, el error
 * recién surge cuando se hace la primera consulta (dentro del try/catch del
 * handler), en vez de reventar la función entera al importar el módulo.
 */
export const sql: ClienteNeon = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  obtenerCliente()(strings, ...values)) as ClienteNeon;

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
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ`;
      await sql`
        CREATE TABLE IF NOT EXISTS finance_data (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          data JSONB NOT NULL DEFAULT '{"months":{}}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })().catch((err) => {
      esquemaListo = null; // permitir reintentar en la próxima request si falló
      throw err;
    });
  }
  return esquemaListo;
}
