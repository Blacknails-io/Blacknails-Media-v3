import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { Asset } from '../../domain/entities/Asset.js';
import { OriginalFile } from '../../domain/entities/MediaFile.js';
import { IFaceRepository } from '../ports/out/IFaceRepository.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { DaemonWorker, WorkerStatusDTO } from './DaemonWorker.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IPipelineCoordinator } from '../ports/in/IPipelineCoordinator.js';

export class PipelineCoordinatorService implements IPipelineCoordinator {
  private readonly workers = new Map<string, DaemonWorker>();

  constructor(
    private readonly uow: IUnitOfWork,
    private readonly faceRepository: IFaceRepository,
    private readonly importDir: string,
    private readonly thumbnailsDir: string,
    private readonly originalsDir: string,
    private readonly eventBus?: IEventBus
  ) {
    this.setupReactiveListeners();
  }

  private setupReactiveListeners(): void {
    if (!this.eventBus) return;
    this.eventBus.subscribe('COMPLETED', (event) => {
      if (event.type === 'PROCESS') {
        void this.handleWorkerCompleted(event.source || event.processName);
      }
    });
  }

  private async handleWorkerCompleted(processName: string): Promise<void> {
    const processToWorkerId: Record<string, string> = {
      'IMPORT': 'import-worker',
      'IMPORT-WORKER': 'import-worker',
      'INDEX': 'index-worker',
      'INDEX-WORKER': 'index-worker',
      'IMAGE-PREVIEW-WORKER': 'image-preview-worker',
      'VIDEO-PREVIEW-WORKER': 'video-preview-worker',
      'IMAGE-TRANSCODE-WORKER': 'image-transcode-worker',
      'VIDEO-TRANSCODE-WORKER': 'video-transcode-worker',
      'DESCRIPTION': 'description-worker',
      'DESCRIPTION-WORKER': 'description-worker',
      'TAGS': 'tags-worker',
      'TAGS-WORKER': 'tags-worker',
      'TITLE': 'title-worker',
      'TITLE-WORKER': 'title-worker',
      'NSFW': 'nsfw-worker',
      'NSFW-WORKER': 'nsfw-worker',
      'FACE_DETECTION': 'face-worker',
      'FACE-WORKER': 'face-worker',
      'FACE_CLUSTERING': 'face-cluster-worker',
      'FACE-CLUSTER-WORKER': 'face-cluster-worker'
    };

    const workerId = this.get(processName) ? processName : processToWorkerId[processName.toUpperCase()];
    if (!workerId) return;

    const completedWorker = this.get(workerId);
    if (!completedWorker) return;

    const completedProvides = completedWorker.provides;

    for (const candidate of this.getAll()) {
      if (candidate.id === completedWorker.id) continue;

      const isDirectDownstream = candidate.requires.some(req => completedProvides.includes(req));
      if (isDirectDownstream && candidate.isRunning) {
        console.log(`[PipelineCoordinatorService] Triggering reactive cycle for ${candidate.id} because ${completedWorker.id} completed.`);
        // Run it asynchronously to yield control back to the event loop,
        // allowing the previous worker's transactions/resources to completely close.
        setTimeout(() => {
          candidate.trigger('REACTIVE').catch((err) => {
            console.error(`[PipelineCoordinatorService] Error running reactive trigger for ${candidate.id}:`, err);
          });
        }, 100);
      }
    }
  }

  public register(worker: DaemonWorker): void {
    this.workers.set(worker.id, worker);
  }

  public get(id: string): DaemonWorker | undefined {
    return this.workers.get(id);
  }

  public getAll(): DaemonWorker[] {
    return Array.from(this.workers.values());
  }

  public async describeAll(): Promise<WorkerStatusDTO[]> {
    const workers = this.getAll();
    const backlog = await this.computeBacklogSnapshot(workers.map((worker) => worker.id));
    return Promise.all(workers.map(async (worker) => worker.describe(backlog[worker.id] ?? 0)));
  }

  public async startWorker(workerId: string): Promise<WorkerStatusDTO | null> {
    const worker = this.get(workerId);
    if (!worker) return null;
    await worker.start();
    return this.describeWorker(workerId);
  }

  public async stopWorker(workerId: string): Promise<WorkerStatusDTO | null> {
    const worker = this.get(workerId);
    if (!worker) return null;
    worker.stop();
    return this.describeWorker(workerId);
  }

