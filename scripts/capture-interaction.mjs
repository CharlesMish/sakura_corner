import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { applyLocalPlaywrightLibsIfNeeded } from './playwright-libs.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(projectRoot, 'screenshots');
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve(projectRoot, '.playwright-browsers');
applyLocalPlaywrightLibsIfNeeded(projectRoot);

const { chromium } = await import('playwright');
const server = await createServer({
  root: projectRoot,
  logLevel: 'warn',
  server: { host: '127.0.0.1', port: 0 },
});
const errors = [];

function watchErrors(page, label) {
  page.on('pageerror', (error) => {
    errors.push(`${label}: ${error}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${label}: ${message.text()}`);
  });
}

async function shot(page, name) {
  await page.screenshot({ path: resolve(outputDirectory, name) });
  console.log(`Captured screenshots/${name}`);
}

let browser;
try {
  await mkdir(outputDirectory, { recursive: true });
  await server.listen();
  const address = server.httpServer.address();
  const url = `http://127.0.0.1:${address.port}/`;
  browser = await chromium.launch({ headless: true });

  const desktop = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  watchErrors(desktop, 'desktop');
  await desktop.goto(url, { waitUntil: 'networkidle' });
  await desktop.waitForTimeout(1800);
  await shot(desktop, 'production-interaction-desktop-before.png');
  await desktop.mouse.click(823, 202);
  await desktop.waitForTimeout(100);
  await shot(desktop, 'production-interaction-desktop-release.png');
  await desktop.waitForTimeout(500);
  await shot(desktop, 'production-interaction-desktop-peel.png');
  await desktop.waitForTimeout(1000);
  await shot(desktop, 'production-interaction-desktop-midflight.png');
  await desktop.waitForTimeout(21000);
  await shot(desktop, 'production-interaction-desktop-settled.png');
  await desktop.close();

  const repeat = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  watchErrors(repeat, 'repeat');
  await repeat.goto(url, { waitUntil: 'networkidle' });
  await repeat.waitForTimeout(1800);
  for (let index = 0; index < 10; index += 1) {
    await repeat.mouse.click(940, 310);
    await repeat.waitForTimeout(80);
  }
  await repeat.waitForTimeout(500);
  await shot(repeat, 'production-interaction-desktop-repeat.png');
  await repeat.close();

  const portrait = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  watchErrors(portrait, 'portrait');
  await portrait.goto(url, { waitUntil: 'networkidle' });
  await portrait.waitForTimeout(1800);
  await shot(portrait, 'production-interaction-portrait-before.png');
  await portrait.touchscreen.tap(165, 278);
  await portrait.waitForTimeout(120);
  await shot(portrait, 'production-interaction-portrait-release.png');
  await portrait.waitForTimeout(650);
  await shot(portrait, 'production-interaction-portrait-peel.png');
  await portrait.close();

  if (errors.length > 0) throw new Error(errors.join('\n'));
} finally {
  await browser?.close();
  await server.close();
}
