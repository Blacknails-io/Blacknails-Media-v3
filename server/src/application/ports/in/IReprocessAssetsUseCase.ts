export type AssetReprocessJob = 'description' | 'nsfw' | 'faces';

export interface ReprocessAssetsCommand {
  assetIds: string[];
  jobs: AssetReprocessJob[];
}

export interface ReprocessAssetsResult {
  requested: number;
  accepted: number;
  missing: string[];
  jobs: AssetReprocessJob[];
}

export interface IReprocessAssetsUseCase {
  execute(command: ReprocessAssetsCommand): Promise<ReprocessAssetsResult>;
}
