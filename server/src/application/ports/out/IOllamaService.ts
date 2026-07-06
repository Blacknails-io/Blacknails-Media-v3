export type OllamaVisionTask = 'description' | 'nsfw' | 'face-validation';
export type OllamaTextTask = 'tags' | 'title';

export interface IOllamaService {
  describeImage(imagePath: string, prompt: string, task?: OllamaVisionTask): Promise<string>;
  extractJson(text: string, prompt: string, task?: OllamaTextTask): Promise<Record<string, any>>;
}
