export interface Location {
  readonly latitude: number;
  readonly longitude: number;
  readonly altitude?: number;
  readonly country?: string;
  readonly city?: string;
}

export interface ExifData {
  readonly cameraMake?: string;
  readonly cameraModel?: string;
  readonly lens?: string;
  readonly focalLength?: string;
  readonly fNumber?: string;
  readonly exposureTime?: string;
  readonly iso?: number;
}

export interface Resolution {
  readonly width: number;
  readonly height: number;
}

export interface AITag {
  readonly name: string;
  readonly confidence: number;
}

export interface AIMetadata {
  readonly title?: string;
  readonly description?: string;
  readonly tags: AITag[];
  readonly facesDetected: number;
  readonly dominantColor?: string;
  readonly orientation: 'landscape' | 'portrait' | 'square';
}
