import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { preview } from 'vite';

// Check the actual production bundle under the same path as GitHub Pages.
const base = '/sakura_corner/';
let server;
let browser;
const errors = [];
const assets = new Set();
const checks = [];

try {
  let target = process.env.PAGES_CHECK_URL;
  if (!target) {
    server = await preview({
      base,
      preview: { host: '127.0.0.1', port: 0, open: false },
    });
    target = `http://127.0.0.1:${server.httpServer.address().port}${base}`;
  }
  const targetUrl = new URL(target);
  assert.equal(targetUrl.pathname, base, 'Check the repository hosting path');
  browser = await chromium.launch({ headless: true, channel: 'chrome' });

  async function createPage(viewport) {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => {
      if (!request.failure()?.errorText.includes('ERR_ABORTED')) {
        errors.push(`${request.url()}: ${request.failure()?.errorText}`);
      }
    });
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      if (['script', 'stylesheet', 'image'].includes(response.request().resourceType())) {
        const url = new URL(response.url());
        if (url.origin !== targetUrl.origin || !url.pathname.startsWith(base)) {
          errors.push(`Asset escaped the hosted path: ${url}`);
        }
        assets.add(url.pathname);
      }
    });
    return page;
  }

  async function ready(page, weather) {
    await page.waitForFunction(expected =>
      document.documentElement.dataset.sceneReady === 'true'
      && document.documentElement.dataset.weather === expected,
    weather, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    assert.equal(new URL(page.url()).pathname, base);
    const dimensions = await page.locator('#app canvas').evaluate(canvas =>
      ({ width: canvas.width, height: canvas.height }));
    assert.ok(dimensions.width > 100 && dimensions.height > 100, 'Scene canvas is sized');
  }

  const page = await createPage({ width: 1440, height: 900 });
  const initial = new URL(targetUrl);
  initial.searchParams.set('from', 'pages-check');
  initial.hash = 'scene';
  const response = await page.goto(initial.href);
  assert.equal(response.status(), 200);
  await ready(page, 'rain');
  assert.equal(await page.title(), 'Nocturne — Sakura Corner');
  checks.push('Production scene and bundled textures load at the repository path');

  for (const [name, mode] of [['After rain', 'wet'], ['Snow', 'snow'], ['Clear', 'clear'], ['Rain', 'rain']]) {
    await page.getByRole('button', { name: 'Change weather', exact: true }).click();
    await Promise.all([
      page.waitForURL(url => url.searchParams.get('weather') === mode),
      page.getByRole('button', { name, exact: true }).click(),
    ]);
    await ready(page, mode);
    const url = new URL(page.url());
    assert.equal(url.searchParams.get('from'), 'pages-check');
    assert.equal(url.hash, '#scene');
    if (mode === 'wet') {
      await page.getByRole('button', { name: 'Change weather', exact: true }).click();
      await Promise.all([
        page.waitForURL(url => url.searchParams.get('firefly') === '1'),
        page.getByRole('checkbox', { name: 'Firefly', exact: true }).check(),
      ]);
      await ready(page, mode);
    }
  }
  checks.push('All four weather choices and the firefly reload within the hosted path');
  checks.push('Unrelated query parameters and the hash survive navigation');
  await page.goBack();
  await ready(page, 'clear');
  checks.push('Browser history restores the previous weather');

  const portrait = await createPage({ width: 390, height: 844 });
  const snowUrl = new URL(targetUrl);
  snowUrl.searchParams.set('weather', 'snow');
  await portrait.goto(snowUrl.href);
  await ready(portrait, 'snow');
  await portrait.getByRole('button', { name: 'Change weather', exact: true }).click();
  const panel = await portrait.getByRole('dialog', { name: 'Weather' }).boundingBox();
  assert.ok(panel && panel.x >= 0 && panel.x + panel.width <= 390);
  checks.push('A bookmarked Snow URL loads directly and its control fits portrait');

  assert.equal([...assets].filter(path => path.endsWith('.png')).length, 3,
    'All three bundled detail textures were requested');
  assert.ok([...assets].some(path => path.endsWith('.js')));
  assert.ok([...assets].some(path => path.endsWith('.css')));
  assert.deepEqual(errors, [], 'No failed requests or JavaScript errors');
  if (process.env.PAGES_CHECK_SCREENSHOT) {
    await page.screenshot({ path: process.env.PAGES_CHECK_SCREENSHOT });
  }
  console.log(JSON.stringify({ target, browser: browser.version(), checks, assets: [...assets], errors }, null, 2));
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
}
