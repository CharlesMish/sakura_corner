import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { applyLocalPlaywrightLibsIfNeeded } from './playwright-libs.mjs';

// Review-only transforms: committed sources, seeded particles and fixed simulation
// time. Nothing is exposed by the production app. Performance uses live animation.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const label = process.env.REVIEW_LABEL ?? 'final';
const ref = process.env.REVIEW_REF;
const performanceMode = process.env.REVIEW_PERF === '1';
const seconds = Number(process.env.REVIEW_SECONDS ?? 4);
const output = resolve(root, 'screenshots/nocturne');
applyLocalPlaywrightLibsIfNeeded(root);
if (process.platform !== 'win32') process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve(root, '.playwright-browsers');
const sources = new Map();
const server = await createServer({ root, logLevel: 'warn', server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'nocturne-review', enforce: 'pre', transform(code, id) {
    const relative = id.replaceAll('\\', '/').split('/src/')[1]?.split('?')[0];
    if (!relative) return;
    if (ref) {
      if (!sources.has(relative)) sources.set(relative, execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, 'show', `${ref}:src/${relative}`], { cwd: root, encoding: 'utf8' }));
      code = sources.get(relative);
    }
    if (!performanceMode && relative === 'main.js') {
      code = code.replace('const weatherEffects =', 'window.reviewResetRandom(); const weatherEffects =');
      code = code.replace('timer.update(timestamp);', '');
      code = code.replace('const delta = Math.min(timer.getDelta(), 0.05);', 'const delta = timestamp === 0 ? 0 : 1 / 60;');
      code = code.replace('const elapsed = timer.getElapsed();', 'const elapsed = timestamp / 1000;');
      code = code.replace('renderer.render(scene, camera);', 'if (window.reviewDraw) renderer.render(scene, camera);');
      code = code.replace('renderer.setAnimationLoop(render);', `
        window.reviewDraw = false;
        for (let frame = 0; frame <= ${seconds * 60}; frame++) render(frame * 1000 / 60);
        window.reviewDraw = true;
        renderer.render(scene, camera);
        window.reviewReady = true;
      `);
    }
    if (process.env.REVIEW_SHADOW === 'visible' && relative === 'scene/createSakuraTree.js') {
      code = code.replace('if (weatherIsWet()) mesh.customDepthMaterial = foliageShadowMaterial;', '');
    }
    return code;
  } }],
});
let browser;
const results = [];
if (performanceMode && process.env.REVIEW_RESUME === '1') {
  const previous = JSON.parse(await readFile(resolve(output, `${label}-performance.json`), 'utf8'));
  if (previous.ref !== (ref ?? 'working tree')) throw new Error('Cannot resume measurements from a different source');
  results.push(...previous.results.filter(result => result.frames >= 60 && result.frames * result.frameMs >= 5500));
}
try {
  await mkdir(output, { recursive: true });
  await server.listen();
  browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'chrome' } : {}) });
  const viewports = [['desktop', 1920, 1080], ['laptop', 1366, 768], ['portrait', 390, 844], ['ultrawide', 2560, 1080]];
  for (const [aspect, width, height] of viewports) {
    if (process.env.REVIEW_ONLY && aspect !== process.env.REVIEW_ONLY) continue;
    for (const weather of ['rain', 'clear']) {
      let retries = 0;
      for (let trial = 0; trial < (performanceMode ? Number(process.env.REVIEW_TRIALS ?? 3) : 1); trial++) {
        if (performanceMode && results.some(result => result.aspect === aspect && result.weather === weather && result.trial === trial)) continue;
        const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.addInitScript(() => {
          let seed = 92741;
          window.reviewResetRandom = () => { seed = 92741; };
          Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
          window.reviewFrames = [];
          let previous = 0, draws = 0;
          for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
            const original = WebGL2RenderingContext.prototype[name];
            WebGL2RenderingContext.prototype[name] = function (...args) { draws++; return original.apply(this, args); };
          }
          function sample(time) {
            if (window.reviewMeasure && previous) window.reviewFrames.push({ ms: time - previous, draws });
            previous = time; draws = 0; requestAnimationFrame(sample);
          }
          requestAnimationFrame(sample);
        });
        await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?weather=${weather}`, { waitUntil: 'networkidle' });
        await page.bringToFront();
        if (performanceMode) {
          await page.waitForTimeout(4000);
          await page.evaluate(() => { window.reviewMeasure = true; });
          await page.waitForTimeout(6000);
          const metrics = await page.evaluate(() => {
            const frames = window.reviewFrames;
            const times = frames.map(frame => frame.ms).sort((a, b) => a - b);
            const gl = document.querySelector('canvas').getContext('webgl2');
            const debug = gl.getExtension('WEBGL_debug_renderer_info');
            return { frames: frames.length, frameMs: times.reduce((a, b) => a + b, 0) / times.length,
              p95Ms: times[Math.floor(times.length * 0.95)], drawCalls: frames.reduce((a, b) => a + b.draws, 0) / frames.length,
              device: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) };
          });
          if (metrics.frames < 60 || metrics.frames * metrics.frameMs < 5500) {
            await page.close();
            if (errors.length) throw new Error(errors.join('\n'));
            if (++retries > 2) throw new Error(`Insufficient animation samples: ${aspect}/${weather}`);
            console.log(`Retrying ${aspect}/${weather}: incomplete six-second animation sample (${metrics.frames} frames)`);
            trial--;
            continue;
          }
          results.push({ aspect, weather, trial, ...metrics });
          console.log(JSON.stringify(results.at(-1)));
        } else {
          await page.waitForFunction(() => window.reviewReady);
          await page.screenshot({ path: resolve(output, `${label}-${weather}-${aspect}.png`) });
          console.log(`Captured ${label}-${weather}-${aspect}`);
        }
        if (errors.length) throw new Error(errors.join('\n'));
        await page.close();
      }
    }
  }
  if (performanceMode) await writeFile(resolve(output, `${label}-performance.json`), JSON.stringify({ ref: ref ?? 'working tree', browser: browser.version(), results }, null, 2));
} finally { await browser?.close(); await server.close(); }
