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
  private readonly activeWorkers = new Set<string>();
  private activeKind: 'text' | 'vision' | null = null;

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

  public acquireLock(workerId: string): boolean {
    const kind = this.getLockKind(workerId);

    if (this.activeWorkers.has(workerId)) return true;
    if (this.activeKind && this.activeKind !== kind) return false;
    if (this.activeWorkers.size >= this.getLockLimit(workerId)) return false;

    this.activeWorkers.add(workerId);
    this.activeKind = kind;
    return true;
  }

  public releaseLock(workerId: string): void {
    if (this.activeWorkers.delete(workerId) && this.activeWorkers.size === 0) {
      this.activeKind = null;
    }
  }

  private getLockLimit(workerId: string): number {
    const configured = this.getLockKind(workerId) === 'text' ? this.textConcurrency : this.visionConcurrency;
    return Math.max(1, Math.floor(configured));
  }

  private getLockKind(workerId: string): 'text' | 'vision' {
    return workerId === 'tags-worker' || workerId === 'title-worker' ? 'text' : 'vision';
  }

  public async describeImage(imagePath: string, prompt: string, task: OllamaVisionTask = 'description'): Promise<string> {
    const b64 = await this.toJpegBase64(imagePath);
    return this.chat(this.visionModel, prompt, VISION_TASK_CONFIG[task], [b64]);
  }

  public async extractJson(text: string, prompt: string, task: OllamaTextTask = 'tags'): Promise<Record<string, any>> {
    const content = await this.chat(this.textModel, `${prompt}

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

  private async chat(model: string, prompt: string, config: OllamaTaskConfig, images?: string[]): Promise<string> {
    const url = new URL(`${this.baseUrl.replace(/\/$/, '')}/api/chat`);
    const payload = JSON.stringify({
      model,
      stream: false,
      keep_alive: this.keepAlive,
      ...(config.format ? { format: config.format } : {}),
      options: config.options,
      messages: [{ role: 'user', content: prompt, ...(images ? { images } : {}) }]
    });

    return new Promise((resolve, reject) => {
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
  }
}
