import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { execSync } from 'child_process';
import * as path from 'path';

test.describe('E2E: Gallery Pipeline', () => {
  test('should process an imported file and display it in the gallery', async ({ page }) => {
    const projectRoot = path.resolve(process.cwd(), '../');
    const importDir = path.join(projectRoot, '.mock-library/library/import');
    
    if (!fs.existsSync(importDir)) {
      fs.mkdirSync(importDir, { recursive: true });
    }
    
    // Generar archivo real con ffmpeg para inyectarlo en import
    const targetPath = path.join(importDir, 'playwright_test_photo.jpg');
    execSync(`ffmpeg -v error -y -f lavfi -i color=c=red:s=16x16:d=1 -frames:v 1 "${targetPath}"`);

    // 2. Navegar a la aplicación
    await page.goto('/');

    // 3. Login
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button:has-text("Sign In")');

    // 4. Verificar que entramos a la galería
    await expect(page.locator('h1')).toContainText('Timeline');

    // 5. El frontend debería refrescar o podemos forzar un click al filtro de fotos
    // En este test validamos que aparezca la imagen en pantalla.
    // El pipeline puede tardar unos segundos en procesarlo y el frontend en recargar.
    
    // Buscamos que aparezca al menos una tarjeta en la galería
    const photoCard = page.locator('.prosumer-card-wrapper').first();
    
    // Esperamos hasta 30 segundos a que los workers del mock server lo procesen y el cliente lo reciba
    await expect(photoCard).toBeVisible({ timeout: 30000 });

    // 6. Probamos la UX que pidió el usuario: filtro de búsqueda
    const searchInput = page.getByPlaceholder('Buscar por título, tags...');
    await searchInput.fill('playwright');
    
    // Asegurar que la "X" aparece a la derecha y funciona
    const clearButton = page.locator('svg.lucide-x').first();
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    
    // El input debe quedar vacío
    await expect(searchInput).toHaveValue('');
  });
});
