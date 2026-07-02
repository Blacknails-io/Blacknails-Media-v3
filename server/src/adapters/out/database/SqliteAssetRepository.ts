import Database from 'better-sqlite3';
import { IAssetRepository } from '../../../application/ports/out/IAssetRepository.js';
import { Asset } from '../../../domain/entities/Asset.js';
import { AssetMapper } from './mappers/AssetMapper.js';

export class SqliteAssetRepository implements IAssetRepository {
  constructor(
    private db: Database.Database,
    private onEventsSaved?: (events: any[]) => void
  ) {}

  public async save(asset: Asset): Promise<void> {
    const raw = AssetMapper.toPersistence(asset);

    this.db.prepare(`
      INSERT INTO assets (
        id, asset_type, date_taken, timezone_offset, width, height, 
        duration_seconds, framerate, video_codec, audio_codec, 
        latitude, longitude, altitude, country, city, exif_json, 
        indexed_at, ai_processed_at, thumbnail_path, ai_thumbnail_path, video_preview_path,
        ai_description, tags_json, title, sidecar_path, is_nsfw, nsfw_reason,
        tag_nsfw_scores_json, described_at, tagged_at, titled_at, faces_processed_at, nsfw_processed_at
      ) VALUES (
        @id, @asset_type, @date_taken, @timezone_offset, @width, @height, 
        @duration_seconds, @framerate, @video_codec, @audio_codec, 
        @latitude, @longitude, @altitude, @country, @city, @exif_json, 
        @indexed_at, @ai_processed_at, @thumbnail_path, @ai_thumbnail_path, @video_preview_path,
        @ai_description, @tags_json, @title, @sidecar_path, @is_nsfw, @nsfw_reason,
        @tag_nsfw_scores_json, @described_at, @tagged_at, @titled_at, @faces_processed_at, @nsfw_processed_at
      )
      ON CONFLICT(id) DO UPDATE SET
        asset_type=excluded.asset_type, date_taken=excluded.date_taken, timezone_offset=excluded.timezone_offset,
        width=excluded.width, height=excluded.height, duration_seconds=excluded.duration_seconds,
        framerate=excluded.framerate, video_codec=excluded.video_codec, audio_codec=excluded.audio_codec,
        latitude=excluded.latitude, longitude=excluded.longitude, altitude=excluded.altitude,
        country=excluded.country, city=excluded.city, exif_json=excluded.exif_json,
        indexed_at=excluded.indexed_at, ai_processed_at=excluded.ai_processed_at,
        thumbnail_path=excluded.thumbnail_path, ai_thumbnail_path=excluded.ai_thumbnail_path,
        video_preview_path=excluded.video_preview_path, ai_description=excluded.ai_description,
        tags_json=excluded.tags_json, title=excluded.title, sidecar_path=excluded.sidecar_path,
        is_nsfw=excluded.is_nsfw, nsfw_reason=excluded.nsfw_reason, tag_nsfw_scores_json=excluded.tag_nsfw_scores_json,
        described_at=excluded.described_at, tagged_at=excluded.tagged_at, titled_at=excluded.titled_at,
        faces_processed_at=excluded.faces_processed_at, nsfw_processed_at=excluded.nsfw_processed_at
    `).run(raw);

    // Registramos los eventos de dominio de la entidad en la transacción
    const events = asset.getDomainEvents();
    if (events.length > 0 && this.onEventsSaved) {
      this.onEventsSaved(events);
      asset.clearDomainEvents();
    }
  }

  public async getById(id: string): Promise<Asset | null> {
    const row = this.db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
    if (!row) return null;
    return AssetMapper.toDomain(row);
  }

  public async getByOriginalFileHash(fileHash: string): Promise<Asset | null> {
    const row = this.db.prepare(`
      SELECT a.* FROM assets a
      JOIN media_files m ON a.id = m.asset_id
      WHERE m.role = 'ORIGINAL' AND m.file_hash = ?
    `).get(fileHash);
    
    if (!row) return null;
    return AssetMapper.toDomain(row);
  }

  public async getAll(): Promise<Asset[]> {
    const rows = this.db.prepare('SELECT * FROM assets ORDER BY date_taken DESC').all();
    return rows.map(row => AssetMapper.toDomain(row));
  }

  public async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM assets WHERE id = ?').run(id);
  }

  public async deleteAll(): Promise<number> {
    const info = this.db.prepare('DELETE FROM assets').run();
    return info.changes;
  }

  public async getAssetsByPersonId(personId: string): Promise<Asset[]> {
    const rows = this.db.prepare(`
      SELECT a.*
      FROM assets a
      JOIN faces f ON f.photo_id = a.id
      WHERE f.person_id = ?
      GROUP BY a.id
      ORDER BY a.date_taken DESC
    `).all(personId) as any[];
    return rows.map(row => AssetMapper.toDomain(row));
  }
}
