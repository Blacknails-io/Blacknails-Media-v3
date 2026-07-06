import { expect, test } from '@playwright/test';

test.describe('Visual Lab', () => {
  test('loads Calibration specimen by default and renders accordions', async ({ page }) => {
    await page.goto('/?lab=true');

    // Verify Calibration specimen is selected
    const specimenSelect = page.locator('select').nth(1); // The second select is the specimen selector
    await expect(specimenSelect).toHaveValue('calibration');

    // Verify Calibration token preview is visible
    const calibrationSpecimen = page.locator('[data-instance-id="visual-lab-calibration"]');
    await expect(calibrationSpecimen).toBeVisible();
    await expect(page.getByText('Lab-only token calibration')).toBeVisible();

    // Verify Control Panel renders typography and material states accordions
    await expect(page.getByText('Typography', { exact: true })).toBeVisible();
    await expect(page.getByText('Material States', { exact: true })).toBeVisible();
  });

  test('modifying a color updates CSS and shows reset button', async ({ page }) => {
    await page.goto('/?lab=true');

    // Wait for the text primary color input to be ready
    const textPrimaryRow = page.locator('label').filter({ hasText: '--text-primary' });
    const colorInput = textPrimaryRow.locator('input[type="color"]');
    
    // Change the color to red
    await colorInput.fill('#ff0000');
    
    // Verify the preview reflects the change (the code block for the token)
    // In CalibrationSpecimen, the token values are rendered in their own color
    const tokenPreview = page.locator('[data-token="--text-primary"]').first();
    await expect(tokenPreview).toHaveCSS('color', 'rgb(255, 0, 0)');

    // Verify the reset button appeared
    const resetButton = textPrimaryRow.locator('button[title="Reset to Palette Default"]');
    await expect(resetButton).toBeVisible();

    // Click reset
    await resetButton.click();

    // Verify reset button is hidden and color goes back to something other than red
    await expect(resetButton).toBeHidden();
    await expect(tokenPreview).not.toHaveCSS('color', 'rgb(255, 0, 0)');
  });

  test('Theming Engine intercepts Deploy for Global (Calibration)', async ({ page }) => {
    await page.goto('/?lab=true');

    await page.route('/__theme_sync', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    // Modify a color
    const textPrimaryRow = page.locator('label').filter({ hasText: '--text-primary' });
    await textPrimaryRow.locator('input[type="color"]').fill('#00ff00');

    // Click Deploy Theme and wait for the request AND the dialog
    const requestPromise = page.waitForRequest('/__theme_sync');
    const dialogPromise = page.waitForEvent('dialog');
    await page.getByRole('button', { name: 'DEPLOY THEME' }).click();
    
    const request = await requestPromise;
    const dialog = await dialogPromise;
    await dialog.accept();

    const payload = JSON.parse(request.postData() || '{}');
    expect(payload.component).toBe('global');
    expect(payload.overrides['--text-primary']).toBe('#00ff00');
  });

  test('Theming Engine intercepts Deploy for Login Component', async ({ page }) => {
    await page.goto('/?lab=true');

    // Switch to Login Specimen
    const specimenSelect = page.locator('select').nth(1);
    await specimenSelect.selectOption('login');

    await page.route('/__theme_sync', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } });
    });

    // Modify a color
    const errorColorRow = page.locator('label').filter({ hasText: '--accent-ruby' });
    await errorColorRow.locator('input[type="color"]').fill('#ff00ff');

    // Click Deploy Theme and wait for request AND dialog
    const requestPromise = page.waitForRequest('/__theme_sync');
    const dialogPromise = page.waitForEvent('dialog');
    await page.getByRole('button', { name: 'DEPLOY THEME' }).click();
    
    const request = await requestPromise;
    const dialog = await dialogPromise;
    await dialog.accept();

    const payload = JSON.parse(request.postData() || '{}');
    expect(payload.component).toBe('login');
    expect(payload.overrides['--accent-ruby']).toBe('#ff00ff');
  });
});
