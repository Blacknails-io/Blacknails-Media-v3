import { test, expect } from '@playwright/test';

test.describe('E2E: Pipeline Control Center', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button:has-text("Sign In")');

    // Navegar a Pipeline
    const pipelineLink = page.locator('a', { hasText: 'Pipeline Canvas' });
    await pipelineLink.click();
  });

  test('should load pipeline canvas and show workers', async ({ page }) => {
    const canvas = page.getByTestId('pipeline-canvas');
    await expect(canvas).toBeVisible();

    // Esperamos a que los nodos carguen
    // Ya que los nodos tienen un id dinámico que mapea a testid `pipeline-node-${worker.id}`
    const importNode = page.getByTestId('pipeline-node-import-worker');
    await expect(importNode).toBeVisible({ timeout: 10000 });
    
    // Verificamos la visualización isométrica y estado
    await expect(importNode.getByText('Import Files')).toBeVisible();
    await expect(importNode.getByText('STATUS')).toBeVisible();
  });
});
