import { expect, test } from '@playwright/test';
import type { MediaAsset } from '../../src/types/MediaAsset.js';
import { buildAdminMocks, type PersonMock } from './support/adminMocks.js';

const previewSvg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22%3E%3Crect width=%22800%22 height=%22600%22 fill=%22%2327272a%22/%3E%3Ccircle cx=%22400%22 cy=%22300%22 r=%22160%22 fill=%22%236366f1%22/%3E%3C/svg%3E';

const people: PersonMock[] = [
  {
    id: 'person-ada',
    label: 'Persona 001',
    name: 'Ada',
    faceCount: 5,
    bbox: { x: 220, y: 130, width: 180, height: 180 },
    thumbnailUrl: previewSvg
  },
  {
    id: 'person-bruno',
    label: 'Persona 002',
    name: 'Bruno',
    faceCount: 2,
    bbox: { x: 240, y: 140, width: 160, height: 160 },
    thumbnailUrl: previewSvg
  },
  {
    id: 'person-unknown',
    label: 'Sin identificar',
    faceCount: 9,
    bbox: { x: 200, y: 120, width: 200, height: 200 },
    thumbnailUrl: previewSvg
  }
];

const adaAsset: MediaAsset = {
  id: 'asset-ada-1',
  title: 'Ada portrait',
  type: 'PHOTO',
  description: 'Retrato agrupado de Ada.',
  tags: ['face', 'ada'],
  date: '2026-07-02',
  imageUrl: previewSvg,
  originalUrl: previewSvg,
  clearance: 'LEVEL_1',
  metadata: {
    fileSize: '1.2 MB',
    resolution: '800x600'
  }
};

test('People panel filters, sorts and opens person media', async ({ page }) => {
  await buildAdminMocks(page, {
    people,
    personAssets: {
      'person-ada': [adaAsset]
    }
  });

  await page.goto('/');
  await page.getByLabel('USUARIO / CORREO ELECTRÓNICO').fill('admin');
  await page.locator('[data-instance-id="password-input"]').fill('admin123');
  await page.locator('[data-instance-id="login-submit-btn"]').click();

  await page.getByRole('button', { name: 'Personas' }).click();
  await expect(page.locator('[data-instance-id="admin-people-panel"]')).toBeVisible();
  await expect(page.locator('[data-instance-id="admin-people-panel"]')).toContainText('Personas');
  await expect(page.locator('[data-instance-id="admin-people-panel"]')).toContainText('3');
  await expect(page.locator('[data-instance-id="admin-people-panel"]')).toContainText('16');

  await page.locator('[data-instance-id="people-search-input"]').fill('ada');
  await expect(page.locator('[data-instance-id="person-card-person-ada"]')).toBeVisible();
  await expect(page.locator('[data-instance-id="person-card-person-bruno"]')).toHaveCount(0);

  await page.locator('[data-instance-id="people-search-input"]').fill('');
  await page.locator('[data-instance-id="people-sort-select"]').selectOption('NAME_ASC');
  await expect(page.locator('[data-instance-id="person-card-person-ada"]')).toBeVisible();

  await page.getByRole('button', { name: 'Abrir Ada' }).click();
  await expect(page.locator('[data-instance-id="admin-person-gallery"]')).toBeVisible();
  await expect(page.locator('[data-instance-id="admin-person-gallery"]')).toContainText('1 elemento encontrado');
  await expect(page.locator('[data-instance-id="admin-person-gallery"]')).toContainText('5 detecciones');
  await expect(page.getByText('Ada portrait')).toBeVisible();
});
