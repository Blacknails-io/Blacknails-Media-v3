import { MediaFile, OriginalFile, ThumbnailFile, PreviewFile, SidecarFile } from '../../../../domain/entities/MediaFile.js';
import { Resolution } from '../../../../domain/entities/ValueObjects.js';

export class MediaFileMapper {
  public static toDomain(row: any): MediaFile {
    const baseProps = {
      id: row.id,
      assetId: row.asset_id,
      currentPath: row.current_path,
      fileSize: row.file_size_bytes,
      fileHash: row.file_hash,
      extension: row.extension,
      createdAt: row.created_at
    };

    const normalizedRole = String(row.role ?? '').toUpperCase();
    switch (normalizedRole) {
      case 'ORIGINAL':
        return new OriginalFile({
          ...baseProps,
          sourceDevice: row.source_device || undefined,
          importDate: row.import_date || undefined,
          originalFilename: row.original_filename || undefined
        });
      case 'THUMBNAIL':
        const resolution: Resolution | undefined = row.width !== null && row.height !== null
          ? { width: row.width, height: row.height }
          : undefined;
        return new ThumbnailFile({
          ...baseProps,
          resolution,
          webpQuality: row.webp_quality || undefined
        });
      case 'PREVIEW':
        return new PreviewFile({
          ...baseProps,
          fps: row.fps || undefined,
          loopDurationMs: row.loop_duration_ms || undefined
        });
      case 'SIDECAR':
        return new SidecarFile({
          ...baseProps,
          schemaVersion: row.schema_version || undefined,
          xmlNamespace: row.xml_namespace || undefined
        });
      default:
        throw new Error(`[MediaFileMapper] Rol desconocido: ${row.role}`);
    }
  }

  public static toPersistence(entity: MediaFile): any {
    const row: any = {
      id: entity.id,
      asset_id: entity.assetId,
      role: entity.role,
      current_path: entity.currentPath,
      file_size_bytes: entity.fileSize,
      file_hash: entity.fileHash,
      extension: entity.extension,
      created_at: entity.createdAt,
      source_device: null,
      import_date: null,
      original_filename: null,
      width: null,
      height: null,
      webp_quality: null,
      fps: null,
      loop_duration_ms: null,
      schema_version: null,
      xml_namespace: null
    };

    if (entity instanceof OriginalFile) {
      row.source_device = (entity as OriginalFile).sourceDevice;
      row.import_date = (entity as OriginalFile).importDate;
      row.original_filename = (entity as OriginalFile).originalFilename;
    } else if (entity instanceof ThumbnailFile) {
      const res = (entity as ThumbnailFile).resolution;
      row.width = res?.width ?? null;
      row.height = res?.height ?? null;
      row.webp_quality = (entity as ThumbnailFile).webpQuality;
    } else if (entity instanceof PreviewFile) {
      row.fps = (entity as PreviewFile).fps;
      row.loop_duration_ms = (entity as PreviewFile).loopDurationMs;
    } else if (entity instanceof SidecarFile) {
      row.schema_version = (entity as SidecarFile).schemaVersion;
      row.xml_namespace = (entity as SidecarFile).xmlNamespace;
    }

    return row;
  }
}
