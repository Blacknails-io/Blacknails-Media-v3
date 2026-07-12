import { Asset } from '../../../domain/entities/Asset.js';
import type { AssetReprocessJob } from '../in/IReprocessAssetsUseCase.js';

export interface IAssetRepository {
  save(asset: Asset): Promise<void>;
  getById(id: string): Promise<Asset | null>;
  getByDateTaken(dateTaken: string): Promise<Asset | null>;
  getByOriginalFileHash(fileHash: string): Promise<Asset | null>;
  getAll(): Promise<Asset[]>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<number>;
  getAssetsByPersonId(personId: string): Promise<Asset[]>;
  markForReprocessing(assetIds: string[], jobs: AssetReprocessJob[]): Promise<{ accepted: string[]; missing: string[] }>;
}
