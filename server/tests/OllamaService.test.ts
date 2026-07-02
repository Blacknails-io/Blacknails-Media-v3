import assert from 'node:assert/strict';
import test from 'node:test';
import { OllamaService } from '../src/adapters/out/services/OllamaService.js';

test('ollama lock keeps two slots for a single model kind', () => {
  const ollama = new OllamaService('http://localhost:11434', 'vision-model', 'text-model', 2, 2);

  assert.equal(ollama.acquireLock('description-worker'), true);
  assert.equal(ollama.acquireLock('nsfw-worker'), true);
  assert.equal(ollama.acquireLock('tags-worker'), false);

  ollama.releaseLock('description-worker');
  assert.equal(ollama.acquireLock('tags-worker'), false);

  ollama.releaseLock('nsfw-worker');
  assert.equal(ollama.acquireLock('tags-worker'), true);
  assert.equal(ollama.acquireLock('title-worker'), true);
  assert.equal(ollama.acquireLock('face-worker'), false);

  ollama.releaseLock('tags-worker');
  ollama.releaseLock('title-worker');
  assert.equal(ollama.acquireLock('face-worker'), true);
});
