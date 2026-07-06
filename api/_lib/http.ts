import type { VercelRequest, VercelResponse } from '@vercel/node';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

/**
 * Envuelve un handler para que cualquier error no controlado (ej. falta una
 * variable de entorno, se cae la conexión a la base) responda con un JSON
 * 500 con el motivo, en vez de que Vercel muestre su página genérica de
 * "FUNCTION_INVOCATION_FAILED" sin ninguna pista de qué pasó.
 */
export function conManejoDeErrores(handler: Handler): Handler {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('Error no controlado:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Error interno del servidor.' });
      }
    }
  };
}
