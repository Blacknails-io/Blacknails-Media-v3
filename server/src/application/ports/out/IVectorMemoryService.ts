export interface VectorPayload {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export interface IVectorMemoryService {
  upsert(collection: string, item: VectorPayload): Promise<void>;
}

