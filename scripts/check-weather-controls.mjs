import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { applyLocalPlaywrightLibsIfNeeded } from './playwright-libs.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(projectRoot, 'screenshots/nocturne-weather');
if (process.platform !== 'win32') process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve(projectRoot, '.playwright-browsers');
applyLocalPlaywrightLibsIfNeeded(projectRoot);
const { chromium } = await import('playwright');

// Introspection exists only in this review server, never in a production bundle.
const server = await createServer({
  root: projectRoot,
  logLevel: 'warn',
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{
    name: 'weather-controls-review',
    transform(code, id) {
      if (!id.replaceAll('\\', '/').split('?')[0].endsWith('/src/main.js')) return;
      return `${code}\n
        window.__weatherReview = {
          scene, tree, petalSystem, snowfall, firefly, renderer, camera, interaction,
          releases: 0,
          readiness: () => ({ assetsReady, sceneRevealed, frames: renderer.info.render.frame }),
        };
        const reviewRelease = petalSystem.releaseInteractive;
        petalSystem.releaseInteractive = (...args) => {
          window.__weatherReview.releases += 1;
          return reviewRelease(...args);
        };
      `;
    },
  }],
});

const errors = [];
const checks = [];
function passed(description) {
  checks.push(description);
  console.log(`PASS ${description}`);
}
function watch(page, label) {
  page.on('pageerror', (error) => errors.push(`${label}: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${label}: ${message.text()}`);
  });
}
async function ready(page) {
  await page.waitForFunction(() => document.documentElement.dataset.sceneReady === 'true'
    && window.__weatherReview?.readiness().sceneRevealed);
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#scene-transition')).opacity === '0');
  assert.ok(await page.evaluate(() => window.__weatherReview.readiness().frames > 0), 'Reveal must follow a rendered frame');
}
async function open(page, touch = false) {
  const toggle = page.getByRole('button', { name: 'Change weather' });
  if (await toggle.getAttribute('aria-expanded') === 'true') return;
  if (touch) await toggle.tap();
  else await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(await page.getByRole('dialog', { name: 'Weather' }).isVisible(), true);
}
async function canopyPoint(page) {
  return page.evaluate(() => {
    const rect = document.querySelector('canvas').getBoundingClientRect();
    for (const x of [0.43, 0.37, 0.49, 0.55, 0.3, 0.6]) {
      for (const y of [0.22, 0.3, 0.36, 0.4, 0.15, 0.5]) {
        const point = { x: rect.left + x * rect.width, y: rect.top + y * rect.height };
        if (window.__weatherReview.interaction.pickFromClient(point.x, point.y)) return point;
      }
    }
    throw new Error('No touchable canopy point found');
  });
}
async function workingTree(page) {
  const point = await canopyPoint(page);
  const before = await page.evaluate(() => window.__weatherReview.releases);
  await page.mouse.click(point.x, point.y);
  assert.equal(await page.evaluate(() => window.__weatherReview.releases), before + 1);
}
async function choose(page, label, value) {
  await open(page);
  await Promise.all([
    page.waitForURL((url) => url.searchParams.get('weather') === value),
    page.getByRole('button', { name: label, exact: true }).click(),
  ]);
  await ready(page);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.weather), value);
}

