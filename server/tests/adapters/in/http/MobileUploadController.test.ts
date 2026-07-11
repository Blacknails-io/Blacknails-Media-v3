import assert from 'node:assert/strict';
import { access, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { AddressInfo } from 'node:net';
import { describe, it } from 'node:test';
import express from 'express';
import { MobileUploadController } from '../../../../src/adapters/in/http/MobileUploadController.js';
import { User } from '../../../../src/domain/entities/User.js';

async function listFilesRecursive(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function listVisibleImportFiles(importDir: string): Promise<string[]> {
  if (!(await exists(importDir))) return [];
  return (await listFilesRecursive(importDir)).filter((file) => !file.includes('.mobile-staging'));
}

async function createTestServer(options: { role?: 'ADMIN' | 'STANDARD' | 'VIEWER' | null }) {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'bn-mobile-upload-'));
  const importDir = path.join(rootDir, 'library', 'import');
  const app = express();
  const user = options.role
    ? new User({
        id: 'user-1',
        username: 'mobile-user',
        passwordHash: 'hash',
        role: options.role
      })
    : null;
  const getSessionUserUseCase = {
    async execute(token: string) {
      return token === 'valid-token' ? user : null;
    }
  };
  const controller = new MobileUploadController(getSessionUserUseCase, importDir);
  app.use('/api/mobile', controller.router);

  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;

  return {
    rootDir,
    importDir,
    baseUrl: `http://127.0.0.1:${address.port}`,
    async cleanup() {
      await new Promise<void>((resolve, reject) => {
        server.close((error?: Error) => error ? reject(error) : resolve());
      });
      await rm(rootDir, { recursive: true, force: true });
    }
  };
}

async function postMedia(baseUrl: string, options: {
  token?: string;
  deviceId?: string;
  filename: string;
  content: string;
}) {
  const body = new FormData();
  body.append('media', new Blob([options.content], { type: 'image/jpeg' }), options.filename);

  return fetch(`${baseUrl}/api/mobile/uploads`, {
    method: 'POST',
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.deviceId ? { 'X-Device-Id': options.deviceId } : {})
    },
    body
  });
}

describe('MobileUploadController', () => {
  it('stores an authenticated ADMIN upload directly under the import directory using sanitized names', async () => {
    const env = await createTestServer({ role: 'ADMIN' });
    try {
      const response = await postMedia(env.baseUrl, {
        token: 'valid-token',
        deviceId: '../Ivan iPhone 15 Pro',
        filename: '../IMG 0001.JPG',
        content: 'fake-jpeg-content'
      });

      assert.equal(response.status, 202);
      const payload = await response.json() as any;
      assert.equal(payload.status, 'accepted');
      assert.equal(payload.deviceId, 'Ivan-iPhone-15-Pro');
      assert.doesNotMatch(payload.importPath, /\//);
      assert.match(payload.filename, /IMG-0001\.jpg$/);

      const importedFiles = (await listFilesRecursive(env.importDir)).filter((file) => !file.includes('.mobile-staging'));
      assert.equal(importedFiles.length, 1);
      assert.equal(await readFile(importedFiles[0], 'utf8'), 'fake-jpeg-content');
      assert.equal(path.dirname(importedFiles[0]), env.importDir);
      assert.equal(await exists(path.join(env.importDir, '.mobile-staging')), false);
    } finally {
      await env.cleanup();
    }
  });

  it('rejects non-admin users', async () => {
    const env = await createTestServer({ role: 'VIEWER' });
    try {
      const response = await postMedia(env.baseUrl, {
        token: 'valid-token',
        deviceId: 'viewer-phone',
        filename: 'IMG_0002.jpg',
        content: 'content'
      });

      assert.equal(response.status, 403);
      assert.deepEqual(await listVisibleImportFiles(env.importDir), []);
      assert.equal(await exists(path.join(env.importDir, '.mobile-staging')), false);
    } finally {
      await env.cleanup();
    }
  });

  it('rejects unsupported extensions and removes staged files', async () => {
    const env = await createTestServer({ role: 'ADMIN' });
    try {
      const response = await postMedia(env.baseUrl, {
        token: 'valid-token',
        deviceId: 'ivan-phone',
        filename: 'notes.txt',
        content: 'not media'
      });

      assert.equal(response.status, 400);
      const payload = await response.json() as any;
      assert.match(payload.error, /extensión no soportada/i);
      assert.deepEqual(await listVisibleImportFiles(env.importDir), []);
      assert.equal(await exists(path.join(env.importDir, '.mobile-staging')), false);
    } finally {
      await env.cleanup();
    }
  });
});
