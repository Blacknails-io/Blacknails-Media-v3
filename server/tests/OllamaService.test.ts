import assert from 'node:assert/strict';
import test from 'node:test';
import * as http from 'node:http';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { OllamaService } from '../src/adapters/out/services/OllamaService.js';

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 20));

async function waitFor(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitFor timed out');
    await new Promise<void>((resolve) => setTimeout(resolve, 5));
  }
}

test('ollama caps concurrent same-kind requests at the configured limit', async () => {
  let active = 0;
  let maxActive = 0;
  let arrived = 0;
  const releases: Array<() => void> = [];
  const server = http.createServer((req, res) => {
    req.on('data', () => {});
    req.on('end', () => {
      arrived++;
      active++;
      maxActive = Math.max(maxActive, active);
      releases.push(() => {
        active--;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ message: { content: '{"ok":true}' } }));
      });
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address() as any;
    const ollama = new OllamaService(`http://127.0.0.1:${address.port}`, 'vision-model', 'text-model', 2, 2, '5m');

    const pending = [
      ollama.extractJson('a', 'p', 'tags'),
      ollama.extractJson('b', 'p', 'tags'),
      ollama.extractJson('c', 'p', 'tags'),
      ollama.extractJson('d', 'p', 'tags')
    ];

    await waitFor(() => arrived >= 2);
    await tick();
    assert.equal(active, 2, 'only two text requests should be in-flight at once');
    assert.equal(arrived, 2, 'surplus requests must queue in the semaphore, not reach the server');

    releases.shift()!();
    releases.shift()!();
    await waitFor(() => arrived >= 4);
    assert.equal(active, 2, 'freeing two slots lets exactly two queued requests proceed');

    releases.shift()!();
    releases.shift()!();
    await Promise.all(pending);
    assert.equal(maxActive, 2, 'concurrency never exceeded the configured limit');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('ollama never runs vision and text requests concurrently', async () => {
  const seen: string[] = [];
  const releases: Array<() => void> = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
      seen.push((JSON.parse(body) as { model: string }).model);
      releases.push(() => {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ message: { content: '{"ok":true}' } }));
      });
    });
  });

  const tmp = await mkdtemp(join(tmpdir(), 'bn-ollama-kind-'));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address() as any;
    const imagePath = join(tmp, 'image.jpg');
    await writeFile(imagePath, Buffer.from('fake-jpeg'));
    const ollama = new OllamaService(`http://127.0.0.1:${address.port}`, 'vision-model', 'text-model', 2, 2, '5m');

    const visionPromise = ollama.describeImage(imagePath, 'describe', 'description');
    await waitFor(() => seen.length >= 1);

    const textPromise = ollama.extractJson('t', 'p', 'tags');
    await tick();
    assert.deepEqual(seen, ['vision-model'], 'text must not reach the server while vision is active');

    releases.shift()!();
    await waitFor(() => seen.length >= 2);
    assert.deepEqual(seen, ['vision-model', 'text-model'], 'text runs only after vision drains');

    releases.shift()!();
    await Promise.all([visionPromise, textPromise]);
  } finally {
    await rm(tmp, { recursive: true, force: true });
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
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
