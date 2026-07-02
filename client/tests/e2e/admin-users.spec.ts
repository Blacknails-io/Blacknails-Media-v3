import { expect, test } from '@playwright/test';
import { buildAdminMocks } from './support/adminMocks.js';

test('ADMIN can manage users from the sidebar', async ({ page }) => {
  const state = await buildAdminMocks(page);

  await page.goto('/');
  await page.getByLabel('USUARIO / CORREO ELECTRÓNICO').fill('admin');
  await page.locator('[data-instance-id="password-input"]').fill('admin123');
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
  await page.locator('[data-instance-id="password-input"]').fill('admin123');
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
  await page.locator('[data-instance-id="password-input"]').fill('viewer123');
  await page.locator('[data-instance-id="login-submit-btn"]').click();

  await expect(page.locator('[data-instance-id="users-menu-item"]')).toHaveCount(0);
});

test('ADMIN can control the import pipeline', async ({ page }) => {
  const state = await buildAdminMocks(page);

  await page.goto('/');
  await page.getByLabel('USUARIO / CORREO ELECTRÓNICO').fill('admin');
  await page.locator('[data-instance-id="password-input"]').fill('admin123');
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
