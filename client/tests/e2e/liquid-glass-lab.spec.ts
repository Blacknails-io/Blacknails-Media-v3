import { expect, test } from '@playwright/test';

test('LiquidGlass lab presets serialize distinct Clear, Dense, and Shape configs', async ({ page }) => {
  await page.goto('/?lab=liquidglass&specimen=login');

  const configBox = page.getByLabel('LiquidGlass config');
  const panel = page.locator('[data-instance-id="liquidglass-lab-panel"]');
  const panelContent = panel.locator(':scope > div').first();

  await expect(configBox).toBeVisible();
  await panel.evaluate((element) => element.setAttribute('data-preset-probe', 'stable'));

  const readConfig = async () => JSON.parse(await configBox.inputValue()) as Record<string, unknown>;

  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(panel).toHaveAttribute('data-preset-probe', 'stable');
  await expect(panel).toHaveCSS('border-radius', '65px');
  await expect(panelContent).toHaveCSS('border-radius', '65px');
  const clearConfig = await readConfig();

  await page.getByRole('button', { name: 'Dense' }).click();
  await expect(panel).toHaveAttribute('data-preset-probe', 'stable');
  await expect(panel).toHaveCSS('border-radius', '65px');
  await expect(panelContent).toHaveCSS('border-radius', '65px');
  const denseConfig = await readConfig();

  await page.getByRole('button', { name: 'Shape' }).click();
  await expect(panel).toHaveAttribute('data-preset-probe', 'stable');
  await expect(panel).toHaveCSS('border-radius', '18px');
  await expect(panelContent).toHaveCSS('border-radius', '18px');
  const shapeConfig = await readConfig();

  expect(clearConfig).toMatchObject({
    cornerRadius: 65,
    zRadius: 40,
    refraction: 0.18,
    edgeHighlight: 0.03,
    shadowOpacity: 0.14
  });
  expect(denseConfig).toMatchObject({
    blurAmount: 0.55,
    refraction: 1.08,
    edgeHighlight: 0.62,
    zRadius: 78,
    shadowOpacity: 0.72
  });
  expect(shapeConfig).toMatchObject({
    cornerRadius: 18,
    zRadius: 72,
    edgeHighlight: 0.34,
    bevelMode: 1
  });

  expect(Number(denseConfig.refraction)).toBeGreaterThan(Number(clearConfig.refraction) + 0.8);
  expect(Number(denseConfig.edgeHighlight)).toBeGreaterThan(Number(clearConfig.edgeHighlight) + 0.5);
  expect(Number(denseConfig.shadowOpacity)).toBeGreaterThan(Number(clearConfig.shadowOpacity) + 0.5);
  expect(denseConfig).not.toEqual(clearConfig);
  expect(shapeConfig).not.toEqual(clearConfig);
  expect(shapeConfig).not.toEqual(denseConfig);

  for (const config of [clearConfig, denseConfig, shapeConfig]) {
    expect(config).not.toHaveProperty('distortion');
    expect(config).not.toHaveProperty('opacity');
    expect(config).not.toHaveProperty('tintStrength');
    expect(config).not.toHaveProperty('shadowSpread');
    expect(config).not.toHaveProperty('shadowOffsetY');
  }
});

test('LiquidGlass lab keeps login variants simple and exposes lab-only calibration palette controls', async ({ page }) => {
  await page.goto('/?lab=liquidglass&specimen=login');

  await expect(page.getByText('Acceso seguro a Blacknails Media')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Default' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Error' })).toHaveCount(0);

  await page.getByLabel('Specimen').selectOption('calibration');

  const calibrationSpecimen = page.locator('[data-instance-id="liquidglass-calibration-specimen"]');

  await expect(calibrationSpecimen).toBeVisible();
  await expect(page.getByText('Lab-only token calibration')).toBeVisible();
  await expect(calibrationSpecimen.locator('code').filter({ hasText: '--text-primary' })).toBeVisible();
  await expect(calibrationSpecimen.locator('code').filter({ hasText: '--accent-ruby' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Palette' })).toBeVisible();
  await expect(page.getByLabel('LiquidGlass config')).toHaveCount(0);
  await expect(page.getByLabel('Palette tokens')).toBeVisible();
  await expect(page.getByLabel('Primary color')).toBeVisible();
  await expect(page.getByLabel('Error color')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Corpos' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Netrunners' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Underground' })).toBeVisible();
  await expect(page.getByLabel('Base palette')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tokens' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Error' })).toHaveCount(0);
});

