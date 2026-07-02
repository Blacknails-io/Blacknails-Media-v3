import Database from 'better-sqlite3';
import { IMediaFileRepository } from '../../../application/ports/out/IMediaFileRepository.js';
import { MediaFile } from '../../../domain/entities/MediaFile.js';
import { MediaFileMapper } from './mappers/MediaFileMapper.js';

export class SqliteMediaFileRepository implements IMediaFileRepository {
  constructor(private db: Database.Database) {}

  public async save(mediaFile: MediaFile): Promise<void> {
    const raw = MediaFileMapper.toPersistence(mediaFile);

    this.db.prepare(`
      INSERT INTO media_files (
        id, asset_id, role, current_path, file_size_bytes, file_hash, extension, created_at,
        source_device, import_date, width, height, webp_quality, fps, loop_duration_ms, schema_version, xml_namespace
      ) VALUES (
        @id, @asset_id, @role, @current_path, @file_size_bytes, @file_hash, @extension, @created_at,
        @source_device, @import_date, @width, @height, @webp_quality, @fps, @loop_duration_ms, @schema_version, @xml_namespace
      )
      ON CONFLICT(id) DO UPDATE SET
        asset_id=excluded.asset_id,
        role=excluded.role,
        current_path=excluded.current_path,
        file_size_bytes=excluded.file_size_bytes,
        file_hash=excluded.file_hash,
        extension=excluded.extension,
        created_at=excluded.created_at,
        source_device=excluded.source_device,
        import_date=excluded.import_date,
        width=excluded.width,
        height=excluded.height,
        webp_quality=excluded.webp_quality,
        fps=excluded.fps,
        loop_duration_ms=excluded.loop_duration_ms,
        schema_version=excluded.schema_version,
        xml_namespace=excluded.xml_namespace
    `).run(raw);
  }

  public async getByAssetId(assetId: string): Promise<MediaFile[]> {
    const rows = this.db.prepare('SELECT * FROM media_files WHERE asset_id = ?').all(assetId);
    return rows.map(row => MediaFileMapper.toDomain(row));
  }

  public async getById(id: string): Promise<MediaFile | null> {
    const row = this.db.prepare('SELECT * FROM media_files WHERE id = ? LIMIT 1').get(id);
    if (!row) return null;
    return MediaFileMapper.toDomain(row);
  }

  public async getOrphans(): Promise<MediaFile[]> {
    const rows = this.db.prepare('SELECT * FROM media_files WHERE asset_id IS NULL').all();
    return rows.map(row => MediaFileMapper.toDomain(row));
  }

  public async getByPath(path: string): Promise<MediaFile | null> {
    const row = this.db.prepare('SELECT * FROM media_files WHERE current_path = ?').get(path);
    if (!row) return null;
    return MediaFileMapper.toDomain(row);
  }

  public async getByFileHash(fileHash: string): Promise<MediaFile | null> {
    const row = this.db.prepare('SELECT * FROM media_files WHERE file_hash = ? LIMIT 1').get(fileHash);
    if (!row) return null;
    return MediaFileMapper.toDomain(row);
  }

  public async delete(mediaId: string): Promise<void> {
    this.db.prepare('DELETE FROM media_files WHERE id = ?').run(mediaId);
  }

  public async detachAllOriginals(): Promise<number> {
    const info = this.db.prepare("UPDATE media_files SET asset_id = NULL WHERE UPPER(COALESCE(role, '')) = 'ORIGINAL'").run();
    return info.changes;
  }

  public async getAll(): Promise<MediaFile[]> {
    const rows = this.db.prepare('SELECT * FROM media_files').all();
    return rows.map(row => MediaFileMapper.toDomain(row));
  }
}

