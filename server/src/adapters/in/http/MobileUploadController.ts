import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { IGetSessionUserQuery } from '../../../application/ports/in/IGetSessionUserQuery.js';
import { requireAdmin } from './auth.js';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.3g2']);
const DEFAULT_DEVICE_ID = 'iphone';

function sanitizeSegment(value: string, fallback: string): string {
  const sanitized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/\.+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return sanitized || fallback;
}

function isPathInsideBase(baseDir: string, targetPath: string): boolean {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedBase, resolvedTarget);
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function removeExtension(filename: string): string {
  const extension = path.extname(filename);
  return extension ? filename.slice(0, -extension.length) : filename;
}

export class MobileUploadController {
  public readonly router: Router;
  private readonly stagingDir: string;
  private readonly upload: multer.Multer;

  constructor(
    private readonly getSessionUserUseCase: IGetSessionUserQuery,
    private readonly importDir: string
  ) {
    this.router = Router();
    this.stagingDir = path.join(this.importDir, '.mobile-staging');
    this.upload = multer({
      storage: multer.diskStorage({
        destination: async (_req, _file, callback) => {
          const uploadDir = path.join(this.stagingDir, randomUUID());
          try {
            await fs.mkdir(uploadDir, { recursive: true });
            callback(null, uploadDir);
          } catch (error) {
            callback(error as Error, uploadDir);
          }
        },
        filename: (_req, file, callback) => {
          callback(null, randomUUID() + path.extname(file.originalname).toLowerCase());
        }
      }),
      limits: {
        files: 1,
        fileSize: Number(process.env.MOBILE_UPLOAD_MAX_BYTES || 5 * 1024 * 1024 * 1024)
      }
    });
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/uploads', this.requireAdminSession.bind(this), this.upload.single('media') as any, async (req: Request, res: Response) => {
      let stagedPath: string | undefined;
      let stagedParent: string | undefined;

      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No se ha subido ningún archivo media.' });
        }

        stagedPath = req.file.path;
        stagedParent = path.dirname(stagedPath);
        const originalExtension = path.extname(req.file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(originalExtension)) {
          await this.cleanupStagedFile(stagedPath);
          return res.status(400).json({ error: `Archivo rechazado por extensión no soportada: ${originalExtension || 'sin extensión'}` });
        }

        const deviceId = sanitizeSegment(String(req.header('X-Device-Id') || DEFAULT_DEVICE_ID), DEFAULT_DEVICE_ID);
        const baseName = sanitizeSegment(removeExtension(path.basename(req.file.originalname)), 'media');
        const finalName = `${new Date().toISOString().replace(/[:.]/g, '-')}_${randomUUID()}_${baseName}${originalExtension}`;
        const finalPath = path.join(this.importDir, finalName);

        if (!isPathInsideBase(this.importDir, finalPath)) {
          await this.cleanupStagedFile(stagedPath);
          return res.status(400).json({ error: 'Ruta de destino inválida.' });
        }

        await fs.mkdir(this.importDir, { recursive: true });
        await fs.rename(stagedPath, finalPath);
        await this.cleanupEmptyDirectory(stagedParent);
        await this.cleanupEmptyDirectory(this.stagingDir);

        return res.status(202).json({
          status: 'accepted',
          deviceId,
          filename: path.basename(finalPath),
          importPath: path.basename(finalPath)
        });
      } catch (error: any) {
        if (stagedPath) await this.cleanupStagedFile(stagedPath);
        if (stagedParent) await this.cleanupEmptyDirectory(stagedParent);
        await this.cleanupEmptyDirectory(this.stagingDir);
        return res.status(500).json({ error: error.message || String(error) });
      }
    });
  }

  private async requireAdminSession(req: Request, res: Response, next: (error?: unknown) => void): Promise<void> {
    try {
      const user = await requireAdmin(req, res, this.getSessionUserUseCase);
      if (!user) return;
      next();
    } catch (error) {
      next(error);
    }
  }

  private async cleanupStagedFile(filePath: string): Promise<void> {
    if (isPathInsideBase(this.stagingDir, filePath)) {
      await fs.unlink(filePath).catch(() => undefined);
      await this.cleanupEmptyDirectory(path.dirname(filePath));
      await this.cleanupEmptyDirectory(this.stagingDir);
    }
  }

  private async cleanupEmptyDirectory(dirPath: string): Promise<void> {
    await fs.rmdir(dirPath).catch(() => undefined);
  }
}
