import { IVectorMemoryService, VectorPayload } from '../../../application/ports/out/IVectorMemoryService.js';

export class NoopVectorMemoryService implements IVectorMemoryService {
  public async upsert(_collection: string, _item: VectorPayload): Promise<void> {}
}

