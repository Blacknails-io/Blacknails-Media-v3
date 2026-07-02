import { Request, Response } from 'express';
import { IGetSessionUserQuery } from '../../../application/ports/in/IGetSessionUserQuery.js';
import { User } from '../../../domain/entities/User.js';

const SESSION_COOKIE_NAME = 'bn_session';

function shouldUseSecureCookie(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';
}

function serializeCookie(name: string, value: string, attributes: string[]): string {
  return [name + '=' + encodeURIComponent(value), ...attributes].join('; ');
}

function getCookieToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((part) => part.trim());
  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex === -1) continue;

    const name = cookie.slice(0, separatorIndex);
    if (name !== SESSION_COOKIE_NAME) continue;

    const value = cookie.slice(separatorIndex + 1);
    return value ? decodeURIComponent(value) : null;
  }

  return null;
}

export function createSessionCookie(token: string, expiresAt: string): string {
  const attributes = [
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Expires=' + new Date(expiresAt).toUTCString()
  ];

  if (shouldUseSecureCookie()) {
    attributes.push('Secure');
  }

  return serializeCookie(SESSION_COOKIE_NAME, token, attributes);
}

export function clearSessionCookie(): string {
  const attributes = [
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];

  if (shouldUseSecureCookie()) {
    attributes.push('Secure');
  }

  return serializeCookie(SESSION_COOKIE_NAME, '', attributes);
}

export function getBearerToken(req: Request): string | null {
  const authorization = req.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token || null;
}

export async function requireUser(
  req: Request,
  res: Response,
  getSessionUserUseCase: IGetSessionUserQuery
): Promise<User | null> {
  const token = getBearerToken(req) || getCookieToken(req);
  if (!token) {
    res.status(401).json({ error: 'No autorizado. Se requiere sesión válida.' });
    return null;
  }

  const user = await getSessionUserUseCase.execute(token);
  if (!user) {
    res.status(401).json({ error: 'Sesión inválida o expirada.' });
    return null;
  }

  return user;
}

export async function requireAdmin(
  req: Request,
  res: Response,
  getSessionUserUseCase: IGetSessionUserQuery
): Promise<User | null> {
  const user = await requireUser(req, res, getSessionUserUseCase);
  if (!user) return null;

  if (user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    return null;
  }

  return user;
}
