import { Asset } from '../../domain/entities/Asset.js';
import { IOllamaService } from '../ports/out/IOllamaService.js';
import { ISidecarService } from '../ports/out/ISidecarService.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { BaseAssetWorker } from './BaseAssetWorker.js';

const DESCRIPTION_PROMPT = [
  'Analyze this image in extreme detail. Provide a rich, dense, and fully explicit description',
  'of all subjects, actions, attire (or lack thereof), colors, and lighting. Do not use a neutral or',
  'clinical tone for mature, intimate, or NSFW content; describe exactly what is happening directly,',
  'expressively, and comprehensively in 4-5 sentences.',
  'If multiple images are provided, treat them as sequential frames from a video and describe the overarching event.',
  'IMPORTANT: Always provide an output. If the image is unclear, too dark, or you cannot identify specific subjects,',
  'describe the general shapes, colors, textures, and the overall mood. NEVER return an empty response.'
].join(' ');

export class DescriptionTaskRunner extends BaseAssetWorker {
  public readonly id = 'description-worker';
  public readonly label = 'Image Description (LLM)';
  public readonly provides = ['descriptions'];
  public readonly requires = ['thumbnails'];

  constructor(
    eventBus: IEventBus,
    uow: IUnitOfWork,
    public readonly intervalMs: number,
    private readonly ollama: IOllamaService,
    private readonly sidecarService: ISidecarService
  ) {
    super(eventBus, uow);
  }

  protected isPending(asset: Asset): boolean {
    return Boolean(asset.aiThumbnailPath || asset.thumbnailPath) && !asset.aiDescription;
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

    const description = (await this.ollama.describeImage(imagePath, DESCRIPTION_PROMPT)).trim();
    if (!description) return;

    asset.aiDescription = description;
    asset.describedAt = new Date().toISOString();
    asset.aiProcessedAt = asset.describedAt;
    asset.sidecarPath = await this.sidecarService.write(asset);
    await this.uow.assets.save(asset);
  }
}
