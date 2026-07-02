import { Router, Request, Response } from 'express';
import { IGetSessionUserQuery } from '../../../application/ports/in/IGetSessionUserQuery.js';
import { IListUsersQuery } from '../../../application/ports/in/IListUsersQuery.js';
import { IUpdateUserRoleUseCase } from '../../../application/ports/in/IUpdateUserRoleUseCase.js';
import { IDeleteUserUseCase } from '../../../application/ports/in/IDeleteUserUseCase.js';
import { IUpdateUserActiveUseCase } from '../../../application/ports/in/IUpdateUserActiveUseCase.js';
import { User } from '../../../domain/entities/User.js';
import { requireAdmin } from './auth.js';

export class AdminUsersController {
  public readonly router: Router;

  constructor(
    private getSessionUserUseCase: IGetSessionUserQuery,
    private listUsersUseCase: IListUsersQuery,
    private updateUserRoleUseCase: IUpdateUserRoleUseCase,
    private deleteUserUseCase: IDeleteUserUseCase,
    private updateUserActiveUseCase: IUpdateUserActiveUseCase
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private async getAdminUser(req: Request, res: Response): Promise<User | null> {
    return requireAdmin(req, res, this.getSessionUserUseCase);
  }

  private setupRoutes(): void {
    this.router.get('/users', async (req: Request, res: Response) => {
      try {
        const adminUser = await this.getAdminUser(req, res);
        if (!adminUser) return;

        const users = await this.listUsersUseCase.execute();
        res.json(users);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    this.router.patch('/users/:userId/role', async (req: Request, res: Response) => {
      try {
        const adminUser = await this.getAdminUser(req, res);
        if (!adminUser) return;

        const { userId } = req.params;
        const { role } = req.body;

        if (!userId || !role) {
          return res.status(400).json({ error: 'Faltan campos requeridos: userId, role' });
        }

        if (adminUser.id === userId && role !== 'ADMIN') {
          return res.status(400).json({ error: 'No puedes quitarte permisos de administrador a ti mismo.' });
        }

        const result = await this.updateUserRoleUseCase.execute({
          userId,
          role
        });

        res.json(result);
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    });

    this.router.delete('/users/:userId', async (req: Request, res: Response) => {
      try {
        const adminUser = await this.getAdminUser(req, res);
        if (!adminUser) return;

        const { userId } = req.params;
        if (!userId) {
          return res.status(400).json({ error: 'Falta el identificador del usuario.' });
        }

        if (adminUser.id === userId) {
          return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta desde esta pantalla.' });
        }

        const result = await this.deleteUserUseCase.execute({ userId });
        res.json(result);
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    });

    this.router.patch('/users/:userId/active', async (req: Request, res: Response) => {
      try {
        const adminUser = await this.getAdminUser(req, res);
        if (!adminUser) return;

        const { userId } = req.params;
        const { isActive } = req.body;

        if (!userId || typeof isActive !== 'boolean') {
          return res.status(400).json({ error: 'Faltan campos requeridos: userId, isActive' });
        }

        if (adminUser.id === userId && isActive === false) {
          return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta desde esta pantalla.' });
        }

        const result = await this.updateUserActiveUseCase.execute({
          userId,
          isActive
        });

        res.json(result);
      } catch (err: any) {
        res.status(400).json({ error: err.message });
      }
    });
  }
}
