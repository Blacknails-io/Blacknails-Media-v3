import { Face } from '../../domain/entities/Face.js';
import { Asset, Video } from '../../domain/entities/Asset.js';
import { IFaceRepository } from '../ports/out/IFaceRepository.js';
import { IFaceDetectionService } from '../ports/out/IFaceDetectionService.js';
import { IVectorMemoryService } from '../ports/out/IVectorMemoryService.js';
import { IOllamaService } from '../ports/out/IOllamaService.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { BaseAssetWorker } from './BaseAssetWorker.js';
import { FaceDomainEvent } from '../events/SystemEvents.js';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);
const VIDEO_FACE_FRAME_COUNT = 5;
const VIDEO_FACE_FRAME_VALIDATION_PROMPT = [
  "Return only strict JSON with fields store_faces:boolean and reason:string.",
  "Set store_faces to true only when this frame looks like real video content with actual human faces visible in the scene.",
  "Set store_faces to false for opening credits, end credits, title cards, posters, thumbnails, logos, text-only screens, drawings, or faces that are only part of graphic or credit material."
].join(" ");

export function getVideoFaceSamplingTimestamps(durationSeconds: number, frameCount = VIDEO_FACE_FRAME_COUNT): number[] {
  const duration = Number.isFinite(durationSeconds) ? Math.max(0, durationSeconds) : 0;
  if (duration <= 0) return [0];

  const samples = Math.max(1, Math.floor(frameCount));
  if (samples === 1) return [duration / 2];

  const startRatio = duration >= 60 ? 0.25 : duration >= 20 ? 0.15 : 0.1;
  const endRatio = 0.9;
  const start = duration * startRatio;
  const end = duration * endRatio;
  if (end <= start) return [duration / 2];

  return Array.from({ length: samples }, (_, index) => {
    const offset = (index + 0.5) / samples;
    return start + (end - start) * offset;
  });
}


export class FaceTaskRunner extends BaseAssetWorker {
  public readonly id = 'face-worker';
  public readonly label = 'Face Detection';
  public readonly provides = ['faces'];
  public readonly requires = ['image_transcodes', 'video_transcodes'];

  constructor(
    eventBus: IEventBus,
    uow: IUnitOfWork,
    public readonly intervalMs: number,
    private readonly faceRepository: IFaceRepository,
    private readonly detector: IFaceDetectionService,
    private readonly vectorMemory: IVectorMemoryService,
    private readonly ollama?: IOllamaService,
    batchSize = 10
  ) {
    super(eventBus, uow, batchSize);
  }

  protected acquireResources(): boolean {
    return true;
  }

  protected releaseResources(): void {
  }

  protected isPending(asset: Asset): boolean {
    return Boolean(asset.aiThumbnailPath || asset.thumbnailPath) && !asset.facesProcessedAt;
  }

  private async shouldStoreVideoFrameFaces(framePath: string): Promise<boolean> {
    if (!this.ollama) return true;

    try {
      const raw = await this.ollama.describeImage(framePath, VIDEO_FACE_FRAME_VALIDATION_PROMPT, 'face-validation');
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return true;

      const parsed = JSON.parse(match[0]) as Record<string, unknown>;
      if (typeof parsed.store_faces !== "boolean") return true;
      return parsed.store_faces;
    } catch (error) {
      console.error(`[FaceTaskRunner] Error validating video frame with Ollama:`, error);
      return true;
    }
  }

  protected async processAsset(asset: Asset): Promise<void> {
    const imagePath = asset.aiThumbnailPath || asset.thumbnailPath;
    if (!imagePath) return;

    await this.faceRepository.deleteFacesForPhoto(asset.id);

    if (asset.assetType === 'VIDEO') {
      const mediaFiles = await this.uow.mediaFiles.getByAssetId(asset.id);
      const original = mediaFiles.find((media) => media.role === 'ORIGINAL');
      if (original) {
        const duration = (asset as Video).durationSeconds || 0;
        const timestamps = getVideoFaceSamplingTimestamps(duration);

        const thumbsDir = path.dirname(imagePath);
        await fs.mkdir(thumbsDir, { recursive: true });
        for (let i = 0; i < timestamps.length; i++) {
          const timestamp = timestamps[i];
          const tempFramePath = path.join(thumbsDir, `${asset.id}_temp_frame_${i}.webp`);
          try {
            await execFileAsync('ffmpeg', [
              '-v', 'error', '-y',
              '-ss', timestamp.toFixed(2),
              '-i', original.currentPath,
              '-frames:v', '1',
              '-vf', 'scale=640:-2',
              tempFramePath
            ]);

            const faces = await this.detector.detect(tempFramePath);
            if (faces.length === 0) continue;

            const shouldStoreFaces = await this.shouldStoreVideoFrameFaces(tempFramePath);
            if (!shouldStoreFaces) continue;

            for (const detected of faces) {
              const face = new Face({
                photoId: asset.id,
                embedding: detected.embedding,
                bbox: {
                  x: detected.bbox[0],
                  y: detected.bbox[1],
                  width: detected.bbox[2],
                  height: detected.bbox[3]
                }
              });

              await this.faceRepository.saveFace(face);
              await this.vectorMemory.upsert('faces', {
                id: face.id,
                vector: face.embedding,
                payload: { photo_id: asset.id }
              });

              await this.eventBus.publish(new FaceDomainEvent(
                face.id,
                'DETECTED',
                this.id,
                `Rostro detectado en video '${asset.id}' en fotograma a los ${timestamp.toFixed(2)}s en coordenadas (${face.bbox.x}, ${face.bbox.y}).`
              ));
            }
          } catch (err) {
            console.error(`[FaceTaskRunner] Error processing frame at ${timestamp}s for video ${asset.id}:`, err);
          } finally {
            await fs.unlink(tempFramePath).catch(() => {});
          }
        }
      }
    } else {
      const faces = await this.detector.detect(imagePath);
      for (const detected of faces) {
        const face = new Face({
          photoId: asset.id,
          embedding: detected.embedding,
          bbox: {
            x: detected.bbox[0],
            y: detected.bbox[1],
            width: detected.bbox[2],
            height: detected.bbox[3]
          }
        });

        await this.faceRepository.saveFace(face);
        await this.vectorMemory.upsert('faces', {
          id: face.id,
          vector: face.embedding,
          payload: { photo_id: asset.id }
        });

        await this.eventBus.publish(new FaceDomainEvent(
          face.id,
          'DETECTED',
          this.id,
          `Rostro detectado en foto '${asset.id}' en coordenadas (${face.bbox.x}, ${face.bbox.y}).`
        ));
      }
    }

    asset.facesProcessedAt = new Date().toISOString();
    await this.uow.assets.save(asset);
  }
}

