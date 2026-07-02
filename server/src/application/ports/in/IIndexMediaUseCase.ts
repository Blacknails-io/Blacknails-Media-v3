export interface IndexMediaRequest {
  mediaFileId: string;
}

export interface IndexMediaResponse {
  assetId: string;
  mediaFileId: string;
  assetType: 'PHOTO' | 'VIDEO';
}

export interface IIndexMediaUseCase {
  execute(request: IndexMediaRequest): Promise<IndexMediaResponse>;
}
