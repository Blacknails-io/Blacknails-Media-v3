export type AssetType = 'PHOTO' | 'VIDEO';
export type SecurityClearance = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'CLASSIFIED';

export interface AssetMetadata {
  resolution?: string;
  duration?: string;
  gpsCoords?: string;
  encryption?: string;
  fileSize: string;
}

export interface MediaAsset {
  id: string;
  title: string;
  type: AssetType;
  description: string;
  tags: string[];
  date: string;
  imageUrl: string;
  videoPreviewUrl?: string;
  originalUrl: string;
  clearance: SecurityClearance;
  metadata: AssetMetadata;
}