  public async triggerWorker(workerId: string): Promise<WorkerStatusDTO | null> {
    const worker = this.get(workerId);
    if (!worker) return null;
    await worker.trigger();
    return this.describeWorker(workerId);
  }

  private getDownstreamWorkers(workerId: string): string[] {
    const targetWorker = this.get(workerId);
    if (!targetWorker) return [];
    
    const downstream = new Set<string>();
    const queue = [targetWorker];
    const workersList = Array.from(this.workers.values());
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      downstream.add(current.id);
      
      for (const candidate of workersList) {
        if (downstream.has(candidate.id)) continue;
        const dependsOnCurrent = candidate.requires.some(req => current.provides.includes(req));
        if (dependsOnCurrent) {
          queue.push(candidate);
        }
      }
    }
    
    return Array.from(downstream);
  }

  public async resetWorker(workerId: string): Promise<WorkerStatusDTO | null> {
    const targetWorker = this.get(workerId);
    if (!targetWorker) return null;

    const workersToReset = this.getDownstreamWorkers(workerId);

    // Stop all workers to prevent race conditions during reset
    for (const worker of this.workers.values()) {
      const workerStatus = await worker.describe();
      if (workerStatus.isRunning) {
        worker.stop();
      }
    }

    // Execute specific resets for all downstream workers
    for (const wId of workersToReset) {
      switch (wId) {
        case 'index-worker':
          await this.resetIndexState();
          await this.rehydrateOriginalMediaFiles();
          break;
        case 'image-preview-worker':
          await this.resetImagePreviewState();
          break;
        case 'video-preview-worker':
          await this.resetVideoPreviewState();
          break;
        case 'image-transcode-worker':
          await this.resetImageTranscodeState();
          break;
        case 'video-transcode-worker':
          await this.resetVideoTranscodeState();
          break;
        case 'description-worker':
          await this.resetDescriptionState();
          break;
        case 'tags-worker':
          await this.resetTagsState();
          break;
        case 'title-worker':
          await this.resetTitleState();
          break;
        case 'nsfw-worker':
          await this.resetNsfwState();
          break;
        case 'face-worker':
          await this.resetFacesState();
          break;
        case 'face-cluster-worker':
          await this.faceRepository.resetClustering();
          break;
      }
    }

    await targetWorker.emitLifecycleEvent('SUCCESS', `Reset manual ejecutado en ${workerId}.`, {
      workerName: workerId,
      status: 'RESET'
    });
    
    await targetWorker.trigger();

    return this.describeWorker(workerId);
  }

  public async describeWorker(workerId: string): Promise<WorkerStatusDTO | null> {
    const worker = this.get(workerId);
    if (!worker) return null;
    const backlog = await this.computeBacklogSnapshot([workerId]);
    return worker.describe(backlog[workerId] ?? 0);
  }

  private async resetIndexState(): Promise<void> {
    await this.uow.runTransaction(async (tx) => {
      await tx.mediaFiles.detachAllOriginals();
      await tx.assets.deleteAll();
    });
  }

  private async rehydrateOriginalMediaFiles(): Promise<void> {
    const originals = await this.getFilesInDirectory(this.originalsDir);
    const supported = new Set(['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.3g2']);

    for (const originalPath of originals) {
      const extension = path.extname(originalPath).toLowerCase();
      if (!supported.has(extension)) continue;

      const byPath = await this.uow.mediaFiles.getByPath(originalPath);
      if (byPath) continue;

      const [stat, content] = await Promise.all([fs.stat(originalPath), fs.readFile(originalPath)]);
      const fileHash = createHash('sha1').update(content).digest('hex');
      const byHash = await this.uow.mediaFiles.getByFileHash(fileHash);
      if (byHash) continue;

      const mediaFile = new OriginalFile({
        assetId: null,
        currentPath: originalPath,
        fileSize: stat.size,
        fileHash,
        extension,
        createdAt: new Date().toISOString(),
        sourceDevice: 'reset-rebuild',
        importDate: new Date().toISOString()
      });

      await this.uow.runTransaction(async (tx) => {
        await tx.mediaFiles.save(mediaFile);
      });
    }
  }

  private async resetThumbnailsState(): Promise<void> {
    const assets = await this.uow.assets.getAll();
    const thumbsRoot = path.resolve(this.thumbnailsDir);

    for (const asset of assets) {
      const candidates = [asset.thumbnailPath, asset.aiThumbnailPath, asset.videoPreviewPath].filter(
        (value): value is string => Boolean(value)
      );
      for (const candidate of candidates) {
        if (!this.isInsideDirectory(candidate, thumbsRoot)) continue;
        await fs.unlink(candidate).catch(() => undefined);
      }

      asset.thumbnailPath = undefined;
      asset.aiThumbnailPath = undefined;
      asset.videoPreviewPath = undefined;
      await this.uow.assets.save(asset);
    }
  }

  private async resetImagePreviewState(): Promise<void> {
    const assets = await this.uow.assets.getAll();
    const thumbsRoot = path.resolve(this.thumbnailsDir);

    for (const asset of assets.filter((item) => item.assetType === 'PHOTO')) {
      const candidates = [asset.thumbnailPath, asset.aiThumbnailPath].filter(
        (value): value is string => Boolean(value)
      );
      for (const candidate of candidates) {
        if (!this.isInsideDirectory(candidate, thumbsRoot)) continue;
        await fs.unlink(candidate).catch(() => undefined);
      }

      asset.thumbnailPath = undefined;
      asset.aiThumbnailPath = undefined;
      await this.uow.assets.save(asset);
    }
  }

  private async resetVideoPreviewState(): Promise<void> {
    const assets = await this.uow.assets.getAll();
    const thumbsRoot = path.resolve(this.thumbnailsDir);

    for (const asset of assets.filter((item) => item.assetType === 'VIDEO')) {
      const candidates = [asset.thumbnailPath, asset.aiThumbnailPath, asset.videoPreviewPath].filter(
        (value): value is string => Boolean(value)
      );
      for (const candidate of candidates) {
        if (!this.isInsideDirectory(candidate, thumbsRoot)) continue;
        await fs.unlink(candidate).catch(() => undefined);
      }

      asset.thumbnailPath = undefined;
      asset.aiThumbnailPath = undefined;
      asset.videoPreviewPath = undefined;
      await this.uow.assets.save(asset);
    }
  }

  private async resetImageTranscodeState(): Promise<void> {
    const assets = await this.uow.assets.getAll();
    const thumbsRoot = path.resolve(this.thumbnailsDir);

    for (const asset of assets.filter((item) => item.assetType === 'PHOTO')) {
      if (asset.aiThumbnailPath && this.isInsideDirectory(asset.aiThumbnailPath, thumbsRoot)) {
        await fs.unlink(asset.aiThumbnailPath).catch(() => undefined);
      }

      asset.aiThumbnailPath = undefined;
      await this.uow.assets.save(asset);
    }
  }

  private async resetVideoTranscodeState(): Promise<void> {
    const assets = await this.uow.assets.getAll();
    const thumbsRoot = path.resolve(this.thumbnailsDir);

    for (const asset of assets.filter((item) => item.assetType === 'VIDEO')) {
      if (asset.videoPreviewPath && this.isInsideDirectory(asset.videoPreviewPath, thumbsRoot)) {
        await fs.unlink(asset.videoPreviewPath).catch(() => undefined);
      }

      asset.videoPreviewPath = undefined;
      await this.uow.assets.save(asset);
    }
  }

  private async resetDescriptionState(): Promise<void> {
    const assets = await this.uow.assets.getAll();
    for (const asset of assets) {
      asset.aiDescription = undefined;
      asset.describedAt = undefined;
      await this.uow.assets.save(asset);
    }
  }

  private async resetTagsState(): Promise<void> {
    const assets = await this.uow.assets.getAll();
    for (const asset of assets) {
      asset.tags = [];
      asset.taggedAt = undefined;
      asset.tagNsfwScores = null;
      await this.uow.assets.save(asset);
    }
  }

  private async resetTitleState(): Promise<void> {
    const assets = await this.uow.assets.getAll();
    for (const asset of assets) {
      asset.title = undefined;
      asset.titledAt = undefined;
      await this.uow.assets.save(asset);
    }
  }

  private async resetNsfwState(): Promise<void> {
    const assets = await this.uow.assets.getAll();
    for (const asset of assets) {
      asset.isNsfw = null;
      asset.nsfwReason = undefined;
      asset.nsfwProcessedAt = undefined;
      await this.uow.assets.save(asset);
    }
  }

  private async resetFacesState(): Promise<void> {
    const assets = await this.uow.assets.getAll();

    for (const asset of assets) {
      await this.faceRepository.deleteFacesForPhoto(asset.id);
      asset.facesProcessedAt = undefined;
      await this.uow.assets.save(asset);
    }

    await this.faceRepository.resetClustering();
  }

  private isInsideDirectory(candidatePath: string, rootPath: string): boolean {
    const resolvedCandidate = path.resolve(candidatePath);
    return resolvedCandidate === rootPath || resolvedCandidate.startsWith(`${rootPath}${path.sep}`);
  }

  private async computeBacklogSnapshot(workerIds: string[]): Promise<Record<string, number>> {
    const idSet = new Set(workerIds);
    const needsAssets = [
      'image-preview-worker',
      'video-preview-worker',
      'image-transcode-worker',
      'video-transcode-worker',
      'description-worker',
      'tags-worker',
      'title-worker',
      'nsfw-worker',
      'face-worker'
    ].some((id) => idSet.has(id));
    const needsOrphans = idSet.has('index-worker');
    const needsFaces = idSet.has('face-cluster-worker');
    const needsImport = idSet.has('import-worker');

    const [assets, orphans, unclusteredFacesCount, importFiles] = await Promise.all([
      needsAssets ? this.uow.assets.getAll() : Promise.resolve<Asset[]>([]),
      needsOrphans ? this.uow.mediaFiles.getOrphans() : Promise.resolve([]),
      needsFaces ? this.faceRepository.getUnclusteredFacesCount() : Promise.resolve(0),
      needsImport ? this.getImportPendingItems() : Promise.resolve(0)
    ]);

    const snapshot: Record<string, number> = {};
    for (const workerId of workerIds) {
      switch (workerId) {
        case 'import-worker':
          snapshot[workerId] = importFiles;
          break;
        case 'index-worker':
          snapshot[workerId] = orphans.length;
          break;
        case 'image-preview-worker':
          snapshot[workerId] = assets.filter((asset) => asset.assetType === 'PHOTO' && !asset.thumbnailPath).length;
          break;
        case 'video-preview-worker':
          snapshot[workerId] = assets.filter((asset) => asset.assetType === 'VIDEO' && !asset.thumbnailPath).length;
          break;
        case 'image-transcode-worker':
          snapshot[workerId] = assets.filter((asset) => asset.assetType === 'PHOTO' && Boolean(asset.thumbnailPath) && !asset.aiThumbnailPath).length;
          break;
        case 'video-transcode-worker':
          snapshot[workerId] = assets.filter((asset) => asset.assetType === 'VIDEO' && Boolean(asset.thumbnailPath) && !asset.videoPreviewPath).length;
          break;
        case 'description-worker':
          snapshot[workerId] = assets.filter((asset) => Boolean(asset.aiThumbnailPath || asset.thumbnailPath) && !asset.aiDescription).length;
          break;
        case 'tags-worker':
          snapshot[workerId] = assets.filter((asset) => Boolean(asset.aiDescription) && (!asset.tags || asset.tags.length === 0)).length;
          break;
        case 'title-worker':
          snapshot[workerId] = assets.filter((asset) => Boolean(asset.aiDescription) && !asset.title).length;
          break;
        case 'nsfw-worker':
          snapshot[workerId] = assets.filter((asset) => Boolean(asset.aiThumbnailPath || asset.thumbnailPath) && !asset.nsfwProcessedAt).length;
          break;
        case 'face-worker':
          snapshot[workerId] = assets.filter(
            (asset) => ['PHOTO', 'VIDEO'].includes(asset.assetType) && Boolean(asset.aiThumbnailPath || asset.thumbnailPath) && !asset.facesProcessedAt
          ).length;
          break;
        case 'face-cluster-worker':
          snapshot[workerId] = unclusteredFacesCount;
          break;
        default:
          snapshot[workerId] = 0;
      }
    }

    return snapshot;
  }

  private async getImportPendingItems(): Promise<number> {
    const files = await this.getFilesInDirectory(this.importDir);
    return files.length;
  }

  private async getFilesInDirectory(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      let files: string[] = [];

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          files = files.concat(await this.getFilesInDirectory(fullPath));
        } else {
          files.push(fullPath);
        }
      }

      return files;
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
