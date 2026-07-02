import { Asset } from '../../domain/entities/Asset.js';
import { IOllamaService } from '../ports/out/IOllamaService.js';
import { ISidecarService } from '../ports/out/ISidecarService.js';
import { IEventBus } from '../ports/out/IEventBus.js';
import { IUnitOfWork } from '../ports/out/IUnitOfWork.js';
import { BaseAssetWorker } from './BaseAssetWorker.js';

const TAG_PROMPT = `You are a semantic tag extractor. Analyze the text below and extract tags following these strict rules:

RULE 1 — NOUNS: Extract all significant nouns. Preserve their natural gender (man/woman, boy/girl, king/queen…). If a noun has qualifying adjectives, create ONE separate tag for EACH adjective paired with that noun (e.g. 'big blue car' -> BIG CAR and BLUE CAR; 'dark wet street' -> DARK STREET and WET STREET; 'black nails' -> BLACK NAILS). Do NOT merge multiple adjectives into a single tag (no 'BIG BLUE CAR'); instead split them.

RULE 2 — VERBS: Extract significant actions as their base infinitive form (e.g. 'is running' -> RUN, 'showed' -> SHOW, 'are kissing' -> KISS, 'having fun' -> HAVE FUN). Skip auxiliary verbs (is, are, was, have) unless they are part of a meaningful compound action.

RULE 3 — NO DUPLICATES: Each concept must appear only once.

RULE 4 — UPPERCASE: All tags must be in uppercase.

Example input: 'A young tattooed woman is sitting on a big black leather sofa while cold blue light fills the room'
Example output: {"concepts": [{"tag": "YOUNG WOMAN"}, {"tag": "TATTOOED WOMAN"}, {"tag": "SIT"}, {"tag": "BIG SOFA"}, {"tag": "BLACK SOFA"}, {"tag": "LEATHER SOFA"}, {"tag": "COLD LIGHT"}, {"tag": "BLUE LIGHT"}]}

Respond ONLY with valid JSON in exactly this format, no extra text, no markdown:
{"concepts": [{"tag": "TAG ONE"}, {"tag": "TAG TWO"}]}
The object key must be lowercase "tag". The tag values must be uppercase.`;

export class TagsTaskRunner extends BaseAssetWorker {
  public readonly id = 'tags-worker';
  public readonly label = 'Tags Extractor';
  public readonly provides = ['tags'];
  public readonly requires = ['descriptions'];

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
    return Boolean(asset.aiDescription) && (!asset.tags || asset.tags.length === 0);
  }

  protected acquireResources(): boolean {
    return this.ollama.acquireLock(this.id);
  }

  protected releaseResources(): void {
    this.ollama.releaseLock(this.id);
  }

  protected async processAsset(asset: Asset): Promise<void> {
    if (!asset.aiDescription) return;
    const json = await this.ollama.extractJson(asset.aiDescription, TAG_PROMPT, 'tags');
    const rawConcepts = Array.isArray(json.concepts)
      ? json.concepts
      : Array.isArray(json.tags)
        ? json.tags
        : [];
    const tags = rawConcepts
      .map((value) => {
        if (value && typeof value === 'object' && 'tag' in value) {
          return String((value as { tag: unknown }).tag).trim().toUpperCase();
        }
        return String(value).trim().toUpperCase();
      })
      .filter((value) => value.length > 0);

    if (tags.length === 0) return;

    asset.tags = Array.from(new Set(tags));
    asset.taggedAt = new Date().toISOString();
    asset.aiProcessedAt = asset.taggedAt;
    asset.sidecarPath = await this.sidecarService.write(asset);
    await this.uow.assets.save(asset);
  }
}
