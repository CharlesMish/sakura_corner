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

  const allCaptures = [
    { name: 'scene-desktop.png', width: 1920, height: 1080 },
    { name: 'scene-laptop.png', width: 1366, height: 768 },
    { name: 'scene-ultrawide.png', width: 2560, height: 1080 },
    { name: 'scene-annotation-aspect.png', width: 2227, height: 1377 },
    {
      name: 'scene-tree-detail.png',
      width: 1920,
      height: 1080,
      clip: { x: 500, y: 40, width: 650, height: 520 },
    },
    { name: 'scene-portrait.png', width: 390, height: 844 },
    { name: 'hierarchy-rain-later.png', width: 1920, height: 1080, wait: 3600 },
    { name: 'hierarchy-rain-10s.png', width: 1920, height: 1080, wait: 10000 },
    {
      name: 'hierarchy-clear-desktop.png',
      width: 1920,
      height: 1080,
      search: '?weather=clear',
    },
    { name: 'rain-contact-desktop.png', width: 1920, height: 1080 },
    { name: 'rain-contact-laptop.png', width: 1366, height: 768 },
    { name: 'rain-contact-ultrawide.png', width: 2560, height: 1080 },
    { name: 'rain-contact-portrait.png', width: 390, height: 844 },
    {
      name: 'rain-contact-clear-desktop.png',
      width: 1920,
      height: 1080,
      search: '?weather=clear',
    },
    {
      name: 'rain-contact-detail.png',
      width: 1920,
      height: 1080,
      clip: { x: 1050, y: 620, width: 780, height: 450 },
    },
  ];
  const captureFilter = process.env.CAPTURE_ONLY;
  const captures = captureFilter
    ? allCaptures.filter((capture) => capture.name.includes(captureFilter))
    : allCaptures;

  for (const capture of captures) {
    const page = await browser.newPage({
      viewport: { width: capture.width, height: capture.height },
      deviceScaleFactor: 1,
    });
    page.on('pageerror', (error) => {
      console.error(`pageerror in ${capture.name}:`, error);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        console.error(`console.error in ${capture.name}:`, message.text());
      }
    });
    await page.goto(`${url}${capture.search ?? ''}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(capture.wait ?? 1800);
    await page.screenshot({
      path: resolve(outputDirectory, capture.name),
      clip: capture.clip,
    });
    await page.close();
    console.log(`Captured screenshots/${capture.name}`);
  }
} finally {
  await browser?.close();
  await server.close();
}
