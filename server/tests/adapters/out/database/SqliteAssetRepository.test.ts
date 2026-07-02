import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import Database from 'better-sqlite3';
import { initializeDatabase } from '../../../../src/adapters/out/database/SqliteDatabase.js';
import { SqliteAssetRepository } from '../../../../src/adapters/out/database/SqliteAssetRepository.js';
import { SqliteMediaFileRepository } from '../../../../src/adapters/out/database/SqliteMediaFileRepository.js';
import { Photo } from '../../../../src/domain/entities/Asset.js';
import { OriginalFile } from '../../../../src/domain/entities/MediaFile.js';

describe('SqliteAssetRepository Regression Tests', () => {
  let db: Database.Database;
  let assetRepo: SqliteAssetRepository;
  let mediaRepo: SqliteMediaFileRepository;

  before(() => {
    // Usar base de datos en memoria para los tests aislandola del entorno local
    db = initializeDatabase(':memory:');
    assetRepo = new SqliteAssetRepository(db);
    mediaRepo = new SqliteMediaFileRepository(db);
  });

  after(() => {
    db.close();
  });

  it('should not delete media_files on CASCADE when updating an existing asset', async () => {
    // 1. Arrange: Create a photo and save it
    const photo = new Photo({
      dateTaken: new Date().toISOString(),
      timezoneOffset: '+00:00'
    });
    await assetRepo.save(photo);

    // 2. Arrange: Create a media file associated with the photo
    const mediaFile = new OriginalFile({
      assetId: photo.id,
      currentPath: '/test/path/image.jpg',
      fileSize: 1024,
      fileHash: 'testhash',
      extension: '.jpg'
    });
    await mediaRepo.save(mediaFile);

    // Verify setup is correct
    let dbMediaFile = db.prepare('SELECT * FROM media_files WHERE asset_id = ?').get(photo.id);
    assert.ok(dbMediaFile);

    // 3. Act: Update the photo (this used to cause an INSERT OR REPLACE triggering CASCADE DELETE)
    photo.title = 'Updated Title';
    photo.isNsfw = true;
    await assetRepo.save(photo);

    // 4. Assert: The media file MUST STILL EXIST
    dbMediaFile = db.prepare('SELECT * FROM media_files WHERE asset_id = ?').get(photo.id);
    assert.ok(dbMediaFile);
    assert.strictEqual((dbMediaFile as any).current_path, '/test/path/image.jpg');

    // Also verify the asset was actually updated
    const updatedAsset = await assetRepo.getById(photo.id);
    assert.ok(updatedAsset);
    assert.strictEqual(updatedAsset?.title, 'Updated Title');
    assert.strictEqual(updatedAsset?.isNsfw, true);
  });

  it('marks selected assets for AI reprocessing without touching unknown ids', async () => {
    const photo = new Photo({
      dateTaken: new Date().toISOString(),
      timezoneOffset: '+00:00'
    });
    photo.aiDescription = 'old description';
    photo.describedAt = '2026-07-01T00:00:00.000Z';
    photo.tags = ['OLD'];
    photo.taggedAt = '2026-07-01T00:01:00.000Z';
    photo.title = 'Old title';
    photo.titledAt = '2026-07-01T00:02:00.000Z';
    photo.aiProcessedAt = '2026-07-01T00:03:00.000Z';
    photo.isNsfw = true;
    photo.nsfwReason = 'old reason';
    photo.tagNsfwScores = { OLD: 0.8 };
    photo.nsfwProcessedAt = '2026-07-01T00:04:00.000Z';
    photo.facesProcessedAt = '2026-07-01T00:05:00.000Z';
    await assetRepo.save(photo);

    const result = await assetRepo.markForReprocessing([photo.id, 'missing-asset'], ['description', 'nsfw', 'faces']);

    assert.deepStrictEqual(result, { accepted: [photo.id], missing: ['missing-asset'] });
    const row = db.prepare('SELECT * FROM assets WHERE id = ?').get(photo.id) as any;
    assert.strictEqual(row.ai_description, null);
    assert.strictEqual(row.described_at, null);
    assert.strictEqual(row.tags_json, null);
    assert.strictEqual(row.tagged_at, null);
    assert.strictEqual(row.title, null);
    assert.strictEqual(row.titled_at, null);
    assert.strictEqual(row.ai_processed_at, null);
    assert.strictEqual(row.is_nsfw, null);
    assert.strictEqual(row.nsfw_reason, null);
    assert.strictEqual(row.tag_nsfw_scores_json, null);
    assert.strictEqual(row.nsfw_processed_at, null);
    assert.strictEqual(row.faces_processed_at, null);
  });

});
