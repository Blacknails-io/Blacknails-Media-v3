import { Asset } from '../../domain/entities/Asset.js';
import { IOllamaService } from '../ports/out/IOllamaService.js';
import { ISidecarService } from '../ports/out/ISidecarService.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { BaseAssetWorker } from './BaseAssetWorker.js';

const TITLE_PROMPT = `Based on the following image description, generate a concise, human-readable title. The title should be around 3 to 6 words long and capture the main subject or essence of the image. Write it in exactly the same language as the description. Respond ONLY with a JSON dictionary containing a single key 'title' mapped to your generated title string. Example output: {"title": "A cinematic portrait of a woman"}`;

export class TitleTaskRunner extends BaseAssetWorker {
  public readonly id = 'title-worker';
  public readonly label = 'Title Generator';
  public readonly provides = ['titles'];
  public readonly requires = ['descriptions'];

  constructor(
    eventBus: IEventBus,
    uow: IUnitOfWork,
    public readonly intervalMs: number,
    private readonly ollama: IOllamaService,
    private readonly sidecarService: ISidecarService,
    batchSize = 1
  ) {
    super(eventBus, uow, batchSize);
  }

  protected isPending(asset: Asset): boolean {
    return Boolean(asset.aiDescription) && !asset.titledAt;
  }

  protected async processAsset(asset: Asset): Promise<void> {
    if (!asset.aiDescription) return;
    const json = await this.ollama.extractJson(asset.aiDescription, TITLE_PROMPT, 'title');
    let title = typeof json.title === 'string' ? json.title.trim() : '';
    if (title.startsWith('"') && title.endsWith('"') && title.length >= 2) {
      title = title.slice(1, -1).trim();
    }
    
    if (!title) title = '[Untitled]';

    asset.title = title.length > 100 ? `${title.slice(0, 97)}...` : title;
    asset.titledAt = new Date().toISOString();
    asset.aiProcessedAt = asset.titledAt;
    asset.sidecarPath = await this.sidecarService.write(asset);
    await this.uow.assets.save(asset);
  }
}
