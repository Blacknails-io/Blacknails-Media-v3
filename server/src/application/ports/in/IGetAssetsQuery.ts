export interface AssetDto {
  id: string;
  title: string;
  type: 'PHOTO' | 'VIDEO';
  description: string;
  tags: string[];
  date: string;
  imageUrl: string;
  videoPreviewUrl?: string;
  originalUrl: string;
  isNsfw?: boolean;
  nsfwReason?: string;
  people?: { id: string; name: string | null; label: string }[];
  clearance: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'CLASSIFIED';
  metadata: {
    resolution?: string;
    duration?: string;
    gpsCoords?: string;
    encryption?: string;
    fileSize: string;
  };
}

export interface ThinAssetDto {
  id: string;
  title: string;
  description: string;
  type: 'PHOTO' | 'VIDEO';
  date: string;
  imageUrl: string;
  videoPreviewUrl?: string;
  isNsfw?: boolean;
  metadata: {
    resolution?: string;
    fileSize: string;
  };
}

export interface IGetAssetsQuery {
  execute(): Promise<ThinAssetDto[]>;
}

export interface IGetAssetDetailsQuery {
  execute(id: string): Promise<AssetDto>;
}
