import { Asset } from '../../domain/entities/Asset.js';
import { IOllamaService } from '../ports/out/IOllamaService.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { BaseAssetWorker } from './BaseAssetWorker.js';

const NSFW_PROMPT = `Clasifica seguridad del contenido visual.
Devuelve JSON exacto:
{"nsfw_score":0.0,"reason":"..."}
nsfw_score entre 0 y 1.`;

export class NsfwTaskRunner extends BaseAssetWorker {
  public readonly id = 'nsfw-worker';
  public readonly label = 'NSFW Analyzer';
  public readonly provides = ['nsfw_scores'];
  public readonly requires = ['thumbnails'];

  constructor(
    eventBus: IEventBus,
    uow: IUnitOfWork,
    public readonly intervalMs: number,
    private readonly ollama: IOllamaService,
    private readonly nsfwThreshold: number
  ) {
    super(eventBus, uow);
  }

  protected isPending(asset: Asset): boolean {
    return Boolean(asset.aiThumbnailPath || asset.thumbnailPath) && !asset.nsfwProcessedAt;
  }

  protected acquireResources(): boolean {
    return this.ollama.acquireLock(this.id);
  }

  protected releaseResources(): void {
    this.ollama.releaseLock(this.id);
  }

  protected async processAsset(asset: Asset): Promise<void> {
    const imagePath = asset.aiThumbnailPath || asset.thumbnailPath;
    if (!imagePath) return;

    const raw = await this.ollama.describeImage(imagePath, NSFW_PROMPT);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return;

    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(match[0]) as Record<string, any>;
    } catch {
      return;
    }

    const score = Number(parsed.nsfw_score);
    if (!Number.isFinite(score)) return;

    asset.isNsfw = score >= this.nsfwThreshold;
    asset.nsfwReason = typeof parsed.reason === 'string' ? parsed.reason : undefined;
    asset.nsfwProcessedAt = new Date().toISOString();
    await this.uow.assets.save(asset);
  }
}

