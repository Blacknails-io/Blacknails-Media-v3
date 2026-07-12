import { test, expect } from '@playwright/test';

test.describe('E2E: People Directory', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button:has-text("Sign In")');

    // Navegar a People
    const peopleLink = page.locator('a', { hasText: 'People' });
    await peopleLink.click();
  });

  test('should load people directory and show title', async ({ page }) => {
    // Verificamos que cargue la vista de personas
    const title = page.locator('h1', { hasText: 'Directorio de Personas' });
    await expect(title).toBeVisible({ timeout: 10000 });
  });
});
