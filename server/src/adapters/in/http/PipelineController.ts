import { Request, Response, Router } from 'express';
import { IGetSessionUserQuery } from '../../../application/ports/in/IGetSessionUserQuery.js';
import { IPipelineCoordinator } from '../../../application/ports/in/IPipelineCoordinator.js';
import { requireAdmin as requireAdminUser } from './auth.js';

export class PipelineController {
  public readonly router: Router;

  constructor(
    private readonly getSessionUserUseCase: IGetSessionUserQuery,
    private readonly workerManager: IPipelineCoordinator
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private async requireAdmin(req: Request, res: Response): Promise<boolean> {
    return (await requireAdminUser(req, res, this.getSessionUserUseCase)) !== null;
  }

  private setupRoutes(): void {
    this.router.get('/workers', async (req: Request, res: Response) => {
      try {
        if (!(await this.requireAdmin(req, res))) return;
        res.json(await this.workerManager.describeAll());
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.router.get('/workers/:workerId', async (req: Request, res: Response) => {
      try {
        if (!(await this.requireAdmin(req, res))) return;
        const worker = this.workerManager.get(req.params.workerId);
        if (!worker) return res.status(404).json({ error: 'Worker no encontrado.' });
        res.json(await worker.describe());
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.router.post('/workers/:workerId/start', async (req: Request, res: Response) => {
      try {
        if (!(await this.requireAdmin(req, res))) return;
        const status = await this.workerManager.startWorker(req.params.workerId);
        if (!status) return res.status(404).json({ error: 'Worker no encontrado.' });
        res.json(status);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.router.post('/workers/:workerId/stop', async (req: Request, res: Response) => {
      try {
        if (!(await this.requireAdmin(req, res))) return;
        const status = await this.workerManager.stopWorker(req.params.workerId);
        if (!status) return res.status(404).json({ error: 'Worker no encontrado.' });
        res.json(status);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.router.post('/workers/:workerId/trigger', async (req: Request, res: Response) => {
      try {
        if (!(await this.requireAdmin(req, res))) return;
        const status = await this.workerManager.triggerWorker(req.params.workerId);
        if (!status) return res.status(404).json({ error: 'Worker no encontrado.' });
        res.json(status);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.router.post('/workers/:workerId/reset', async (req: Request, res: Response) => {
      try {
        if (!(await this.requireAdmin(req, res))) return;
        const status = await this.workerManager.resetWorker(req.params.workerId);
        if (!status) return res.status(404).json({ error: 'Worker no encontrado.' });
        res.json(status);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
  }
}
