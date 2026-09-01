import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { applyLocalPlaywrightLibsIfNeeded } from './playwright-libs.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(projectRoot, 'screenshots');
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve(
  projectRoot,
  '.playwright-browsers',
);
applyLocalPlaywrightLibsIfNeeded(projectRoot);

const { chromium } = await import('playwright');
const server = await createServer({
  root: projectRoot,
  logLevel: 'warn',
  server: { host: '127.0.0.1', port: 0 },
});

let browser;
try {
  await mkdir(outputDirectory, { recursive: true });
  await server.listen();
  const address = server.httpServer.address();
  const url = `http://127.0.0.1:${address.port}/`;
  browser = await chromium.launch({ headless: true });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', (error) => console.error('PAGE ERROR', error));
  page.on('console', (message) => {
    if (message.type() === 'error') console.error('CONSOLE ERROR', message.text());
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);

  const frameCount = 8;
  const stepMs = 2000;
  for (let index = 0; index < frameCount; index += 1) {
    if (index > 0) await page.waitForTimeout(stepMs);
    const label = `t${index}`;
    await page.screenshot({
      path: resolve(outputDirectory, `sway-full-${label}.png`),
    });
    await page.screenshot({
      path: resolve(outputDirectory, `sway-crop-${label}.png`),
      clip: { x: 500, y: 40, width: 650, height: 520 },
    });
    console.log(`Captured sway-full-${label}.png / sway-crop-${label}.png`);
  }

  await page.close();
} finally {
  await browser?.close();
  await server.close();
}
