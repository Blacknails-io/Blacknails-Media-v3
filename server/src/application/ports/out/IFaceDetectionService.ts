export interface DetectedFace {
  bbox: [number, number, number, number];
  confidence: number;
  embedding: number[];
}

export interface IFaceDetectionService {
  detect(imagePath: string): Promise<DetectedFace[]>;
}

