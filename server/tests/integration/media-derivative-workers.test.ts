import assert from 'node:assert/strict';
import { access, copyFile, mkdir } from 'fs/promises';
import { constants as fsConstants } from 'fs';
import { dirname, join } from 'path';
import test from 'node:test';
import { createPipelineTestEnvironment } from '../helpers/test-environment.js';
import { createImageFixture, createVideoFixture } from '../helpers/media-fixtures.js';
import {
  ImagePreviewTaskRunner,
  ImageTranscodeTaskRunner,
  VideoPreviewTaskRunner,
  VideoTranscodeTaskRunner
} from '../../src/application/workers/MediaDerivativeTaskRunners.js';

async function copyIntoImport(source: string, destination: string): Promise<void> {
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

async function exists(filePath: string | undefined): Promise<boolean> {
  if (!filePath) return false;
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

test('media derivative workers generate photo and video outputs independently', async () => {
  const env = await createPipelineTestEnvironment();
  try {
    const thumbsDir = join(env.storageDir, 'thumbnails');
    const imagePreviewWorker = new ImagePreviewTaskRunner(env.eventBus, env.uow, 0, thumbsDir);
    const imageTranscodeWorker = new ImageTranscodeTaskRunner(env.eventBus, env.uow, 0, thumbsDir);
    const videoPreviewWorker = new VideoPreviewTaskRunner(env.eventBus, env.uow, 0, thumbsDir);
    const videoTranscodeWorker = new VideoTranscodeTaskRunner(env.eventBus, env.uow, 0, thumbsDir);

    const photoFixture = join(env.rootDir, 'fixtures', 'derivative-photo.jpg');
    const videoFixture = join(env.rootDir, 'fixtures', 'derivative-video.mov');
    await createImageFixture(photoFixture, '2024:07:04 12:34:56');
    await createVideoFixture(videoFixture, new Date('2024-07-04T12:34:56.000Z'));
    await copyIntoImport(photoFixture, join(env.importDir, 'derivative-photo.jpg'));
    await copyIntoImport(videoFixture, join(env.importDir, 'derivative-video.mov'));

    await env.importWorker.trigger();
    await env.importWorker.trigger();
    await env.indexWorker.trigger();
    await env.indexWorker.trigger();

    await imagePreviewWorker.trigger();
    await imageTranscodeWorker.trigger();
    await videoPreviewWorker.trigger();
    await videoTranscodeWorker.trigger();

    const assets = await env.assetRepo.getAll();
    const photo = assets.find((asset) => asset.assetType === 'PHOTO');
    const video = assets.find((asset) => asset.assetType === 'VIDEO');

    assert.ok(photo);
    assert.ok(video);
    assert.equal(await exists(photo.thumbnailPath), true);
    assert.equal(await exists(photo.aiThumbnailPath), true);
    assert.equal(photo.videoPreviewPath, undefined);
    assert.equal(await exists(video.thumbnailPath), true);
    assert.equal(await exists(video.aiThumbnailPath), true);
    assert.equal(await exists(video.videoPreviewPath), true);
  } finally {
    await env.cleanup();
  }
});
