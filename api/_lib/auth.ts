import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { serialize, parse } from 'cookie';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE_NAME = 'sesion';
const DIAS_EXPIRACION = 30;

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Falta la variable de entorno JWT_SECRET.');
  return new TextEncoder().encode(secret);
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verificarPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function crearSesionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DIAS_EXPIRACION}d`)
    .sign(jwtSecret());
}

async function verificarSesionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

function cookieOpciones(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function setearCookieSesion(res: VercelResponse, token: string): void {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, token, cookieOpciones(DIAS_EXPIRACION * 24 * 60 * 60)));
}

export function borrarCookieSesion(res: VercelResponse): void {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', cookieOpciones(0)));
}

/** Devuelve el id del usuario autenticado según la cookie de sesión, o null si no hay sesión válida. */
export async function obtenerUserId(req: VercelRequest): Promise<string | null> {
  const cookies = parse(req.headers.cookie ?? '');
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verificarSesionToken(token);
}
