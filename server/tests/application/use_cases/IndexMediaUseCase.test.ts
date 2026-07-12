import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { IndexMediaUseCase } from '../../../src/application/use_cases/IndexMediaUseCase.js';
import { OriginalFile, type MediaFile } from '../../../src/domain/entities/MediaFile.js';
import type { Asset } from '../../../src/domain/entities/Asset.js';
import type { IEventBus } from '../../../src/application/ports/out/IEventBus.js';
import type { IMediaProcessingService, MediaDateResult } from '../../../src/application/ports/out/IMediaProcessingService.js';
import type { IUnitOfWork } from '../../../src/application/ports/out/IUnitOfWork.js';
import type { IAssetRepository } from '../../../src/application/ports/out/IAssetRepository.js';
import type { IMediaFileRepository } from '../../../src/application/ports/out/IMediaFileRepository.js';
import type { IEventRepository } from '../../../src/application/ports/out/IEventRepository.js';
import type { IWorkerExecutionRepository } from '../../../src/application/ports/out/IWorkerExecutionRepository.js';
import type { AppEvent } from '@blacknails/shared';

class RecordingEventBus implements IEventBus {
  public readonly events: AppEvent[] = [];

  async publish(event: AppEvent): Promise<void> {
    this.events.push(event);
  }

  subscribe(_action: string, _handler: (event: AppEvent) => void): void {}
}

class MemoryMediaFileRepository implements IMediaFileRepository {
  public readonly deletedIds: string[] = [];

  constructor(private mediaFile: MediaFile | null) {}

  async save(mediaFile: MediaFile): Promise<void> {
    this.mediaFile = mediaFile;
  }

  async getById(id: string): Promise<MediaFile | null> {
    return this.mediaFile?.id === id ? this.mediaFile : null;
  }

  async getByAssetId(assetId: string): Promise<MediaFile[]> {
    return this.mediaFile?.assetId === assetId ? [this.mediaFile] : [];
  }

  async getOrphans(): Promise<MediaFile[]> {
    return this.mediaFile && !this.mediaFile.assetId ? [this.mediaFile] : [];
  }

  async getByPath(currentPath: string): Promise<MediaFile | null> {
    return this.mediaFile?.currentPath === currentPath ? this.mediaFile : null;
  }

  async getByFileHash(fileHash: string): Promise<MediaFile | null> {
    return this.mediaFile?.fileHash === fileHash ? this.mediaFile : null;
  }

  async delete(mediaId: string): Promise<void> {
    this.deletedIds.push(mediaId);
    if (this.mediaFile?.id === mediaId) {
      this.mediaFile = null;
    }
  }

  async detachAllOriginals(): Promise<number> {
    return 0;
  }

  async getAll(): Promise<MediaFile[]> {
    return this.mediaFile ? [this.mediaFile] : [];
  }
}

class EmptyAssetRepository implements IAssetRepository {
  async save(_asset: Asset): Promise<void> {}
  async getById(_id: string): Promise<Asset | null> { return null; }
  async getByDateTaken(_dateTaken: string): Promise<Asset | null> { return null; }
  async getByOriginalFileHash(_fileHash: string): Promise<Asset | null> { return null; }
  async getAll(): Promise<Asset[]> { return []; }
  async delete(_id: string): Promise<void> {}
  async deleteAll(): Promise<number> { return 0; }
  async getAssetsByPersonId(_personId: string): Promise<Asset[]> { return []; }
  async markForReprocessing(_assetIds: string[]): Promise<{ accepted: string[]; missing: string[] }> {
    return { accepted: [], missing: [] };
  }
}

class RejectingMediaProcessingService implements IMediaProcessingService {
  async getDateWithSource(_sourcePath: string): Promise<MediaDateResult> {
    return { dateTaken: new Date('2024-01-01T00:00:00.000Z'), source: 'mtime' };
  }

  async extractImageMetadata(_sourcePath: string): Promise<never> {
    throw new Error('Content mismatch: expected image but got text/plain');
  }

  async extractVideoMetadata(_sourcePath: string): Promise<never> {
    throw new Error('unexpected video metadata request');
  }

  async generateImagePreview(_sourcePath: string, _outputPath: string): Promise<void> {}
  async generateVideoPreview(_sourcePath: string, _outputPath: string): Promise<void> {}
  async generateVideoClipsPreview(_sourcePath: string, _outputPath: string): Promise<void> {}
  async extractFullMetadata(_sourcePath: string): Promise<Record<string, unknown>> { return {}; }
}

function createUnitOfWork(mediaFiles: IMediaFileRepository): IUnitOfWork {
  const uow = {
    assets: new EmptyAssetRepository(),
    mediaFiles,
    events: {} as IEventRepository,
    workerExecutions: {} as IWorkerExecutionRepository,
    runTransaction: async <T>(work: (tx: IUnitOfWork) => Promise<T>): Promise<T> => work(uow)
  };
  return uow;
}

test('rechaza archivos corruptos durante indexación sin dejar media files atascados', async () => {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'bn-v3-index-use-case-'));
  const currentPath = path.join(rootDir, 'mismatch.jpg');
  await writeFile(currentPath, 'not really an image', 'utf8');

  const mediaFile = new OriginalFile({
    id: 'media-1',
    assetId: null,
    currentPath,
    fileSize: 19,
    fileHash: 'hash-1',
    extension: '.jpg',
    originalFilename: 'mismatch.jpg'
  });
  const mediaRepository = new MemoryMediaFileRepository(mediaFile);
  const eventBus = new RecordingEventBus();
  const useCase = new IndexMediaUseCase(
    createUnitOfWork(mediaRepository),
    new RejectingMediaProcessingService(),
    eventBus,
    path.join(rootDir, 'sidecars')
  );

  try {
    await assert.rejects(
      () => useCase.execute({ mediaFileId: mediaFile.id }),
      /Discarded corrupted\/mismatched file/
    );

    assert.deepEqual(mediaRepository.deletedIds, [mediaFile.id]);
    await assert.rejects(() => stat(currentPath), /ENOENT/);
    assert.equal(eventBus.events.length, 1);
    assert.equal(eventBus.events[0].type, 'PROCESS');
    assert.equal(eventBus.events[0].action, 'REJECTED');
    assert.equal(eventBus.events[0].itemId, mediaFile.id);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
