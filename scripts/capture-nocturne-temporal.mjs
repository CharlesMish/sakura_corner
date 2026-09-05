import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { ART_DIRECTION } from '../src/config.js';

// Read-only review instrumentation. No clock, RNG, animation or render changes.
// The recording is evidence for human continuous viewing, not an automated
// substitute for judging motion, eye movement, or physical-display clipping.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'screenshots/nocturne-temporal');
const git = (...args) => execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, ...args], { cwd: root, encoding: 'utf8' }).trim();
const canonical = git('rev-parse', 'nocturne-canonical^{commit}');
if (git('diff', canonical, '--', 'src', 'index.html', 'package.json', 'package-lock.json')) throw new Error('Scene differs from the canonical reference');
const sceneFiles = git('ls-tree', '-r', '--name-only', canonical, 'src', 'index.html', 'package.json', 'package-lock.json').split('\n');
const sourceHashes = {};
for (const file of sceneFiles) sourceHashes[file] = createHash('sha256').update(await readFile(resolve(root, file))).digest('hex');
await mkdir(output, { recursive: true });
const server = await createServer({ root, logLevel: 'warn', server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'temporal-observer-only', enforce: 'pre', transform(code, id) {
    if (!id.replaceAll('\\', '/').endsWith('/src/main.js')) return;
    return code.replace('renderer.render(scene, camera);', `renderer.render(scene, camera);
      window.nocturneObserve?.(elapsed, delta);`) + `
      window.nocturneReview = { scene, camera, tree, weatherEffects, petalSystem, lighting, renderer };
    `;
  } }],
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?weather=rain`, { waitUntil: 'networkidle' });
  await page.bringToFront();
  await page.waitForTimeout(4000);
  const initial = await page.evaluate(() => {
    const { camera, renderer, scene, lighting } = window.nocturneReview;
    const gl = renderer.getContext();
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    let casters = 0, customCasters = 0;
    scene.traverse(object => { if (object.castShadow) { casters++; if (object.customDepthMaterial) customCasters++; } });
    return { camera: { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), matrixWorld: camera.matrixWorld.toArray(), fov: camera.fov, aspect: camera.aspect, near: camera.near, far: camera.far },
      renderer: { width: renderer.domElement.width, height: renderer.domElement.height, exposure: renderer.toneMappingExposure, toneMapping: renderer.toneMapping, outputColorSpace: renderer.outputColorSpace, shadowAutoUpdate: renderer.shadowMap.autoUpdate },
      device: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      lights: lighting.group.children.map(light => ({ name: light.name, position: light.position.toArray(), color: light.color.getHex(), castShadow: light.castShadow })), casters, customCasters };
  });
  await writeFile(resolve(output, 'canonical-reference.json'), JSON.stringify({ canonical, tag: 'nocturne-canonical', frozenCameraSettings: ART_DIRECTION.camera,
    sourceHashes, viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 }, weather: 'rain', browser: browser.version(), ...initial }, null, 2));
  await page.screenshot({ path: resolve(output, 'canonical-start.png') });
  console.log('Recording 65 seconds of uninterrupted live playback; no taps, clock overrides or source edits.');
  await page.evaluate(() => {
    const { camera, tree, weatherEffects, petalSystem, lighting, renderer } = window.nocturneReview;
    const canvas = renderer.domElement;
    const mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) throw new Error('VP9 recording unavailable');
    const stream = canvas.captureStream(60);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 10000000 });
    const chunks = [];
    const frames = [], samples = [], visibility = [];
    const startWall = performance.now();
    let startElapsed, lastSample = -Infinity;
    window.nocturneObserve = (elapsed, delta) => {
      startElapsed ??= elapsed;
      frames.push([performance.now() - startWall, elapsed, delta]);
      if (elapsed - lastSample < 0.1) return;
      lastSample = elapsed;
      const zones = [];
      tree.group.traverse(object => {
        if (object.userData.zoneName) zones.push({ name: object.userData.zoneName, rotation: object.rotation.toArray().slice(0, 3), matrix: object.matrixWorld.toArray() });
      });
      const rain = [];
      for (const name of ['Bounded rain streaks', 'Sparse tapered raindrops']) {
        const mesh = weatherEffects.group.getObjectByName(name);
        if (!mesh) continue;
        const data = mesh.instanceMatrix.array;
        const drops = [];
        for (let i = 0; i < mesh.count; i++) {
          const p = i * 16;
          drops.push([data[p + 12], data[p + 13], data[p + 14], Math.hypot(data[p], data[p + 1], data[p + 2]), Math.hypot(data[p + 4], data[p + 5], data[p + 6])]);
        }
        rain.push({ name, drops });
      }
      const falling = petalSystem.group.getObjectByName('Falling sakura petals') ?? petalSystem.group.children.find(mesh => mesh.name.includes('falling') || mesh.name.includes('Falling'));
      samples.push({ time: elapsed - startElapsed, camera: camera.matrixWorld.toArray(), zones, rain, petals: petalSystem.getStats(),
        fallingMatrices: falling ? Array.from(falling.instanceMatrix.array) : null,
        lightPositions: lighting.group.children.map(light => light.position.toArray()), shopIntensity: lighting.group.children.at(-1).intensity });
    };
    document.addEventListener('visibilitychange', () => visibility.push({ ms: performance.now() - startWall, state: document.visibilityState }));
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    window.nocturneRecording = new Promise((resolve, reject) => {
      recorder.onerror = event => reject(new Error(event.error?.message ?? 'MediaRecorder error'));
      recorder.onstop = async () => {
        delete window.nocturneObserve;
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunks, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => resolve({ video: reader.result.split(',')[1], mimeType, frames, samples, visibility, wallDurationMs: performance.now() - startWall });
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      };
    });
    recorder.start(1000);
    setTimeout(() => recorder.stop(), 65000);
  });
  for (let part = 0; part < 5; part++) {
    await page.waitForTimeout(13000);
    console.log(`Live playback elapsed: ${(part + 1) * 13}s`);
  }
  const recording = await page.evaluate(() => window.nocturneRecording);
  const { video, ...telemetry } = recording;
  await writeFile(resolve(output, 'canonical-65s.webm'), Buffer.from(video, 'base64'));
  await writeFile(resolve(output, 'telemetry.json'), JSON.stringify(telemetry));
  await page.screenshot({ path: resolve(output, 'canonical-end.png') });
  if (errors.length) throw new Error(errors.join('\n'));
  const first = telemetry.frames[0], last = telemetry.frames.at(-1);
  console.log(JSON.stringify({ recordedFrames: telemetry.frames.length, simulatedSeconds: last[1] - first[1], wallSeconds: telemetry.wallDurationMs / 1000, samples: telemetry.samples.length, visibility: telemetry.visibility }));
} finally { await browser?.close(); await server.close(); }