let browser;
let releaseTexture;
try {
  await mkdir(outputDirectory, { recursive: true });
  await server.listen();
  const url = `http://127.0.0.1:${server.httpServer.address().port}/`;
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'chrome' } : {}) });
  const desktop = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  watch(desktop, 'desktop');

  // Keep one actual image pending while the first scene frame renders.
  const textureGate = new Promise((resolveGate) => { releaseTexture = resolveGate; });
  let heldTexture = false;
  await desktop.route('**/shop-lettering.png*', async (route) => {
    if (route.request().resourceType() !== 'image') return route.continue();
    heldTexture = true;
    await textureGate;
    await route.continue();
  });
  await desktop.goto(`${url}?weather=unknown&rain=pixel&review=keep#quiet`, { waitUntil: 'domcontentloaded' });
  await desktop.waitForFunction(() => window.__weatherReview?.readiness().frames > 0);
  assert.equal(heldTexture, true, 'An actual bundled image must be held for the loading test');
  assert.equal(await desktop.evaluate(() => document.documentElement.dataset.sceneReady), undefined);
  assert.equal(await desktop.locator('#scene-transition').evaluate((element) => getComputedStyle(element).opacity), '1');
  assert.equal(await desktop.evaluate(() => window.__weatherReview.readiness().assetsReady), false);
  releaseTexture();
  await ready(desktop);
  await desktop.unroute('**/shop-lettering.png*');
  passed('Loading curtain stays opaque until textures and the first rendered frame are ready');

  assert.equal(await desktop.evaluate(() => document.documentElement.dataset.weather), 'rain');
  assert.equal(await desktop.getByRole('checkbox', { name: 'Firefly' }).count(), 0);
  passed('Unknown weather falls back to Rain and excludes the firefly control');

  const toggle = desktop.getByRole('button', { name: 'Change weather' });
  const target = await toggle.boundingBox();
  assert.equal(target.width, 44);
  assert.equal(target.height, 44);
  assert.deepEqual(await desktop.locator('.weather-dot').evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return [bounds.width, bounds.height];
  }), [7, 7]);
  await toggle.focus();
  await desktop.keyboard.press('Enter');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(await desktop.evaluate(() => document.activeElement.textContent), 'Rain');
  assert.equal(await desktop.getByRole('button', { name: 'Rain', exact: true }).getAttribute('aria-pressed'), 'true');
  await desktop.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await toggle.evaluate((element) => element === document.activeElement), true);
  await desktop.keyboard.press('Space');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  await desktop.keyboard.press('Tab');
  assert.equal(await desktop.evaluate(() => document.activeElement.textContent), 'After rain');
  await desktop.keyboard.press('Escape');
  passed('44px control, 7px dot, keyboard activation, selected state, Tab, Escape and focus return');

  await open(desktop);
  const point = await canopyPoint(desktop);
  const releasesBeforeDismiss = await desktop.evaluate(() => window.__weatherReview.releases);
  await desktop.mouse.click(point.x, point.y);
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await desktop.evaluate(() => window.__weatherReview.releases), releasesBeforeDismiss);
  await workingTree(desktop);
  passed('Outside dismissal consumes the tree press; the following tree press still releases petals');

  const timeOrigin = await desktop.evaluate(() => performance.timeOrigin);
  await open(desktop);
  await desktop.getByRole('button', { name: 'Rain', exact: true }).click();
  assert.equal(await desktop.evaluate(() => performance.timeOrigin), timeOrigin);
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  passed('Selecting the current weather closes the panel without navigation');

  await choose(desktop, 'After rain', 'wet');
  let location = new URL(desktop.url());
  assert.equal(location.searchParams.get('rain'), 'pixel');
  assert.equal(location.searchParams.get('review'), 'keep');
  assert.equal(location.hash, '#quiet');
  await open(desktop);
  const fireflyToggle = desktop.getByRole('checkbox', { name: 'Firefly' });
  assert.equal(await fireflyToggle.isChecked(), false);
  assert.equal(await desktop.evaluate(() => window.__weatherReview.firefly), null);
  await Promise.all([
    desktop.waitForURL((candidate) => candidate.searchParams.get('firefly') === '1'),
    fireflyToggle.check(),
  ]);
  await ready(desktop);
  assert.equal(await desktop.evaluate(() => window.__weatherReview.firefly.getTelemetry().capacity), 1);
  await open(desktop);
  assert.equal(await desktop.getByRole('checkbox', { name: 'Firefly' }).isChecked(), true);
  await desktop.screenshot({ path: resolve(outputDirectory, 'controls-desktop.png') });
  passed('After rain exposes an off-by-default firefly checkbox; enabling it stores firefly=1');

  let navigationRequests = 0;
  desktop.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === desktop.mainFrame()) navigationRequests += 1;
  });
  const beforeRapidSelection = navigationRequests;
  await desktop.evaluate(() => {
    document.querySelector('[data-weather-choice="snow"]').click();
    document.querySelector('[data-weather-choice="clear"]').click();
  });
  await desktop.waitForURL((candidate) => candidate.searchParams.get('weather') === 'snow');
  await ready(desktop);
  await desktop.waitForTimeout(300);
  assert.equal(navigationRequests, beforeRapidSelection + 1);
  location = new URL(desktop.url());
  assert.equal(location.searchParams.get('rain'), 'pixel');
  assert.equal(location.searchParams.get('review'), 'keep');
  assert.equal(location.searchParams.get('firefly'), '1');
  assert.equal(location.hash, '#quiet');
  assert.equal(await desktop.getByRole('checkbox', { name: 'Firefly' }).count(), 0);
  assert.equal(await desktop.evaluate(() => window.__weatherReview.firefly), null);
  assert.equal(await desktop.evaluate(() => window.__weatherReview.snowfall.group.visible), true);
  passed('Rapid selections produce one navigation, preserve unrelated URL state, and suppress firefly in Snow');

  await desktop.goBack({ waitUntil: 'domcontentloaded' });
  await ready(desktop);
  assert.equal(new URL(desktop.url()).searchParams.get('weather'), 'wet');
  await workingTree(desktop);
  await desktop.goForward({ waitUntil: 'domcontentloaded' });
  await ready(desktop);
  assert.equal(new URL(desktop.url()).searchParams.get('weather'), 'snow');
  await workingTree(desktop);
  passed('Back and Forward restore their weather and working tree interaction');

  await choose(desktop, 'Clear', 'clear');
  assert.equal(await desktop.getByRole('checkbox', { name: 'Firefly' }).count(), 0);
  assert.equal(await desktop.evaluate(() => window.__weatherReview.firefly), null);
  await choose(desktop, 'Rain', 'rain');
  assert.equal(await desktop.evaluate(() => window.__weatherReview.firefly), null);
  await choose(desktop, 'After rain', 'wet');
  await open(desktop);
  assert.equal(await desktop.getByRole('checkbox', { name: 'Firefly' }).isChecked(), true);
  await Promise.all([
    desktop.waitForURL((candidate) => !candidate.searchParams.has('firefly')),
    desktop.getByRole('checkbox', { name: 'Firefly' }).uncheck(),
  ]);
  await ready(desktop);
  assert.equal(await desktop.evaluate(() => window.__weatherReview.firefly), null);
  passed('All four weather choices work; firefly preference survives weather changes and can be removed');
  await desktop.close();

  const portrait = await browser.newPage({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true,
  });
  watch(portrait, 'portrait');
  await portrait.goto(`${url}?weather=wet`, { waitUntil: 'domcontentloaded' });
  await ready(portrait);
  await open(portrait, true);
  const panel = await portrait.getByRole('dialog', { name: 'Weather' }).boundingBox();
  assert.ok(panel.x >= 0 && panel.y >= 0 && panel.x + panel.width <= 390 && panel.y + panel.height <= 844);
  await portrait.screenshot({ path: resolve(outputDirectory, 'controls-portrait.png') });
  const touchPoint = await canopyPoint(portrait);
  const beforeTouch = await portrait.evaluate(() => window.__weatherReview.releases);
  await portrait.touchscreen.tap(touchPoint.x, touchPoint.y);
  assert.equal(await portrait.evaluate(() => window.__weatherReview.releases), beforeTouch);
  assert.equal(await portrait.getByRole('button', { name: 'Change weather' }).getAttribute('aria-expanded'), 'false');
  await portrait.touchscreen.tap(touchPoint.x, touchPoint.y);
  assert.equal(await portrait.evaluate(() => window.__weatherReview.releases), beforeTouch + 1);
  await open(portrait, true);
  await Promise.all([
    portrait.waitForURL((candidate) => candidate.searchParams.get('weather') === 'snow'),
    portrait.getByRole('button', { name: 'Snow', exact: true }).tap(),
  ]);
  await ready(portrait);
  passed('Portrait touch opens a fitting panel, consumes dismissal, and changes weather');
  await portrait.close();

  const reduced = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
  watch(reduced, 'reduced-motion');
  await reduced.goto(`${url}?weather=snow&firefly=1`, { waitUntil: 'domcontentloaded' });
  await ready(reduced);
  assert.equal(await reduced.evaluate(() => window.__weatherReview.snowfall.group.visible), false);
  assert.equal(await reduced.locator('#scene-transition').evaluate((element) => getComputedStyle(element).transitionDuration), '0s');
  await reduced.emulateMedia({ reducedMotion: 'no-preference' });
  await reduced.waitForFunction(() => window.__weatherReview.snowfall.group.visible === true);
  await reduced.emulateMedia({ reducedMotion: 'reduce' });
  await choose(reduced, 'After rain', 'wet');
  assert.equal(await reduced.evaluate(() => window.__weatherReview.firefly.group.visible), false);
  assert.equal(await reduced.locator('#scene-transition').evaluate((element) => getComputedStyle(element).transitionDuration), '0s');
  await reduced.emulateMedia({ reducedMotion: 'no-preference' });
  await reduced.waitForFunction(() => window.__weatherReview.firefly.group.visible === true);
  passed('Reduced motion suppresses Snow and Firefly and removes fades, including live preference changes');
  await reduced.goto(url, { waitUntil: 'domcontentloaded' });
  await ready(reduced);
  assert.equal(await reduced.evaluate(() => document.documentElement.dataset.weather), 'rain');
  passed('No weather query defaults to Rain');
  await reduced.close();

  assert.deepEqual(errors, [], 'No page or browser console errors');
  await writeFile(resolve(outputDirectory, 'controls-checks.json'), `${JSON.stringify({ checks, errors }, null, 2)}\n`);
  console.log(`Completed ${checks.length} weather control checks; screenshots/nocturne-weather/controls-checks.json`);
} finally {
  releaseTexture?.();
  await browser?.close();
  await server.close();
}
