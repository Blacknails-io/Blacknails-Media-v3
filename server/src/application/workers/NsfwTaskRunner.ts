import { Asset } from '../../domain/entities/Asset.js';
import { IOllamaService } from '../ports/out/IOllamaService.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { BaseAssetWorker } from './BaseAssetWorker.js';

const NSFW_PROMPT = `Analiza detalladamente esta imagen. Quiero que clasifiques si contiene contenido NSFW, vulgar o sexualmente explícito.
Presta especial atención y detecta cualquier tipo de:
- Desnudez explícita
- Fetichismos (leather, rubber, latex, militar, uniformes)
- Prácticas sexuales (fist fucking, piss, golden shower, anal, oral, BDSM)
- Modificaciones corporales extremas (piercings genitales o en pezones)
- Órganos sexuales (especialmente penes grandes, black penis, vaginas abiertas)
- Fluidos corporales, semen, orina
- Cualquier otro contenido de alto voltaje erótico o pornográfico.

Devuelve un JSON exacto con la siguiente estructura:
{"nsfw_score":0.0,"reason":"[explica detalladamente lo que ves, enumerando las etiquetas o fetiches detectados]"}
nsfw_score debe ser un número entre 0 y 1 (donde 1 es contenido puramente pornográfico o fetichista extremo).
SOLO DEVUELVE EL JSON. No añadas texto fuera de él.`;

export class NsfwTaskRunner extends BaseAssetWorker {
  public readonly id = 'nsfw-worker';
  public readonly label = 'NSFW Analyzer';
  public readonly provides = ['nsfw_scores'];
  public readonly requires = ['image_transcodes', 'video_transcodes'];

  constructor(
    eventBus: IEventBus,
    uow: IUnitOfWork,
    public readonly intervalMs: number,
    private readonly ollama: IOllamaService,
    private readonly nsfwThreshold: number,
    batchSize = 1
  ) {
    super(eventBus, uow, batchSize);
  }

  protected isPending(asset: Asset): boolean {
    return Boolean(asset.aiThumbnailPath || asset.thumbnailPath) && !asset.nsfwProcessedAt;
  }

  protected async processAsset(asset: Asset): Promise<void> {
    const imagePath = asset.aiThumbnailPath || asset.thumbnailPath;
    if (!imagePath) return;

    const raw = await this.ollama.describeImage(imagePath, NSFW_PROMPT, 'nsfw');
    asset.nsfwProcessedAt = new Date().toISOString();
    
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      await this.uow.assets.save(asset);
      return;
    }

    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(match[0]) as Record<string, any>;
    } catch {
      await this.uow.assets.save(asset);
      return;
    }

    const score = Number(parsed.nsfw_score);
    if (!Number.isFinite(score)) {
      await this.uow.assets.save(asset);
      return;
    }

    asset.isNsfw = score >= this.nsfwThreshold;
    asset.nsfwReason = typeof parsed.reason === 'string' ? parsed.reason : undefined;
    await this.uow.assets.save(asset);
  }
}

