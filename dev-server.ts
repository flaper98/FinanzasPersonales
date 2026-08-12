/**
 * Servidor local para probar las funciones de /api sin necesitar el CLI de
 * Vercel (ni login). Corre los mismos handlers de /api directamente sobre
 * Node, con un pequeño shim de request/response compatible con lo que
 * esperan (req.body ya parseado, res.status().json()). Vite hace de proxy
 * de /api hacia acá (ver vite.config.ts), así el navegador ve un solo origen,
 * igual que en producción.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

try {
  process.loadEnvFile('.env');
} catch {
  // Sin .env (ej. en producción real esto no se usa, ver vercel.json / funciones de Vercel).
}

const PORT = 3001;

interface ResConVercelHelpers extends ServerResponse {
  status: (code: number) => ResConVercelHelpers;
  json: (body: unknown) => void;
}

function conHelpers(res: ServerResponse): ResConVercelHelpers {
  const r = res as ResConVercelHelpers;
  r.status = (code: number) => {
    r.statusCode = code;
    return r;
  };
  r.json = (body: unknown) => {
    if (!r.getHeader('Content-Type')) r.setHeader('Content-Type', 'application/json');
    r.end(JSON.stringify(body));
  };
  return r;
}

async function leerBody(req: IncomingMessage): Promise<unknown> {
  const partes: Buffer[] = [];
  for await (const parte of req) partes.push(parte as Buffer);
  const texto = Buffer.concat(partes).toString('utf-8');
  if (!texto) return undefined;
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}

const rutas: Record<string, () => Promise<{ default: (req: never, res: never) => unknown }>> = {
  '/api/auth/register': () => import('./api/auth/register.ts'),
  '/api/auth/login': () => import('./api/auth/login.ts'),
  '/api/auth/logout': () => import('./api/auth/logout.ts'),
  '/api/auth/me': () => import('./api/auth/me.ts'),
  '/api/auth/forgot-password': () => import('./api/auth/forgot-password.ts'),
  '/api/auth/reset-password': () => import('./api/auth/reset-password.ts'),
  '/api/finance': () => import('./api/finance.ts'),
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const cargarModulo = rutas[url.pathname];
  const wrapped = conHelpers(res);

  if (!cargarModulo) {
    wrapped.status(404).json({ error: 'Ruta no encontrada.' });
    return;
  }

  try {
    const mod = await cargarModulo();
    if (req.method && req.method !== 'GET') {
      (req as IncomingMessage & { body?: unknown }).body = await leerBody(req);
    }
    await mod.default(req as never, wrapped as never);
  } catch (err) {
    console.error(`Error en ${url.pathname}:`, err);
    if (!res.headersSent) wrapped.status(500).json({ error: 'Error interno del servidor.' });
  }
});

server.listen(PORT, () => {
  console.log(`API local (sin Vercel) escuchando en http://localhost:${PORT}`);
});
