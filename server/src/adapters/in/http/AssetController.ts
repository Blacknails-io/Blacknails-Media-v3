import { Request, Response } from 'express';
import { IGetAssetsQuery, IGetAssetDetailsQuery } from '../../../application/ports/in/IGetAssetsQuery.js';

import { IUnitOfWork } from '../../../application/ports/out/IUnitOfWork.js';
import fs from 'fs';
import path from 'path';

export class AssetController {
  constructor(
    private getAssetsUseCase: IGetAssetsQuery,
    private getAssetDetailsUseCase: IGetAssetDetailsQuery,
    private uow: IUnitOfWork
  ) {}

  public getAssets = async (req: Request, res: Response): Promise<void> => {
    try {
      const assets = await this.getAssetsUseCase.execute();
      res.status(200).json(assets);
    } catch (error: any) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  public getAssetDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const asset = await this.getAssetDetailsUseCase.execute(id);
      res.status(200).json(asset);
    } catch (error: any) {
      console.error(`Error fetching asset details for ${req.params.id}:`, error);
      if (error.message && error.message.includes('not found')) {
        res.status(404).json({ error: 'Asset not found' });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  };

  public getAssetMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const type = req.query.type as string; // 'thumbnail' | 'preview' | 'original'

      const asset = await this.uow.assets.getById(id);
      if (!asset) {
        res.status(404).json({ error: 'Asset not found' });
        return;
      }

      let filePathToServe: string | undefined;

      if (type === 'thumbnail') {
        filePathToServe = asset.aiThumbnailPath || asset.thumbnailPath;
      } else if (type === 'preview') {
        filePathToServe = asset.videoPreviewPath; // TODO: add image preview if we separate it
      }

      // If no optimized proxy exists or 'original' is requested, fallback to the original file
      if (!filePathToServe || type === 'original') {
        const mediaFiles = await this.uow.mediaFiles.getByAssetId(asset.id);
        const originalFile = mediaFiles.find(m => m.role === 'ORIGINAL') || mediaFiles[0];
        if (originalFile && originalFile.currentPath) {
          filePathToServe = originalFile.currentPath;
        }
      }

      if (filePathToServe && fs.existsSync(filePathToServe)) {
        res.sendFile(path.resolve(filePathToServe));
      } else {
        res.status(404).json({ error: 'Media file not found on disk' });
      }
    } catch (error: any) {
      console.error(`Error fetching media for asset ${req.params.id}:`, error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
