import assert from 'node:assert/strict';
import test from 'node:test';
import * as http from 'node:http';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
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


test('ollama chat requests include per-call keep_alive and text task options', async () => {
  let requestBody = '';
  const server = http.createServer((req, res) => {
    req.on('data', (chunk) => {
      requestBody += chunk.toString();
    });
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ message: { content: '{"ok":true}' } }));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert.equal(typeof address, 'object');
    assert.ok(address);
    const ollama = new OllamaService(`http://127.0.0.1:${address.port}`, 'vision-model', 'text-model', 2, 2, '5m');

    await ollama.extractJson('texto', 'Devuelve JSON', 'title');

    const payload = JSON.parse(requestBody) as Record<string, unknown>;
    assert.equal(payload.model, 'text-model');
    assert.equal(payload.keep_alive, '5m');
    assert.equal(payload.stream, false);
    assert.equal(payload.format, 'json');
    assert.deepEqual(payload.options, { temperature: 0.2, num_predict: 80, top_p: 0.75, top_k: 20 });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});


test('ollama vision task requests include format and deterministic options', async () => {
  const requestBodies: string[] = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      requestBodies.push(body);
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ message: { content: '{"store_faces":true,"reason":"face"}' } }));
    });
  });

  const tmp = await mkdtemp(join(tmpdir(), 'bn-ollama-service-'));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert.equal(typeof address, 'object');
    assert.ok(address);
    const imagePath = join(tmp, 'image.jpg');
    await writeFile(imagePath, Buffer.from('fake-jpeg'));
    const ollama = new OllamaService(`http://127.0.0.1:${address.port}`, 'vision-model', 'text-model', 2, 2, '5m');

    await ollama.describeImage(imagePath, 'Validate faces', 'face-validation');

    const payload = JSON.parse(requestBodies[0]) as any;
    assert.equal(payload.model, 'vision-model');
    assert.equal(payload.format, 'json');
    assert.deepEqual(payload.options, { temperature: 0, num_predict: 80, top_p: 0.4, top_k: 10 });
    assert.equal(payload.messages[0].images.length, 1);
  } finally {
    await rm(tmp, { recursive: true, force: true });
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
