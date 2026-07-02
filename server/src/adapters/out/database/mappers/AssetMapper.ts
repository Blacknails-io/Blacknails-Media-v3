import { Asset, Photo, Video } from '../../../../domain/entities/Asset.js';
import { Location, ExifData, Resolution } from '../../../../domain/entities/ValueObjects.js';

export class AssetMapper {
  public static toDomain(row: any): Asset {
    const location: Location | undefined = row.latitude !== null && row.longitude !== null
      ? {
          latitude: row.latitude,
          longitude: row.longitude,
          altitude: row.altitude !== null ? row.altitude : undefined,
          country: row.country || undefined,
          city: row.city || undefined
        }
      : undefined;

    const resolution: Resolution | undefined = row.width !== null && row.height !== null
      ? { width: row.width, height: row.height }
      : undefined;

    const baseProps = {
      id: row.id,
      dateTaken: row.date_taken,
      timezoneOffset: row.timezone_offset,
      location,
      indexedAt: row.indexed_at || undefined,
      aiProcessedAt: row.ai_processed_at || undefined,
      thumbnailPath: row.thumbnail_path || undefined,
      aiThumbnailPath: row.ai_thumbnail_path || undefined,
      videoPreviewPath: row.video_preview_path || undefined,
      aiDescription: row.ai_description || undefined,
      tags: row.tags_json ? JSON.parse(row.tags_json) : [],
      title: row.title || undefined,
      sidecarPath: row.sidecar_path || undefined,
      isNsfw: typeof row.is_nsfw === 'number' ? Boolean(row.is_nsfw) : row.is_nsfw ?? undefined,
      nsfwReason: row.nsfw_reason || undefined,
      tagNsfwScores: row.tag_nsfw_scores_json ? JSON.parse(row.tag_nsfw_scores_json) : null,
      describedAt: row.described_at || undefined,
      taggedAt: row.tagged_at || undefined,
      titledAt: row.titled_at || undefined,
      facesProcessedAt: row.faces_processed_at || undefined,
      nsfwProcessedAt: row.nsfw_processed_at || undefined
    };

    if (row.asset_type === 'PHOTO') {
      let exif: ExifData | undefined;
      if (row.exif_json) {
        try {
          exif = JSON.parse(row.exif_json);
        } catch {
          // Si falla, se queda vacío
        }
      }

      return new Photo({
        ...baseProps,
        resolution,
        exif
      });
    } else {
      return new Video({
        ...baseProps,
        resolution,
        durationSeconds: row.duration_seconds || 0,
        framerate: row.framerate || 0,
        videoCodec: row.video_codec || undefined,
        audioCodec: row.audio_codec || undefined
      });
    }
  }

  public static toPersistence(entity: Asset): any {
    const isPhoto = entity instanceof Photo;
    const isVideo = entity instanceof Video;

    const resolution = isPhoto ? (entity as Photo).resolution : isVideo ? (entity as Video).resolution : undefined;

    return {
      id: entity.id,
      asset_type: entity.assetType,
      date_taken: entity.dateTaken,
      timezone_offset: entity.timezoneOffset,
      width: resolution?.width ?? null,
      height: resolution?.height ?? null,
      latitude: entity.location?.latitude ?? null,
      longitude: entity.location?.longitude ?? null,
      altitude: entity.location?.altitude ?? null,
      country: entity.location?.country ?? null,
      city: entity.location?.city ?? null,
      
      // Específicos de Foto
      exif_json: isPhoto && (entity as Photo).exif ? JSON.stringify((entity as Photo).exif) : null,

      // Específicos de Video
      duration_seconds: isVideo ? (entity as Video).durationSeconds : null,
      framerate: isVideo ? (entity as Video).framerate : null,
      video_codec: isVideo ? (entity as Video).videoCodec ?? null : null,
      audio_codec: isVideo ? (entity as Video).audioCodec ?? null : null,

      // Timestamps de procesamiento
      indexed_at: entity.indexedAt ?? null,
      ai_processed_at: entity.aiProcessedAt ?? null,
      thumbnail_path: entity.thumbnailPath ?? null,
      ai_thumbnail_path: entity.aiThumbnailPath ?? null,
      video_preview_path: entity.videoPreviewPath ?? null,
      ai_description: entity.aiDescription ?? null,
      tags_json: entity.tags?.length ? JSON.stringify(entity.tags) : null,
      title: entity.title ?? null,
      sidecar_path: entity.sidecarPath ?? null,
      is_nsfw: typeof entity.isNsfw === 'boolean' ? Number(entity.isNsfw) : entity.isNsfw ?? null,
      nsfw_reason: entity.nsfwReason ?? null,
      tag_nsfw_scores_json: entity.tagNsfwScores ? JSON.stringify(entity.tagNsfwScores) : null,
      described_at: entity.describedAt ?? null,
      tagged_at: entity.taggedAt ?? null,
      titled_at: entity.titledAt ?? null,
      faces_processed_at: entity.facesProcessedAt ?? null,
      nsfw_processed_at: entity.nsfwProcessedAt ?? null
    };
  }
}
