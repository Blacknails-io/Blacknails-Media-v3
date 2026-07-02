import { IVectorMemoryService, VectorPayload } from '../../../application/ports/out/IVectorMemoryService.js';

export class QdrantVectorMemoryService implements IVectorMemoryService {
  constructor(private readonly baseUrl: string) {}

  public async upsert(collection: string, item: VectorPayload): Promise<void> {
    const endpoint = `${this.baseUrl.replace(/\/$/, '')}/collections/${collection}/points?wait=true`;
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        points: [
          {
            id: item.id,
            vector: item.vector,
            payload: item.payload
          }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Qdrant upsert failed (${response.status}): ${body}`);
    }
  }
}

