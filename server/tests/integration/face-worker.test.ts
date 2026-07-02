import assert from 'node:assert/strict';
import { copyFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import test from 'node:test';
import { createPipelineTestEnvironment } from '../helpers/test-environment.js';
import { createVideoFixture } from '../helpers/media-fixtures.js';
import { FaceTaskRunner, getVideoFaceSamplingTimestamps } from '../../src/application/workers/FaceTaskRunner.js';
import { SqliteFaceRepository } from '../../src/adapters/out/database/SqliteFaceRepository.js';
import { Photo, Video } from '../../src/domain/entities/Asset.js';
import { PipelineCoordinatorService } from '../../src/application/services/PipelineCoordinatorService.js';

async function copyIntoImport(source: string, destination: string): Promise<void> {
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

test('video face sampling skips the opening credits window for regular videos', () => {
  const timestamps = getVideoFaceSamplingTimestamps(100);

  assert.equal(timestamps.length, 5);
  assert.ok(timestamps.every((timestamp) => timestamp > 25));
  assert.ok(timestamps.every((timestamp) => timestamp < 90));
});

test('video face sampling keeps a deterministic fallback for unknown durations', () => {
  assert.deepEqual(getVideoFaceSamplingTimestamps(0), [0]);
  assert.deepEqual(getVideoFaceSamplingTimestamps(Number.NaN), [0]);
});

test('pipeline backlog counts video assets pending face detection', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const faceRepo = new SqliteFaceRepository(env.db);
    const mockDetector = { detect: async () => [] };
    const mockVectorMemory = { upsert: async () => {} };
    const faceTaskRunner = new FaceTaskRunner(
      env.eventBus,
      env.uow,
      0,
      faceRepo,
      mockDetector,
      mockVectorMemory
    );
    const coordinator = new PipelineCoordinatorService(
      env.uow,
      faceRepo,
      env.importDir,
      join(env.storageDir, 'thumbnails'),
      env.originalsDir,
      env.eventBus
    );
    coordinator.register(faceTaskRunner);

    const sourceFixture = join(env.rootDir, 'fixtures', 'pending-face-video.mp4');
    const importTarget = join(env.importDir, 'pending-face-video.mp4');
    await createVideoFixture(sourceFixture);
    await copyIntoImport(sourceFixture, importTarget);

    await env.importWorker.trigger();
    await env.indexWorker.trigger();

    const assets = await env.assetRepo.getAll();
    assert.equal(assets.length, 1);
    const videoAsset = assets[0] as Video;
    videoAsset.thumbnailPath = join(env.storageDir, 'pending-face-thumb.webp');
    await env.assetRepo.save(videoAsset);

    const status = await coordinator.describeWorker('face-worker');
    assert.equal(status?.pendingItems, 1);
  } finally {
    await env.cleanup();
  }
});

test('extracts multiple frames and runs face detection for video assets', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const faceRepo = new SqliteFaceRepository(env.db);

    // Mock Detector and Vector Memory
    const detectedPaths: string[] = [];
    const mockDetector = {
      detect: async (imagePath: string) => {
        detectedPaths.push(imagePath);
        return [
          {
            bbox: [10, 20, 30, 40] as [number, number, number, number],
            confidence: 0.9,
            embedding: Array(48).fill(0.25)
          }
        ];
      }
    };

    const mockVectorMemory = {
      upsert: async () => {},
      search: async () => []
    };

    // Instantiate FaceTaskRunner
    const faceTaskRunner = new FaceTaskRunner(
      env.eventBus,
      env.uow,
      0,
      faceRepo,
      mockDetector,
      mockVectorMemory as any
    );

    // Create a dummy video file
    const sourceFixture = join(env.rootDir, 'fixtures', 'test-video.mp4');
    const importTarget = join(env.importDir, 'test-video.mp4');
    await createVideoFixture(sourceFixture);
    await copyIntoImport(sourceFixture, importTarget);

    // Run import and index workers to register the video asset
    await env.importWorker.trigger();
    await env.indexWorker.trigger();

    const assets = await env.assetRepo.getAll();
    assert.equal(assets.length, 1);
    const videoAsset = assets[0] as Video;
    assert.equal(videoAsset.assetType, 'VIDEO');

    // Generate thumbnails (which FaceTaskRunner requires, i.e., it needs thumbnailPath or aiThumbnailPath)
    // Let's mock / set thumbnail paths manually
    videoAsset.thumbnailPath = join(env.storageDir, 'thumb.webp');
    videoAsset.aiThumbnailPath = join(env.storageDir, 'thumb.ai.webp');
    await env.assetRepo.save(videoAsset);

    // Run the Face Detection worker
    await faceTaskRunner.trigger();

    // Verify:
    // 1. ffmpeg extracted 5 separate frames, so detector.detect was called 5 times
    assert.equal(detectedPaths.length, 5);

    // 2. Verified that each path is a temp frame file
    for (let i = 0; i < 5; i++) {
      assert.ok(detectedPaths[i].includes(`_temp_frame_${i}.webp`));
    }

    // 3. 5 faces were saved in the repository
    const faces = await faceRepo.getFacesForPhoto(videoAsset.id);
    assert.equal(faces.length, 5);

  } finally {
    await env.cleanup();
  }
});

