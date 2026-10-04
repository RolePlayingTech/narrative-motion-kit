import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { preview } from 'vite';
import { chromium } from 'playwright';
import { repositoryRoot } from './project';

const server = await preview({
  root: repositoryRoot,
  preview: { host: '127.0.0.1', port: 0, strictPort: false },
});
const address = server.httpServer.address();
if (!address || typeof address === 'string') throw new Error('No production preview port');
const origin = `http://127.0.0.1:${address.port}`,
  browser = await chromium.launch({ headless: true });
const errors: string[] = [];
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`);
  });
  await page.goto(`${origin}/?project=demo-fuel-prices`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.motion?.ready);
  await page.locator('.scene-item[data-id="hormuz"]').click();
  await page.waitForFunction(() =>
    document.querySelector('#current-scene')?.textContent?.startsWith('HORMUZ'),
  );
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.querySelector('#time')?.textContent?.includes('12.63'));
  await page.locator('#safe').click();
  assert.ok(await page.locator('#stage').evaluate((el) => el.classList.contains('show-safe')));
  await page.locator('#safe').click();
  // Seek overlapping requests intentionally; the API must serialize its async layer lifecycle.
  await page.evaluate(async () => {
    await Promise.all([window.motion.renderAt(4.2), window.motion.renderAt(14.8)]);
  });
  assert.match((await page.locator('#current-scene').textContent()) ?? '', /^HORMUZ/);
  const output = join(repositoryRoot, 'projects/demo-fuel-prices/renders/preview');
  await mkdir(output, { recursive: true });
  await page.screenshot({ path: join(output, 'studio.png') });
  await page.setViewportSize({ width: 640, height: 900 });
  await page.screenshot({ path: join(output, 'studio-mobile.png') });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, 'report.json'),
    JSON.stringify(
      {
        passed: true,
        productionBuild: true,
        projectAssetLoading: true,
        controls: true,
        concurrentSeeks: true,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'PASS: production build, cached assets, scene selection, keyboard stepping, safe overlay, concurrent seeks.',
  );
} finally {
  await browser.close();
  await new Promise<void>((resolve, reject) =>
    server.httpServer.close((error) => (error ? reject(error) : resolve())),
  );
}
