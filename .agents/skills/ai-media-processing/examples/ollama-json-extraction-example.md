# Defensive Ollama JSON Extraction Example

This example demonstrates the pattern to safely query local Ollama vision/text models, acquire concurrency locks to protect GPU VRAM, and defensibly parse JSON responses to prevent backend application crashes.

---

## Safe Ollama Client Pattern

```typescript
// server/src/adapters/out/services/SafeOllamaClient.ts
export interface IOllamaService {
  acquireLock(workerId: string): boolean;
  releaseLock(workerId: string): void;
  extractJson(description: string, prompt: string, schemaKey: string): Promise<Record<string, any>>;
}

export class SafeOllamaClient {
  constructor(private readonly ollama: IOllamaService) {}

  /**
   * Extracts media tags from a textual description safely.
   */
  public async extractTagsSafely(description: string): Promise<string[]> {
    const workerId = 'tags-worker';

    // 1. Concurrency Control (VRAM Lock):
    // Acquire a mutex lock before querying to prevent overloading the GPU VRAM.
    const hasLock = this.ollama.acquireLock(workerId);
    if (!hasLock) {
      console.warn(`[SafeOllama] Could not acquire VRAM lock for ${workerId}. Postponing...`);
      return [];
    }

    try {
      const prompt = `Analyze the following image description and return a list of tags in JSON format.
Expected JSON format:
{
  "tags": ["landscape", "nature", "sunset"]
}

Description:
"${description}"`;

      // 2. Querying via the Injected Outbound Port
      const result = await this.ollama.extractJson(description, prompt, 'tags');

      // 3. Defensive Parsing with Fallbacks
      if (!result || typeof result !== 'object') {
        console.error('[SafeOllama] Returned output is not a valid JSON object.');
        return [];
      }

      if (!Array.isArray(result.tags)) {
        console.warn('[SafeOllama] The "tags" property is missing or is not a JSON array.');
        return [];
      }

      // Filter and clean tag strings
      return result.tags
        .filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0)
        .map((tag: string) => tag.toLowerCase().trim());

    } catch (error: any) {
      // 4. Exception Handling
      // Prevent network errors, model timeouts, or malformed JSON responses from crashing the node service.
      console.error('[SafeOllama] Failed to extract tags from Ollama:', error.message);
      return [];
    } finally {
      // 5. Always Release Lock
      this.ollama.releaseLock(workerId);
    }
  }
}
```
