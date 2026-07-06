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
  await page.route('**/api/assets', async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route('**/api/events/stream**', async (route) => {
    await route.abort();
  });

  await page.goto('/');
  await page.getByLabel('USUARIO / CORREO ELECTRÓNICO').fill('viewer');
  await page.locator('[data-instance-id="password-input"]').fill('viewer123');
  await page.locator('[data-instance-id="login-submit-btn"]').click();

  await expect(page.locator('[data-instance-id="users-menu-item"]')).toHaveCount(0);
});

test("Event Logs keep wheel scrolling inside the event panel", async ({ page }) => {
  await buildAdminMocks(page);

  const events = Array.from({ length: 140 }, (_, index) => ({
    id: `event-${index}`,
    type: "PROCESS",
    processName: "IMPORT",
    action: "STARTED",
    message: `Console scroll probe ${index}`,
    occurredAt: new Date(Date.UTC(2026, 6, 1, 12, 0, index)).toISOString()
  }));
  let streamAttempt = 0;

  await page.route("**/api/events/stream**", async (route) => {
    const attempt = streamAttempt++;
    const streamBody = events.map((event) => "data: " + JSON.stringify({ ...event, id: event.id + "-" + attempt }) + "\n\n").join("");
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache"
      },
      body: streamBody
    });
  });

  await page.goto("/");
  await page.getByLabel("USUARIO / CORREO ELECTRÓNICO").fill("admin");
  await page.locator("[data-instance-id=\"password-input\"]").fill("admin123");
  await page.locator("[data-instance-id=\"login-submit-btn\"]").click();
  await page.locator("[data-instance-id=\"console-menu-item\"]").click();

  const panel = page.locator("[data-instance-id=\"event-log-panel\"]");
  await expect(panel).toBeVisible();
  await expect.poll(async () => panel.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);

  const parentBefore = await panel.evaluate((element) => element.parentElement?.scrollTop ?? 0);
  const panelBefore = await panel.evaluate((element) => element.scrollTop);
  const box = await panel.boundingBox();
  if (!box) {
    throw new Error("Event log panel has no viewport box");
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 700);

  await expect.poll(async () => panel.evaluate((element) => element.scrollTop)).toBeGreaterThan(panelBefore);
  await expect.poll(async () => panel.evaluate((element) => element.parentElement?.scrollTop ?? 0)).toBe(parentBefore);
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

  await page.locator('[data-instance-id="pipeline-view-toggle"]').click();
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


test("Login uses production LiquidGlass surface with visible form", async ({ page }) => {
  await page.goto("/");

  const viewport = page.locator('[data-instance-id="login-viewport"]');
  await expect(viewport).toBeVisible();

  const card = page.locator('[data-instance-id="login-panel"]');
  await expect(card).toBeVisible();
  await expect(card.getByText("INICIAR SESIÓN")).toBeVisible();
  await expect(card.getByText("Glass", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("USUARIO / CORREO ELECTRÓNICO")).toBeVisible();
  await expect(page.locator('[data-instance-id="password-input"]')).toBeVisible();
  await expect(page.locator('[data-instance-id="login-submit-btn"]')).toBeVisible();

  const panelRect = await card.evaluate((element) => element.getBoundingClientRect());
  
  expect(panelRect.width).toBeGreaterThan(360);
  expect(panelRect.width).toBeLessThanOrEqual(430);
  expect(panelRect.height).toBeGreaterThan(400);
});

test("Login viewport stays centered without scrollbars", async ({ page }) => {
  const viewports = [
    { width: 1440, height: 920 },
    { width: 390, height: 640 },
    { width: 390, height: 520 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator("[data-instance-id=\"login-panel\"]")).toBeVisible();

    const metrics = await page.locator("[data-instance-id=\"login-panel\"]").evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const wrapper = document.querySelector("[data-instance-id=\"login-viewport\"]") as HTMLElement;
      return {
        bodyScrollWidth: document.documentElement.scrollWidth,
        bodyScrollHeight: document.documentElement.scrollHeight,
        wrapperClientHeight: wrapper.clientHeight,
        wrapperScrollHeight: wrapper.scrollHeight,
        wrapperOverflowY: getComputedStyle(wrapper).overflowY,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        centerDeltaX: Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2),
        centerDeltaY: Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2),
        top: rect.top,
        bottom: window.innerHeight - rect.bottom
      };
    });

    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.bodyScrollHeight).toBeLessThanOrEqual(metrics.viewportHeight + 1);
    expect(metrics.wrapperOverflowY).toBe("hidden");
    expect(metrics.centerDeltaX).toBeLessThanOrEqual(2);
    expect(metrics.centerDeltaY).toBeLessThanOrEqual(18);
    expect(metrics.top).toBeGreaterThanOrEqual(0);
    expect(metrics.bottom).toBeGreaterThanOrEqual(0);
  }
});
