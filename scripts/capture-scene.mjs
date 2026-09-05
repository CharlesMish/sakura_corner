import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';
import { applyLocalPlaywrightLibsIfNeeded } from './playwright-libs.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(projectRoot, 'screenshots');
if (process.platform !== 'win32') process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve(
  projectRoot,
  '.playwright-browsers',
);
applyLocalPlaywrightLibsIfNeeded(projectRoot);

const { chromium } = await import('playwright');
const server = await createServer({
  root: projectRoot,
  plugins: process.env.CAPTURE_BASELINE ? [{
    name: 'review-committed-baseline',
    enforce: 'pre',
    transform(code, id) {
      const relative = id.replaceAll('\\', '/').split('/src/')[1]?.split('?')[0];
      if (!relative) return;
      return execFileSync('git', ['-c', `safe.directory=${projectRoot.replaceAll('\\', '/')}`, 'show', `HEAD:src/${relative}`], { cwd: projectRoot, encoding: 'utf8' });
    },
  }] : [],
  logLevel: 'warn',
  server: { host: '127.0.0.1', port: 0 },
});

let browser;
try {
  await mkdir(outputDirectory, { recursive: true });
  await server.listen();
  const address = server.httpServer.address();
  const url = `http://127.0.0.1:${address.port}/`;
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'chrome' } : {}) });

  const allCaptures = [
    { name: 'luminous-rain-30s.png', width: 1920, height: 1080, wait: 30000 },
    { name: 'luminous-wet.png', width: 1920, height: 1080, search: '?weather=wet' },
    { name: 'luminous-dash.png', width: 1920, height: 1080, search: '?rain=dash' },
    { name: 'luminous-pixel.png', width: 1920, height: 1080, search: '?rain=pixel' },
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
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.error(`pageerror in ${capture.name}:`, error);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
        console.error(`console.error in ${capture.name}:`, message.text());
      }
    });
    await page.addInitScript(() => {
      let draws = 0;
      for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
        const original = WebGL2RenderingContext.prototype[name];
        WebGL2RenderingContext.prototype[name] = function (...args) { draws += 1; return original.apply(this, args); };
      }
      const frames = [];
      let previous = 0;
      function sample(time) {
        if (previous && time > 1000) frames.push({ ms: time - previous, draws });
        if (frames.length > 180) frames.shift();
        previous = time;
        draws = 0;
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
      window.captureMetrics = () => ({
        frameMs: frames.reduce((sum, frame) => sum + frame.ms, 0) / frames.length,
        drawCalls: frames.reduce((sum, frame) => sum + frame.draws, 0) / frames.filter(frame => frame.draws > 0).length,
        frames: frames.length,
      });
    });
    await page.goto(`${url}${capture.search ?? ''}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(capture.wait ?? 1800);
    await page.screenshot({
      path: resolve(outputDirectory, `${process.env.CAPTURE_PREFIX ?? ''}${capture.name}`),
      clip: capture.clip,
    });
    console.log(`${capture.name} metrics: ${JSON.stringify(await page.evaluate(() => window.captureMetrics()))}`);
    if (errors.length) throw new Error(errors.join('\n'));
    await page.close();
    console.log(`Captured screenshots/${capture.name}`);
  }
} finally {
  await browser?.close();
  await server.close();
}
