export interface PurgeMediaResponse {
  purgedMediaFilesCount: number;
  purgedAssetsCount: number;
  purgedPersonsCount: number;
}

export interface IPurgeMediaUseCase {
  execute(): Promise<PurgeMediaResponse>;
}
