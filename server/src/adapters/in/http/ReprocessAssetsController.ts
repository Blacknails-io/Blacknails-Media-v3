import { Request, Response, Router } from 'express';
import type { IGetSessionUserQuery } from '../../../application/ports/in/IGetSessionUserQuery.js';
import type { IReprocessAssetsUseCase } from '../../../application/ports/in/IReprocessAssetsUseCase.js';
import { requireAdmin as requireAdminUser } from './auth.js';

export class ReprocessAssetsController {
  public readonly router: Router;

  constructor(
    private readonly getSessionUserUseCase: IGetSessionUserQuery,
    private readonly reprocessAssetsUseCase: IReprocessAssetsUseCase
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private async requireAdmin(req: Request, res: Response): Promise<boolean> {
    return (await requireAdminUser(req, res, this.getSessionUserUseCase)) !== null;
  }

  private setupRoutes(): void {
    this.router.post('/assets/reprocess', async (req: Request, res: Response) => {
      try {
        if (!(await this.requireAdmin(req, res))) return;
        const result = await this.reprocessAssetsUseCase.execute({
          assetIds: req.body?.assetIds,
          jobs: req.body?.jobs
        });
        res.status(202).json(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo reanalizar la selección.';
        res.status(400).json({ error: message });
      }
    });
  }
}
