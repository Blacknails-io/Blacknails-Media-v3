import { Asset } from '../../../domain/entities/Asset.js';

export interface ISidecarService {
  write(asset: Asset): Promise<string | undefined>;
}

