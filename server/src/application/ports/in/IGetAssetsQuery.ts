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
  clearance: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'CLASSIFIED';
  metadata: {
    resolution?: string;
    duration?: string;
    gpsCoords?: string;
    encryption?: string;
    fileSize: string;
  };
}

export interface IGetAssetsQuery {
  execute(): Promise<AssetDto[]>;
}
