import { Request, Response } from 'express';
import { IGetSessionUserQuery } from '../../../application/ports/in/IGetSessionUserQuery.js';
import { User } from '../../../domain/entities/User.js';

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
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'No autorizado. Se requiere token Bearer.' });
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
