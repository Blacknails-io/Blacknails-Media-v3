import type { Page } from '@playwright/test';
import type { MediaAsset } from '../../../src/types/MediaAsset.js';

export type UserRole = 'ADMIN' | 'STANDARD' | 'VIEWER';

export interface PersonMock {
  id: string;
  label: string;
  name?: string;
  faceCount: number;
  bbox: { x: number; y: number; width: number; height: number };
  thumbnailUrl: string;
}

const initialUsers = [
  { id: 'admin-1', username: 'admin', role: 'ADMIN' as UserRole, isActive: true, createdAt: '2026-06-30T08:00:00.000Z' },
  { id: 'admin-2', username: 'backup', role: 'ADMIN' as UserRole, isActive: true, createdAt: '2026-06-30T08:02:00.000Z' },
  { id: 'viewer-1', username: 'viewer', role: 'VIEWER' as UserRole, isActive: true, createdAt: '2026-06-30T08:05:00.000Z' }
];

export const buildAdminMocks = async (page: Page, options?: { assets?: MediaAsset[]; people?: PersonMock[]; personAssets?: Record<string, MediaAsset[]> }) => {
  const state = {
    users: structuredClone(initialUsers),
    workers: [
      {
        id: 'import-worker',
        label: 'Importador',
        isRunning: false,
        intervalMs: 10000,
        pendingItems: 2,
        lastRunAt: '2026-06-30T08:10:00.000Z',
        isExecuting: false,
        provides: ['original_files'],
        requires: []
      },
      {
        id: 'index-worker',
        label: 'Indexador',
        isRunning: false,
        intervalMs: 15000,
        pendingItems: 1,
        lastRunAt: '2026-06-30T08:11:00.000Z',
        isExecuting: false,
        provides: ['assets'],
        requires: ['original_files']
      },
      {
        id: 'image-preview-worker',
        label: 'Image Preview',
        isRunning: false,
        intervalMs: 15000,
        pendingItems: 1,
        lastRunAt: '2026-06-30T08:12:00.000Z',
        isExecuting: false,
        provides: ['image_previews'],
        requires: ['assets']
      },
      {
        id: 'video-preview-worker',
        label: 'Video Preview',
        isRunning: false,
        intervalMs: 15000,
        pendingItems: 1,
        lastRunAt: '2026-06-30T08:12:30.000Z',
        isExecuting: false,
        provides: ['video_previews'],
        requires: ['assets']
      },
      {
        id: 'image-transcode-worker',
        label: 'Image Transcode',
        isRunning: false,
        intervalMs: 15000,
        pendingItems: 0,
        lastRunAt: '2026-06-30T08:12:45.000Z',
        isExecuting: false,
        provides: ['image_transcodes'],
        requires: ['image_previews']
      },
      {
        id: 'video-transcode-worker',
        label: 'Video Transcode',
        isRunning: false,
        intervalMs: 15000,
        pendingItems: 0,
        lastRunAt: '2026-06-30T08:12:50.000Z',
        isExecuting: false,
        provides: ['video_transcodes'],
        requires: ['video_previews']
      },
      {
        id: 'description-worker',
        label: 'Descripciones',
        isRunning: true,
        intervalMs: 30000,
        pendingItems: 3,
        lastRunAt: '2026-06-30T08:13:00.000Z',
        isExecuting: true,
        currentAssetType: 'PHOTO',
        provides: ['descriptions'],
        requires: ['image_transcodes', 'video_transcodes']
      },
      {
        id: 'nsfw-worker',
        label: 'NSFW',
        isRunning: false,
        intervalMs: 30000,
        pendingItems: 3,
        lastRunAt: '2026-06-30T08:14:00.000Z',
        isExecuting: false,
        provides: ['nsfw_scores'],
        requires: ['image_transcodes', 'video_transcodes']
      },
      {
        id: 'face-worker',
        label: 'Caras',
        isRunning: false,
        intervalMs: 45000,
        pendingItems: 3,
        lastRunAt: '2026-06-30T08:15:00.000Z',
        isExecuting: false,
        provides: ['faces'],
        requires: ['image_transcodes', 'video_transcodes']
      },
      {
        id: 'tags-worker',
        label: 'Tags',
        isRunning: false,
        intervalMs: 30000,
        pendingItems: 0,
        lastRunAt: '2026-06-30T08:16:00.000Z',
        isExecuting: false,
        provides: ['tags'],
        requires: ['descriptions']
      },
      {
        id: 'title-worker',
        label: 'Titulos',
        isRunning: false,
        intervalMs: 30000,
        pendingItems: 0,
        lastRunAt: '2026-06-30T08:17:00.000Z',
        isExecuting: false,
        provides: ['titles'],
        requires: ['descriptions']
      },
      {
        id: 'face-cluster-worker',
        label: 'Personas',
        isRunning: false,
        intervalMs: 90000,
        pendingItems: 0,
        lastRunAt: '2026-06-30T08:18:00.000Z',
        isExecuting: false,
        provides: ['face_clusters'],
        requires: ['faces']
      }
    ],
    nextId: 1,
    people: structuredClone(options?.people ?? [])
  };

  await page.route('**/api/auth/login', async (route) => {
    const body = route.request().postDataJSON() as { username: string; password: string };
    if (body.username === 'admin' && body.password === 'admin123') {
      await route.fulfill({
        json: {
          token: 'admin-token',
          username: 'admin',
          role: 'ADMIN',
          isActive: true,
          expiresAt: '2026-07-01T23:59:59.000Z'
        }
      });
      return;
    }

    await route.fulfill({ status: 401, json: { error: 'Credenciales incorrectas.' } });
  });

  await page.route('**/api/assets', async (route) => {
    await route.fulfill({ json: options?.assets ?? [] });
  });

  await page.route('**/api/people/*/assets', async (route) => {
    const personId = route.request().url().split('/').slice(-2, -1)[0];
    await route.fulfill({ json: options?.personAssets?.[personId] ?? [] });
  });

  await page.route('**/api/people/*', async (route) => {
    const method = route.request().method();
    if (method !== 'PUT' && method !== 'DELETE') {
      await route.fallback();
      return;
    }

    const personId = route.request().url().split('/').at(-1) as string;
    if (method === 'DELETE') {
      state.people = state.people.filter((person) => person.id !== personId);
      await route.fulfill({ json: { deletedFaces: 1 } });
      return;
    }

    const body = route.request().postDataJSON() as { name: string };
    state.people = state.people.map((person) => (
      person.id === personId ? { ...person, name: body.name } : person
    ));
    await route.fulfill({ json: state.people.find((person) => person.id === personId) });
  });

  await page.route('**/api/people', async (route) => {
    await route.fulfill({ json: state.people });
  });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      json: {
        id: 'admin-1',
        username: 'admin',
        role: 'ADMIN',
        isActive: true,
        createdAt: '2026-06-30T08:00:00.000Z'
      }
    });
  });

  await page.route('**/api/admin/users', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: state.users });
      return;
    }

    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { username: string; password: string; role: UserRole };
      const created = {
        id: `user-${state.nextId++}`,
        username: body.username,
        role: body.role,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      state.users = [created, ...state.users];
      await route.fulfill({ status: 201, json: created });
      return;
    }

    await route.fulfill({ status: 405, json: { error: 'Método no permitido.' } });
  });

  await page.route('**/api/admin/users/*/role', async (route) => {
    const userId = route.request().url().split('/').slice(-2, -1)[0];
    const body = route.request().postDataJSON() as { role: UserRole };
    state.users = state.users.map((user) => (
      user.id === userId
        ? { ...user, role: body.role }
        : user
    ));

    const updated = state.users.find((user) => user.id === userId);
    await route.fulfill({
      json: updated
    });
  });

  await page.route('**/api/admin/users/*/active', async (route) => {
    const userId = route.request().url().split('/').slice(-2, -1)[0];
    const body = route.request().postDataJSON() as { isActive: boolean };
    state.users = state.users.map((user) => (
      user.id === userId
        ? { ...user, isActive: body.isActive }
        : user
    ));

    const updated = state.users.find((user) => user.id === userId);
    await route.fulfill({
      json: updated
    });
  });

  await page.route('**/api/admin/users/*', async (route) => {
    if (route.request().method() !== 'DELETE') {
      await route.fallback();
      return;
    }

    const userId = route.request().url().split('/').at(-1) as string;
    state.users = state.users.filter((user) => user.id !== userId);
    await route.fulfill({ json: { id: userId, username: 'deleted' } });
  });

  await page.route('**/api/admin/pipeline/workers', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: state.workers });
      return;
    }

    await route.fulfill({ status: 405, json: { error: 'Método no permitido.' } });
  });

  await page.route('**/api/admin/pipeline/workers/*/start', async (route) => {
    const workerId = route.request().url().split('/').slice(-2, -1)[0];
    state.workers = state.workers.map((worker) => worker.id === workerId ? { ...worker, isRunning: true } : worker);
    await route.fulfill({ json: state.workers.find((worker) => worker.id === workerId) });
  });

  await page.route('**/api/admin/pipeline/workers/*/stop', async (route) => {
    const workerId = route.request().url().split('/').slice(-2, -1)[0];
    state.workers = state.workers.map((worker) => worker.id === workerId ? { ...worker, isRunning: false } : worker);
    await route.fulfill({ json: state.workers.find((worker) => worker.id === workerId) });
  });

  await page.route('**/api/admin/pipeline/workers/*/trigger', async (route) => {
    const workerId = route.request().url().split('/').slice(-2, -1)[0];
    state.workers = state.workers.map((worker) => (
      worker.id === workerId
        ? { ...worker, lastTriggeredAt: new Date().toISOString(), lastRunAt: new Date().toISOString() }
        : worker
    ));
    await route.fulfill({ json: state.workers.find((worker) => worker.id === workerId) });
  });

  await page.route('**/api/admin/pipeline/workers/*/reset', async (route) => {
    const workerId = route.request().url().split('/').slice(-2, -1)[0];
    await route.fulfill({ json: state.workers.find((worker) => worker.id === workerId) });
  });

  return state;
};
