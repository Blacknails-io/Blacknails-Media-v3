import { IOllamaService, OllamaTextTask, OllamaVisionTask } from '../../../application/ports/out/IOllamaService.js';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import * as http from 'http';
import * as https from 'https';

const execFileAsync = promisify(execFile);

type OllamaFormat = 'json';

type OllamaKind = 'vision' | 'text';

interface SlotWaiter {
  kind: OllamaKind;
  resolve: () => void;
}

interface OllamaChatResponse {
  message?: { content?: string };
}

interface OllamaTaskConfig {
  format?: OllamaFormat;
  options: Record<string, number>;
  timeoutMs: number;
}

const VISION_TASK_CONFIG: Record<OllamaVisionTask, OllamaTaskConfig> = {
  description: {
    options: { temperature: 0.45, num_predict: 700, top_p: 0.9, top_k: 40 },
    timeoutMs: 120000
  },
  nsfw: {
    format: 'json',
    options: { temperature: 0, num_predict: 96, top_p: 0.4, top_k: 10 },
    timeoutMs: 60000
  },
  'face-validation': {
    format: 'json',
    options: { temperature: 0, num_predict: 80, top_p: 0.4, top_k: 10 },
    timeoutMs: 60000
  }
};

const TEXT_TASK_CONFIG: Record<OllamaTextTask, OllamaTaskConfig> = {
  tags: {
    format: 'json',
    options: { temperature: 0.1, num_predict: 600, top_p: 0.7, top_k: 20 },
    timeoutMs: 60000
  },
  title: {
    format: 'json',
    options: { temperature: 0.2, num_predict: 80, top_p: 0.75, top_k: 20 },
    timeoutMs: 30000
  }
};

export class OllamaService implements IOllamaService {
  private activeKind: OllamaKind | null = null;
  private inFlight = 0;
  private readonly waiters: SlotWaiter[] = [];

  constructor(
    private readonly baseUrl: string,
    private readonly visionModel: string,
    private readonly textModel: string,
    private readonly visionConcurrency = 2,
    private readonly textConcurrency = 2,
    private readonly keepAlive = '5m'
  ) {}

  /**
   * Ollama does not accept WebP images. Convert to JPEG via ffmpeg before sending.
   */
  private async toJpegBase64(imagePath: string): Promise<string> {
    if (!imagePath.toLowerCase().endsWith('.webp')) {
      const raw = await fs.readFile(imagePath);
      return raw.toString('base64');
    }
    const tmpPath = join(tmpdir(), `bn-ollama-${randomUUID()}.jpg`);
    try {
      await execFileAsync('ffmpeg', ['-y', '-i', imagePath, '-q:v', '3', tmpPath]);
      const raw = await fs.readFile(tmpPath);
      return raw.toString('base64');
    } finally {
      await fs.unlink(tmpPath).catch(() => {});
    }
  }

  /**
   * Concurrency control shared by every request.
   *
   * A single kind (vision or text) runs at a time: mixing them only splits the
   * iGPU memory bandwidth for no aggregate throughput gain. Within the active
   * kind, up to `limitFor(kind)` requests run concurrently so same-model batching
   * amortizes the weight reads. The cap counts real in-flight requests (not
   * workers), so it holds no matter how many assets a worker dispatches at once
   * and must match the runtime's OLLAMA_NUM_PARALLEL. Excess requests queue.
   */
  private limitFor(kind: OllamaKind): number {
    const configured = kind === 'text' ? this.textConcurrency : this.visionConcurrency;
    return Math.max(1, Math.floor(configured));
  }

  private canRun(kind: OllamaKind): boolean {
    return (this.activeKind === null || this.activeKind === kind) && this.inFlight < this.limitFor(kind);
  }

  private acquireSlot(kind: OllamaKind): Promise<void> {
    if (this.canRun(kind)) {
      this.inFlight++;
      this.activeKind = kind;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.waiters.push({ kind, resolve });
    });
  }

  private releaseSlot(kind: OllamaKind): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
    if (this.inFlight === 0) {
      this.activeKind = null;
    }
    this.pump();
  }

  private pump(): void {
    for (let i = 0; i < this.waiters.length; ) {
      const waiter = this.waiters[i];
      if (this.canRun(waiter.kind)) {
        this.waiters.splice(i, 1);
        this.inFlight++;
        this.activeKind = waiter.kind;
        waiter.resolve();
      } else {
        i++;
      }
    }
  }

  public async describeImage(imagePath: string, prompt: string, task: OllamaVisionTask = 'description'): Promise<string> {
    const b64 = await this.toJpegBase64(imagePath);
    return this.chat(this.visionModel, 'vision', prompt, VISION_TASK_CONFIG[task], [b64]);
  }

  public async extractJson(text: string, prompt: string, task: OllamaTextTask = 'tags'): Promise<Record<string, any>> {
    const content = await this.chat(this.textModel, 'text', `${prompt}

Texto:
${text}`, TEXT_TASK_CONFIG[task]);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {};
    }

    try {
      return JSON.parse(jsonMatch[0]) as Record<string, any>;
    } catch {
      return {};
    }
  }

  private async chat(model: string, kind: OllamaKind, prompt: string, config: OllamaTaskConfig, images?: string[]): Promise<string> {
    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/api/chat`);
    const payload = JSON.stringify({
      model,
      stream: false,
      keep_alive: this.keepAlive,
      ...(config.format ? { format: config.format } : {}),
      options: config.options,
      messages: [{ role: 'user', content: prompt, ...(images ? { images } : {}) }]
    });

    await this.acquireSlot(kind);
    try {
      return await new Promise<string>((resolve, reject) => {
        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: config.timeoutMs
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`Ollama request failed (${res.statusCode}): ${body}`));
              return;
            }
            try {
              const parsed = JSON.parse(body) as OllamaChatResponse;
              resolve(parsed.message?.content?.trim() || '');
            } catch (err) {
              reject(err);
            }
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy(new Error('Request timed out'));
        });
        req.write(payload);
        req.end();
      });
    } finally {
      this.releaseSlot(kind);
    }
  }
}
