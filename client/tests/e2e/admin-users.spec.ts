import { expect, test, type Page } from '@playwright/test';
import type { MediaAsset } from '../../src/types/MediaAsset.js';

type UserRole = 'ADMIN' | 'STANDARD' | 'VIEWER';

const initialUsers = [
  { id: 'admin-1', username: 'admin', role: 'ADMIN' as UserRole, isActive: true, createdAt: '2026-06-30T08:00:00.000Z' },
  { id: 'admin-2', username: 'backup', role: 'ADMIN' as UserRole, isActive: true, createdAt: '2026-06-30T08:02:00.000Z' },
  { id: 'viewer-1', username: 'viewer', role: 'VIEWER' as UserRole, isActive: true, createdAt: '2026-06-30T08:05:00.000Z' }
];

const buildAdminMocks = async (page: Page, options?: { assets?: MediaAsset[] }) => {
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
        id: 'thumbnail-worker',
        label: 'Miniaturas',
        isRunning: false,
        intervalMs: 15000,
        pendingItems: 0,
        lastRunAt: '2026-06-30T08:12:00.000Z',
        isExecuting: false,
        provides: ['thumbnails'],
        requires: ['assets']
      },
      {
        id: 'description-worker',
        label: 'Descripciones',
        isRunning: false,
        intervalMs: 30000,
        pendingItems: 3,
        lastRunAt: '2026-06-30T08:13:00.000Z',
        isExecuting: false,
        provides: ['descriptions'],
        requires: ['thumbnails']
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
        requires: ['thumbnails']
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
        requires: ['thumbnails']
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
    nextId: 1
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

test('ADMIN can manage users from the sidebar', async ({ page }) => {
  const state = await buildAdminMocks(page);

  await page.goto('/');
  await page.getByLabel('USUARIO / CORREO ELECTRÓNICO').fill('admin');
  await page.getByLabel('CONTRASEÑA').fill('admin123');
  await page.locator('[data-instance-id="login-submit-btn"]').click();

  await expect(page.locator('[data-instance-id="users-menu-item"]')).toBeVisible();
  await page.locator('[data-instance-id="users-menu-item"]').click();

  await expect(page.locator('[data-instance-id="admin-users-table"]')).toBeVisible();
  await expect(page.locator('[data-instance-id="admin-user-row-viewer-1"]')).toBeVisible();

  await page.locator('[data-instance-id="admin-user-role-select-viewer-1"]').selectOption('ADMIN');
  await page.locator('[data-instance-id="admin-user-save-role-viewer-1"]').click();

  await expect(page.locator('[data-instance-id="admin-user-role-select-viewer-1"]')).toHaveValue('ADMIN');
  expect(state.users.find((user) => user.id === 'viewer-1')?.role).toBe('ADMIN');

  await page.locator('[data-instance-id="admin-user-toggle-active-viewer-1"]').click();
  await expect(page.locator('[data-instance-id="admin-user-toggle-active-viewer-1"]')).toHaveText('Activar');
  expect(state.users.find((user) => user.id === 'viewer-1')?.isActive).toBe(false);

  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });
  await page.locator('[data-instance-id="admin-user-delete-viewer-1"]').click();
  await expect(page.locator('[data-instance-id="admin-user-row-viewer-1"]')).toHaveCount(0);
  expect(state.users.find((user) => user.id === 'viewer-1')).toBeUndefined();
});

test('Last ADMIN stays protected in the UI', async ({ page }) => {
  const state = await buildAdminMocks(page);

  await page.goto('/');
  await page.getByLabel('USUARIO / CORREO ELECTRÓNICO').fill('admin');
  await page.getByLabel('CONTRASEÑA').fill('admin123');
  await page.locator('[data-instance-id="login-submit-btn"]').click();

  await page.locator('[data-instance-id="users-menu-item"]').click();
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  await page.locator('[data-instance-id="admin-user-delete-admin-2"]').click();

  await expect(page.locator('[data-instance-id="admin-user-row-admin-2"]')).toHaveCount(0);
  expect(state.users.find((user) => user.id === 'admin-2')).toBeUndefined();

  await expect(page.locator('[data-instance-id="admin-user-row-admin-1"]')).toBeVisible();
  await expect(page.locator('[data-instance-id="admin-user-role-select-admin-1"]')).toBeDisabled();
  await expect(page.locator('[data-instance-id="admin-user-toggle-active-admin-1"]')).toBeDisabled();
  await expect(page.locator('[data-instance-id="admin-user-delete-admin-1"]')).toBeDisabled();
  await expect(page.locator('[data-instance-id="admin-user-row-admin-1"]')).toContainText('ÚLTIMO ADMIN');
});