test('LiquidGlass calibration palette controls update preview token colors', async ({ page }) => {
  await page.goto('/?lab=liquidglass');

  await expect(page.getByLabel('Specimen')).toHaveValue('calibration');
  await expect(page.locator('[data-instance-id="liquidglass-calibration-specimen"]')).toBeVisible();
  await expect(page.getByRole('option', { name: 'Glass' })).toHaveCount(0);
  await expect(page.getByRole('option', { name: 'Surface' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Netrunners' }).click();
  await expect(page.locator('[data-token="--text-primary"]').first()).toHaveCSS('color', 'rgb(0, 245, 255)');
  await expect(page.locator('[data-token="--accent-cyan"]').first()).toHaveCSS('color', 'rgb(0, 245, 255)');
  await expect(page.locator('[data-token="--text-secondary"]').first()).toHaveCSS('color', 'rgb(184, 255, 248)');
  await expect(page.locator('[data-token="--text-tertiary"]').first()).toHaveCSS('color', 'rgb(101, 214, 228)');
  await expect(page.locator('[data-token="--accent-ruby"]').first()).toHaveCSS('color', 'rgb(255, 79, 216)');
  await expect(page.getByLabel('Palette tokens')).toHaveValue(/"--surface-edge": "#35dfff"/);

  await page.getByRole('button', { name: 'Underground' }).click();
  await expect(page.locator('[data-token="--text-primary"]').first()).toHaveCSS('color', 'rgb(255, 79, 134)');
  await expect(page.locator('[data-token="--accent-cyan"]').first()).toHaveCSS('color', 'rgb(255, 79, 134)');
  await expect(page.locator('[data-token="--text-secondary"]').first()).toHaveCSS('color', 'rgb(255, 193, 212)');
  await expect(page.locator('[data-token="--text-tertiary"]').first()).toHaveCSS('color', 'rgb(216, 120, 153)');
  await expect(page.locator('[data-token="--accent-ruby"]').first()).toHaveCSS('color', 'rgb(255, 23, 77)');
  await expect(page.getByLabel('Palette tokens')).toHaveValue(/"--surface-edge": "#ff2d55"/);

  await page.getByRole('button', { name: 'Corpos' }).click();
  await expect(page.locator('[data-token="--text-primary"]').first()).toHaveCSS('color', 'rgb(245, 196, 81)');
  await expect(page.locator('[data-token="--accent-cyan"]').first()).toHaveCSS('color', 'rgb(245, 196, 81)');
  await expect(page.locator('[data-token="--text-secondary"]').first()).toHaveCSS('color', 'rgb(230, 210, 140)');
  await expect(page.locator('[data-token="--text-tertiary"]').first()).toHaveCSS('color', 'rgb(188, 160, 90)');
  await expect(page.locator('[data-token="--accent-ruby"]').first()).toHaveCSS('color', 'rgb(255, 92, 122)');
  await expect(page.getByLabel('Palette tokens')).toHaveValue(/"--surface-edge": "#dbe5f0"/);

  await page.getByLabel('Primary color').fill('#ffcc00');
  await page.getByLabel('Error color').fill('#00ff99');

  await expect(page.locator('[data-token="--text-primary"]').first()).toHaveCSS('color', 'rgb(255, 204, 0)');
  await expect(page.locator('[data-token="--accent-ruby"]').first()).toHaveCSS('color', 'rgb(0, 255, 153)');
  await expect(page.getByLabel('Palette tokens')).toHaveValue(/"--text-primary": "#FFCC00"/);
  await expect(page.getByLabel('Palette tokens')).toHaveValue(/"--accent-ruby": "#00FF99"/);
});

test('LiquidGlass lab aliases removed generic specimen links to calibration', async ({ page }) => {
  await page.goto('/?lab=liquidglass&specimen=glass');

  await expect(page.getByLabel('Specimen')).toHaveValue('calibration');
  await expect(page.locator('[data-instance-id="liquidglass-calibration-specimen"]')).toBeVisible();

  await page.goto('/?lab=liquidglass&specimen=surface');

  await expect(page.getByLabel('Specimen')).toHaveValue('calibration');
  await expect(page.locator('[data-instance-id="liquidglass-calibration-specimen"]')).toBeVisible();
});
