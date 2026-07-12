import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';
import test from 'node:test';
import { createPipelineTestEnvironment } from '../helpers/test-environment.js';
import { createImageFixture } from '../helpers/media-fixtures.js';
import { OriginalFile } from '../../src/domain/entities/MediaFile.js';

test('indexes an orphaned raw file and links the media file', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const sourceFile = join(env.rootDir, 'fixtures', 'orphan.jpg');
    await createImageFixture(sourceFile, '2024:07:04 12:34:56');

    const bytes = await readFile(sourceFile);
    const fileHash = createHash('sha1').update(bytes).digest('hex');

    const orphan = new OriginalFile({
      assetId: null,
      currentPath: sourceFile,
      fileSize: bytes.length,
      fileHash,
      extension: '.jpg',
      createdAt: new Date().toISOString(),
      sourceDevice: 'fixture',
      importDate: new Date().toISOString()
    });

    await env.mediaRepo.save(orphan);
    assert.equal((await env.mediaRepo.getOrphans()).length, 1);

    await env.indexWorker.trigger();

    const assets = await env.assetRepo.getAll();
    assert.equal(assets.length, 1);
    assert.equal(assets[0].assetType, 'PHOTO');

    const updatedMediaFile = await env.mediaRepo.getById(orphan.id);
    assert.ok(updatedMediaFile);
    assert.equal(updatedMediaFile?.assetId, assets[0].id);
    assert.equal((await env.mediaRepo.getOrphans()).length, 0);
  } finally {
    await env.cleanup();
  }
});

test('concurrent indexing of the same orphan does not leave duplicate orphan assets', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const sourceFile = join(env.rootDir, 'fixtures', 'concurrent-orphan.jpg');
    await createImageFixture(sourceFile, '2024:07:04 12:34:56');

    const bytes = await readFile(sourceFile);
    const fileHash = createHash('sha1').update(bytes).digest('hex');

    const orphan = new OriginalFile({
      assetId: null,
      currentPath: sourceFile,
      fileSize: bytes.length,
      fileHash,
      extension: '.jpg',
      createdAt: new Date().toISOString(),
      sourceDevice: 'fixture',
      importDate: new Date().toISOString()
    });

    await env.mediaRepo.save(orphan);

    const [first, second] = await Promise.all([
      env.indexUseCase.execute({ mediaFileId: orphan.id }),
      env.indexUseCase.execute({ mediaFileId: orphan.id })
    ]);

    assert.equal(first.assetId, second.assetId);

    const assets = await env.assetRepo.getAll();
    assert.equal(assets.length, 1);

    const linkedOriginals = await env.mediaRepo.getByAssetId(first.assetId);
    assert.equal(linkedOriginals.length, 1);
    assert.equal((await env.mediaRepo.getOrphans()).length, 0);
  } finally {
    await env.cleanup();
  }
});

test('purges missing original files and deletes their assets/thumbnails', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const fsPromises = (await import('fs/promises'));
    // 1. Create a valid original file physically
    const sourceFile = join(env.originalsDir, 'to-be-deleted.jpg');
    await fsPromises.mkdir(env.originalsDir, { recursive: true });
    await createImageFixture(sourceFile, '2024:07:04 12:34:56');

    const bytes = await fsPromises.readFile(sourceFile);
    const fileHash = createHash('sha1').update(bytes).digest('hex');

    // 2. Index the file to create the Asset and MediaFile
    const mediaFile = new OriginalFile({
      assetId: null,
      currentPath: sourceFile,
      fileSize: bytes.length,
      fileHash,
      extension: '.jpg',
      createdAt: new Date().toISOString(),
      sourceDevice: 'test',
      importDate: new Date().toISOString()
    });
    await env.mediaRepo.save(mediaFile);

    // Run indexer once to index the orphan
    await env.indexWorker.trigger();

    // Verify Asset and MediaFile exist and are linked
    const assetsBefore = await env.assetRepo.getAll();
    assert.equal(assetsBefore.length, 1);
    const asset = assetsBefore[0];

    const mediaBefore = await env.mediaRepo.getById(mediaFile.id);
    assert.ok(mediaBefore);
    assert.equal(mediaBefore?.assetId, asset.id);

    // Create dummy thumbnail files on disk
    const thumbDir = join(env.rootDir, 'storage', 'thumbnails');
    await fsPromises.mkdir(thumbDir, { recursive: true });
    const dummyThumb = join(thumbDir, `${asset.id}.webp`);
    await fsPromises.writeFile(dummyThumb, 'dummy thumbnail');
    
    // Assign thumbnail path to asset
    asset.thumbnailPath = dummyThumb;
    await env.assetRepo.save(asset);

    // Verify thumbnail exists on disk
    let thumbExists = await fsPromises.access(dummyThumb).then(() => true).catch(() => false);
    assert.ok(thumbExists);

    // 3. Physically delete the original file
    await fsPromises.unlink(sourceFile);

    // 4. Run the indexer again (which triggers the purge process)
    await env.indexWorker.trigger();

    // 5. Assert database records and thumbnails are deleted
    const mediaAfter = await env.mediaRepo.getById(mediaFile.id);
    assert.equal(mediaAfter, null);

    const assetsAfter = await env.assetRepo.getAll();
    assert.equal(assetsAfter.length, 0);

    // Verify thumbnail is physically unlinked
    thumbExists = await fsPromises.access(dummyThumb).then(() => true).catch(() => false);
    assert.equal(thumbExists, false);
  } finally {
    await env.cleanup();
  }
});
