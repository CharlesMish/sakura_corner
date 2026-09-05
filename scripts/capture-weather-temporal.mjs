import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { root, startWeatherReview } from './weather-review-server.mjs';

const output = resolve(root, 'screenshots/nocturne-weather/temporal');
await mkdir(output, { recursive: true });
const { server, url } = await startWeatherReview();
let browser;
try {
  browser = await chromium.launch({ headless: true, channel: 'chrome' });
  for (const [label, query] of [['snow','weather=snow'], ['firefly','weather=wet&firefly=1']]) {
    if (process.env.RECORD_ONLY && process.env.RECORD_ONLY !== label) continue;
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${url}/?${query}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.dataset.sceneReady === 'true');
    await page.bringToFront();
    await page.waitForTimeout(4000);
    console.log(`Recording ${label}: 65 seconds at normal playback speed.`);
    await page.evaluate(() => {
      const { renderer, camera } = window.weatherReview;
      const stream = renderer.domElement.captureStream(60);
      const mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) throw new Error('VP9 unsupported');
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 7000000 });
      const chunks = [], frames = [], samples = [], visibility = [];
      const start = performance.now();
      const cameraMatrix = camera.matrixWorld.toArray();
      let lastSample = -Infinity;
      window.weatherObserve = (elapsed, delta) => {
        const time = (performance.now() - start) / 1000;
        frames.push([time, elapsed, delta]);
        if (time - lastSample < 0.1) return;
        lastSample = time;
        const { snowfall, firefly, lighting } = window.weatherReview;
        samples.push({ time, camera: camera.matrixWorld.toArray(), snow: snowfall?.getStats(),
          firefly: firefly?.getTelemetry(), lights: lighting.group.children.map(light => light.position.toArray()) });
      };
      document.addEventListener('visibilitychange', () => visibility.push(document.visibilityState));
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      window.weatherRecording = new Promise((resolve, reject) => {
        recorder.onerror = event => reject(new Error(event.error?.message ?? 'Recording failed'));
        recorder.onstop = () => {
          delete window.weatherObserve;
          stream.getTracks().forEach(track => track.stop());
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onloadend = () => resolve({ video: reader.result.split(',')[1], frames, samples, visibility,
            cameraMatrix, wallSeconds: (performance.now()-start)/1000 });
          reader.readAsDataURL(new Blob(chunks, { type: mimeType }));
        };
      });
      recorder.start(1000);
      setTimeout(() => recorder.stop(), 65000);
    });
    for (let part = 0; part < 5; part++) {
      await page.waitForTimeout(13000);
      console.log(`${label}: ${(part+1)*13}s`);
    }
    const { video, ...telemetry } = await page.evaluate(() => window.weatherRecording);
    await writeFile(resolve(output, `${label}-65s.webm`), Buffer.from(video, 'base64'));
    await writeFile(resolve(output, `${label}-telemetry.json`), JSON.stringify(telemetry));
    if (telemetry.frames.at(-1)[0] - telemetry.frames[0][0] < 60 || telemetry.visibility.length) throw new Error('Recording interrupted');
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`${label}: saved ${telemetry.frames.length} rendered frames`);
    if (label === 'firefly') {
      await page.waitForFunction(() => window.weatherReview.firefly.getTelemetry().opacity > 0.6, undefined, { timeout: 20000 });
      await page.screenshot({ path: resolve(output, 'firefly-lossless-peak.png') });
    }
    await page.close();
  }
} finally { await browser?.close(); await server.close(); }
