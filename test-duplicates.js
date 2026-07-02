const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.setItem('bn_session_token', 'admin_mock_token');
  });
  await page.reload();
  await page.waitForTimeout(3000);
  const cards = await page.$$('.prosumer-card-wrapper');
  console.log('Cards count:', cards.length);
  await browser.close();
})();
