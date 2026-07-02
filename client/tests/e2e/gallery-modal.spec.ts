import { expect, test } from '@playwright/test';
import type { MediaAsset } from '../../src/types/MediaAsset.js';
import { buildAdminMocks } from './support/adminMocks.js';

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
  await page.locator('[data-instance-id="password-input"]').fill('admin123');
  await page.locator('[data-instance-id="login-submit-btn"]').click();

  const card = page.locator('[data-instance-id="asset-1-gallery-card"]');
  await expect(card).toBeVisible();
  await expect(card.locator('.card-tag-basic')).toHaveCount(0);
  await expect(card).not.toContainText('TAG_SHOULD_NOT_RENDER');
});


test('Gallery uses the full content width without the fixed inspector panel', async ({ page }) => {
  const previewSvg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22%3E%3Crect width=%22800%22 height=%22600%22 fill=%22%2327272a%22/%3E%3Ccircle cx=%22400%22 cy=%22300%22 r=%22160%22 fill=%22%2300f3ff%22/%3E%3C/svg%3E';
  const assets: MediaAsset[] = Array.from({ length: 6 }, (_, index) => ({
    id: `density-asset-${index + 1}`,
    title: `Density Asset ${index + 1}`,
    type: index % 2 === 0 ? 'PHOTO' : 'VIDEO',
    description: 'Descripción IA de prueba para densidad de galería.',
    tags: ['density'],
    date: '2026-07-02',
    imageUrl: previewSvg,
    originalUrl: previewSvg,
    videoPreviewUrl: index % 2 === 0 ? undefined : previewSvg,
    clearance: 'LEVEL_1',
    metadata: {
      fileSize: '2 MB',
      resolution: '800x600'
    }
  }));

  await page.setViewportSize({ width: 1280, height: 800 });
  await buildAdminMocks(page, { assets });

  await page.goto('/');
  await page.getByLabel('USUARIO / CORREO ELECTRÓNICO').fill('admin');
  await page.locator('[data-instance-id="password-input"]').fill('admin123');
  await page.locator('[data-instance-id="login-submit-btn"]').click();

  await expect(page.locator('.app-inspector-panel')).toHaveCount(0);

  const firstRowCards = await Promise.all(
    assets.slice(0, 4).map(async (asset) => {
      const box = await page.locator(`[data-instance-id="${asset.id}-gallery-card"]`).boundingBox();
      if (!box) throw new Error(`Missing gallery card box for ${asset.id}`);
      return box;
    })
  );
  const firstY = firstRowCards[0].y;
  expect(firstRowCards.every((box) => Math.abs(box.y - firstY) < 4)).toBe(true);
});


test('Gallery modal supports asset review navigation and selection', async ({ page }) => {
  const previewSvg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22%3E%3Crect width=%22800%22 height=%22600%22 fill=%22%2327272a%22/%3E%3Ccircle cx=%22400%22 cy=%22300%22 r=%22160%22 fill=%22%236366f1%22/%3E%3C/svg%3E';
  const assets: MediaAsset[] = [
    {
      id: 'asset-review-photo',
      title: 'Review Photo',
      type: 'PHOTO',
      description: 'Descripción IA para revisar fotografía.',
      tags: ['portrait', 'studio'],
      date: '2026-07-02',
      imageUrl: previewSvg,
      originalUrl: previewSvg,
      clearance: 'LEVEL_1',
      metadata: {
        fileSize: '2.4 MB',
        resolution: '800x600',
        gpsCoords: '40.4168,-3.7038',
        encryption: 'AES-256'
      }
    },
    {
      id: 'asset-review-video',
      title: 'Review Video',
      type: 'VIDEO',
      description: 'Descripción IA para revisar vídeo.',
      tags: ['clip', 'motion'],
      date: '2026-07-02',
      imageUrl: previewSvg,
      videoPreviewUrl: previewSvg,
      originalUrl: previewSvg,
      clearance: 'LEVEL_2',
      metadata: {
        fileSize: '18 MB',
        resolution: '1920x1080',
        duration: '00:12'
      }
    }
  ];

  await buildAdminMocks(page, { assets });
  let reprocessPayload: unknown = null;
  await page.route('**/api/admin/assets/reprocess', async (route) => {
    reprocessPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 202,
      json: { requested: 1, accepted: 1, missing: [], jobs: ['description', 'nsfw'] }
    });
  });

  await page.goto('/');
  await page.getByLabel('USUARIO / CORREO ELECTRÓNICO').fill('admin');
  await page.locator('[data-instance-id="password-input"]').fill('admin123');
  await page.locator('[data-instance-id="login-submit-btn"]').click();

  await page.locator('[data-instance-id="asset-review-photo-gallery-card"]').click();
  const dialog = page.getByRole('dialog', { name: 'Review Photo' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('1 de 2');
  await expect(dialog).toContainText('800x600');

  await page.getByLabel('Asset siguiente').click();
  await expect(page.getByRole('dialog', { name: 'Review Video' })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('2 de 2');
  await expect(page.getByRole('dialog')).toContainText('00:12');
  await expect(page.getByRole('dialog')).toContainText('LEVEL_2');

  await page.getByRole('button', { name: 'Seleccionar' }).click();
  await expect(page.getByRole('button', { name: 'Seleccionado' })).toBeVisible();

  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('dialog', { name: 'Review Photo' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const bulkToolbar = page.locator('[data-instance-id="bulk-selection-toolbar"]');
  await expect(bulkToolbar).toBeVisible();
  await expect(bulkToolbar).toContainText('1 seleccionado');
  await expect(bulkToolbar).toContainText('Review Video');

  await page.locator('[data-instance-id="bulk-open-reprocess"]').click();
  await expect(page.getByRole('dialog', { name: 'Reanalizar IA' })).toBeVisible();
  await page.locator('[data-instance-id="bulk-submit-reprocess"]').click();
  await expect(bulkToolbar).toContainText('1 reencolados');
  expect(reprocessPayload).toEqual({
    assetIds: ['asset-review-video'],
    jobs: ['description', 'nsfw']
  });

  await page.locator('[data-instance-id="bulk-clear-selection"]').click();
  await expect(bulkToolbar).toHaveCount(0);
});
