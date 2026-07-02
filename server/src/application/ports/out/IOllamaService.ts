export interface IOllamaService {
  describeImage(imagePath: string, prompt: string): Promise<string>;
  extractJson(text: string, prompt: string): Promise<Record<string, any>>;
  acquireLock(workerId: string): boolean;
  releaseLock(workerId: string): void;
}

