import { Request, Response } from 'express';
import { IGetAssetsQuery } from '../../../application/ports/in/IGetAssetsQuery.js';

export class AssetController {
  constructor(private getAssetsUseCase: IGetAssetsQuery) {}

  public getAssets = async (req: Request, res: Response): Promise<void> => {
    try {
      const assets = await this.getAssetsUseCase.execute();
      res.status(200).json(assets);
    } catch (error: any) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
