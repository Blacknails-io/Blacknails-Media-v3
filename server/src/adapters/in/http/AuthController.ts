import { Router, Request, Response } from 'express';
import { ILoginUseCase } from '../../../application/ports/in/ILoginUseCase.js';
import { IRegisterUseCase } from '../../../application/ports/in/IRegisterUseCase.js';
import { IGetSessionUserQuery } from '../../../application/ports/in/IGetSessionUserQuery.js';
import { IUpdateAvatarUseCase } from '../../../application/ports/in/IUpdateAvatarUseCase.js';
import { IEventBus } from '../../../application/ports/out/IEventBus.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import {
  AuthSuccessEvent,
  AuthFailedEvent,
  UserDomainEvent,
  SessionDomainEvent
} from '../../../application/events/SystemEvents.js';
import { requireUser } from './auth.js';

export class AuthController {
  public readonly router: Router;

  constructor(
    private loginUseCase: ILoginUseCase,
    private registerUseCase: IRegisterUseCase,
    private getSessionUserUseCase: IGetSessionUserQuery,
    private eventBus: IEventBus,
    private updateAvatarUseCase: IUpdateAvatarUseCase
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // POST /api/auth/register
    this.router.post('/register', async (req: Request, res: Response) => {
      try {
        if (process.env.ALLOW_PUBLIC_REGISTRATION !== 'true') {
          return res.status(403).json({ error: 'Registro público desactivado.' });
        }

        const { username, password } = req.body;
        if (!username || !password) {
          return res.status(400).json({ error: 'Faltan campos requeridos: username, password' });
        }

        const result = await this.registerUseCase.execute({
          username,
          passwordRaw: password,
          role: 'VIEWER'
        });

        // Publicamos evento de dominio de usuario creado
        this.eventBus.publish(new UserDomainEvent(
          result.id,
          'CREATED',
          'AUTH_CONTROLLER',
          `Usuario nuevo '${username}' registrado con rol [VIEWER].`
        ));

        res.status(201).json(result);
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    });

    // POST /api/auth/login
    this.router.post('/login', async (req: Request, res: Response) => {
      const username = req.body.username;
      console.log(`[AuthController] Intentando POST /login para el usuario: '${username}'`);
      try {
        const { password } = req.body;
        if (!username || !password) {
          return res.status(400).json({ error: 'Faltan campos requeridos: username, password' });
        }

        const result = await this.loginUseCase.execute({
          username,
          passwordRaw: password
        });

        console.log(`[AuthController] Login EXITOSO para: '${username}'`);

        // Publicamos evento de sistema exitoso
        this.eventBus.publish(new AuthSuccessEvent(
          'AUTH_CONTROLLER',
          `Acceso concedido al usuario '${username}' con rol [${result.role}].`
        ));

        // Publicamos eventos de dominio correspondientes
        this.eventBus.publish(new UserDomainEvent(
          result.userId,
          'LOGIN',
          'AUTH_CONTROLLER',
          `Usuario '${username}' ha iniciado sesión.`
        ));

        this.eventBus.publish(new SessionDomainEvent(
          result.token,
          'STARTED',
          'AUTH_CONTROLLER',
          `Sesión iniciada para el token '${result.token.substring(0, 8)}...'.`
        ));

        res.json(result);
      } catch (err: any) {
        console.error(`[AuthController] Login FALLIDO para '${username}':`, err.message);

        // Publicamos evento de sistema fallido
        this.eventBus.publish(new AuthFailedEvent(
          'AUTH_CONTROLLER',
          `Acceso denegado para el usuario '${username || 'desconocido'}': ${err.message}.`
        ));

        res.status(401).json({ error: err.message });
      }
    });

    // GET /api/auth/me
    this.router.get('/me', async (req: Request, res: Response) => {
      try {
        const user = await requireUser(req, res, this.getSessionUserUseCase);
        if (!user) return;

        res.json({
          id: user.id,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          avatarUrl: user.avatarUrl
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // POST /api/auth/me/avatar
    const upload = multer({ dest: './data/tmp/' });
    this.router.post('/me/avatar', upload.single('avatar') as any, async (req: Request, res: Response) => {
      try {
        const user = await requireUser(req, res, this.getSessionUserUseCase);
        if (!user) {
          if (req.file) fs.unlinkSync(req.file.path);
          return;
        }

        if (!req.file) {
          return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
        }

        const updatedUser = await this.updateAvatarUseCase.execute({
          userId: user.id,
          tempFilePath: req.file.path
        });

        res.json({
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          createdAt: updatedUser.createdAt,
          avatarUrl: updatedUser.avatarUrl
        });
      } catch (err: any) {
        console.error('Avatar upload error:', err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message });
      }
    });
  }
}