test('photo face detection does not acquire or call Ollama', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const faceRepo = new SqliteFaceRepository(env.db);
    let lockCalls = 0;
    let describeCalls = 0;
    let detectorCalls = 0;

    const mockDetector = {
      detect: async () => {
        detectorCalls++;
        return [];
      }
    };

    const mockVectorMemory = {
      upsert: async () => {},
      search: async () => []
    };

    const mockOllama = {
      describeImage: async () => {
        describeCalls++;
        return '{}';
      },
      extractJson: async () => ({}),
      acquireLock: () => {
        lockCalls++;
        return true;
      },
      releaseLock: () => {}
    };

    const photo = new Photo({});
    photo.thumbnailPath = join(env.storageDir, 'photo-face-thumb.webp');
    await env.assetRepo.save(photo);

    const faceTaskRunner = new FaceTaskRunner(
      env.eventBus,
      env.uow,
      0,
      faceRepo,
      mockDetector,
      mockVectorMemory as any,
      mockOllama
    );

    await faceTaskRunner.trigger();

    assert.equal(detectorCalls, 1);
    assert.equal(lockCalls, 0);
    assert.equal(describeCalls, 0);
  } finally {
    await env.cleanup();
  }
});

test('filters video frame faces when Ollama identifies credits or graphic material', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const faceRepo = new SqliteFaceRepository(env.db);
    const detectedPaths: string[] = [];
    let validationCalls = 0;

    const mockDetector = {
      detect: async (imagePath: string) => {
        detectedPaths.push(imagePath);
        return [
          {
            bbox: [10, 20, 30, 40] as [number, number, number, number],
            confidence: 0.9,
            embedding: Array(48).fill(0.25)
          }
        ];
      }
    };

    const mockVectorMemory = {
      upsert: async () => {},
      search: async () => []
    };

    const mockOllama = {
      describeImage: async () => {
        validationCalls++;
        return validationCalls === 1
          ? '{"store_faces":false,"reason":"opening credits"}'
          : '{"store_faces":true,"reason":"video scene"}';
      },
      extractJson: async () => ({}),
      acquireLock: () => true,
      releaseLock: () => {}
    };

    const faceTaskRunner = new FaceTaskRunner(
      env.eventBus,
      env.uow,
      0,
      faceRepo,
      mockDetector,
      mockVectorMemory as any,
      mockOllama
    );

    const sourceFixture = join(env.rootDir, 'fixtures', 'credits-filter-video.mp4');
    const importTarget = join(env.importDir, 'credits-filter-video.mp4');
    await createVideoFixture(sourceFixture);
    await copyIntoImport(sourceFixture, importTarget);

    await env.importWorker.trigger();
    await env.indexWorker.trigger();

    const assets = await env.assetRepo.getAll();
    assert.equal(assets.length, 1);
    const videoAsset = assets[0] as Video;
    videoAsset.thumbnailPath = join(env.storageDir, 'credits-filter-thumb.webp');
    videoAsset.aiThumbnailPath = join(env.storageDir, 'credits-filter-thumb.ai.webp');
    await env.assetRepo.save(videoAsset);

    await faceTaskRunner.trigger();

    assert.equal(detectedPaths.length, 5);
    assert.equal(validationCalls, 5);

    const faces = await faceRepo.getFacesForPhoto(videoAsset.id);
    assert.equal(faces.length, 4);
  } finally {
    await env.cleanup();
  }
});
