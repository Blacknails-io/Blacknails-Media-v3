import { test, expect } from '@playwright/test';

test.describe('E2E: Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page correctly', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Welcome back');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.fill('input[type="text"]', 'invalid_user');
    await page.fill('input[type="password"]', 'wrong_pass');
    await page.click('button:has-text("Sign In")');

    // Suponiendo que el error aparece en un div o p (en Login.tsx, error message se renderiza)
    // El mensaje exacto depende del mock server, pero Login.tsx muestra error
    const errorMessage = page.getByTestId('login-error-message');
    await expect(errorMessage).toBeVisible();
  });

  test('should redirect to gallery on successful login', async ({ page }) => {
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button:has-text("Sign In")');

    await expect(page.locator('h1')).toContainText('Timeline', { timeout: 10000 });
  });
});