test('Standard users do not see admin management', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      json: {
        token: 'viewer-token',
        username: 'viewer',
        role: 'STANDARD',
        isActive: true,
        expiresAt: '2026-07-01T23:59:59.000Z'
      }
    });
  });

  await page.goto('/');
  await page.getByLabel('USUARIO / CORREO ELECTRÓNICO').fill('viewer');
  await page.getByLabel('CONTRASEÑA').fill('viewer123');
  await page.locator('[data-instance-id="login-submit-btn"]').click();

  await expect(page.locator('[data-instance-id="users-menu-item"]')).toHaveCount(0);
});

test('ADMIN can control the import pipeline', async ({ page }) => {
  const state = await buildAdminMocks(page);

  await page.goto('/');
  await page.getByLabel('USUARIO / CORREO ELECTRÓNICO').fill('admin');
  await page.getByLabel('CONTRASEÑA').fill('admin123');
  await page.locator('[data-instance-id="login-submit-btn"]').click();

  await page.locator('[data-instance-id="pipeline-menu-item"]').click();
  await expect(page.locator('[data-instance-id="admin-import-panel"]')).toBeVisible();

  await page.locator('[data-instance-id="pipeline-group-trigger-ai"]').click();
  await expect.poll(() => {
    return ['description-worker', 'nsfw-worker', 'face-worker'].every((workerId) =>
      Boolean(state.workers.find((worker) => worker.id === workerId)?.lastTriggeredAt)
    );
  }).toBe(true);

  await page.locator('[data-instance-id="pipeline-start-all"]').click();
  await expect.poll(() => state.workers.every((worker) => worker.isRunning)).toBe(true);

  await page.locator('[data-instance-id="pipeline-stop-all"]').click();
  await expect.poll(() => state.workers.every((worker) => !worker.isRunning)).toBe(true);

  await page.getByRole('button', { name: 'Ver Lista' }).click();
  await expect(page.locator('[data-instance-id="import-worker-import-worker"]')).toBeVisible();

  await page.locator('[data-instance-id="import-worker-start-import-worker"]').click();
  await expect(page.locator('[data-instance-id="import-worker-import-worker"]')).toContainText('IDLE');
  expect(state.workers.find((worker) => worker.id === 'import-worker')?.isRunning).toBe(true);

  await page.locator('[data-instance-id="import-worker-trigger-index-worker"]').click();
  await expect(page.locator('[data-instance-id="import-worker-index-worker"]')).toBeVisible();
  expect(state.workers.find((worker) => worker.id === 'index-worker')?.lastTriggeredAt).toBeTruthy();
  await expect(page.locator('[data-instance-id="import-worker-pending-index-worker"]')).toContainText('Pendientes ahora:');

  const actionButtons = page.locator('[data-instance-id="import-worker-index-worker"] .import-worker-actions button');
  await expect(actionButtons).toHaveCount(3);
  const [startButton, triggerButton, resetButton] = await Promise.all([
    page.locator('[data-instance-id="import-worker-start-index-worker"]').boundingBox(),
    page.locator('[data-instance-id="import-worker-trigger-index-worker"]').boundingBox(),
    page.locator('[data-instance-id="import-worker-reset-index-worker"]').boundingBox()
  ]);
  expect(startButton).not.toBeNull();
  expect(triggerButton).not.toBeNull();
  expect(resetButton).not.toBeNull();
  if (!startButton || !triggerButton || !resetButton) {
    throw new Error('Worker action buttons are not visible');
  }
  expect(Math.abs(startButton.y - triggerButton.y)).toBeLessThan(2);
  expect(Math.abs(startButton.y - resetButton.y)).toBeLessThan(2);
});

test('Gallery cards do not render tags', async ({ page }) => {
  const assetWithTags: MediaAsset = {
    id: 'asset-1',
    title: 'Asset con tags',
    type: 'PHOTO',
    description: 'Descripción de prueba',
    tags: ['TAG_SHOULD_NOT_RENDER', 'OTRO_TAG'],
    date: '2026-07-01T00:00:00.000Z',
    imageUrl: '/api/media/originals/fake.jpg',
    clearance: 'LEVEL_1',
    metadata: {
      fileSize: '2 MB',
      resolution: '1920x1080'
    }
  };
  await buildAdminMocks(page, { assets: [assetWithTags] });

  await page.goto('/');
  await page.getByLabel('USUARIO / CORREO ELECTRÓNICO').fill('admin');
  await page.getByLabel('CONTRASEÑA').fill('admin123');
  await page.locator('[data-instance-id="login-submit-btn"]').click();

  const card = page.locator('[data-instance-id="asset-1-gallery-card"]');
  await expect(card).toBeVisible();
  await expect(card.locator('.card-tag-basic')).toHaveCount(0);
  await expect(card).not.toContainText('TAG_SHOULD_NOT_RENDER');
});
