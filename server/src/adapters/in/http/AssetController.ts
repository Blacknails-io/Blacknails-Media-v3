import { Request, Response } from 'express';
import { IGetAssetsQuery, IGetAssetDetailsQuery } from '../../../application/ports/in/IGetAssetsQuery.js';

export class AssetController {
  constructor(
    private getAssetsUseCase: IGetAssetsQuery,
    private getAssetDetailsUseCase: IGetAssetDetailsQuery
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
}

