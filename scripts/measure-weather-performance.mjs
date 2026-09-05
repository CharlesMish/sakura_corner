import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { root, baselineRef, startWeatherReview } from './weather-review-server.mjs';
const output = resolve(root, 'screenshots/nocturne-weather');
await mkdir(output, { recursive: true });
const baseline = await startWeatherReview({ ref: baselineRef });
const candidate = await startWeatherReview();
const servers = { baseline, candidate };
const cases = [['rain','rain','rain'], ['wet','wet','wet'], ['clear','clear','clear'], ['snow','wet','snow'], ['firefly','wet','wet&firefly=1']];
const views = [['desktop',1920,1080], ['laptop',1366,768], ['portrait',390,844], ['ultrawide',2560,1080]];
const samples = [], rows = [];
let previousBrowser;
if (process.env.WEATHER_PERF_RESUME === '1') {
  const previous = JSON.parse(await readFile(resolve(output,'performance-samples.json'),'utf8'));
  if(previous.baseline!==baselineRef) throw new Error('Resume baseline changed');
  previousBrowser=previous.browser;
  // A named feature can be invalidated after an edit; incomplete samples are
  // never reused. Earlier raw runs are retained separately by the caller.
  samples.push(...previous.samples.filter(sample=>sample.name!==process.env.WEATHER_PERF_INVALIDATE && sample.frames>=60));
}
let browser;
const median = values => values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
async function measure(version, aspect, width, height, name, query, trial) {
  const previous = samples.find(s=>s.version===version && s.aspect===aspect && s.name===name && s.trial===trial);
  if(previous) return previous;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${servers[version].url}/?weather=${query}`, { waitUntil: 'networkidle' });
    await page.bringToFront();
    if (version === 'candidate') await page.waitForFunction(() => document.documentElement.dataset.sceneReady === 'true');
    // Include a full scheduled glow for the firefly rather than sampling its dark delay.
    await page.waitForTimeout(name === 'firefly' ? 7000 : 2000);
    const result = await page.evaluate(() => new Promise(resolve => {
      const { renderer } = window.weatherReview;
      const gl = renderer.getContext();
      const extension = gl.getExtension('WEBGL_debug_renderer_info');
      const frames = [], draws = [];
      let start, previous;
      window.weatherObserve = () => {
        const now = performance.now();
        start ??= now;
        if (previous !== undefined) { frames.push(now-previous); draws.push(renderer.info.render.calls); }
        previous = now;
        if (now-start < 4000) return;
        delete window.weatherObserve;
        const sorted = [...frames].sort((a,b)=>a-b);
        resolve({ frames: frames.length, durationMs: now-start,
          frameMs: frames.reduce((a,b)=>a+b,0)/frames.length, p95Ms: sorted[Math.floor(sorted.length*.95)],
          maxFrameMs: sorted.at(-1), drawCalls: draws.reduce((a,b)=>a+b,0)/draws.length,
          device: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) });
      };
    }));
    if (errors.length) throw new Error(errors.join('\n'));
    const row = { version, aspect, name, query, trial, ...result };
    samples.push(row);
    await writeFile(resolve(output,'performance-samples.json'),JSON.stringify({ baseline:baselineRef,browser:browser.version(),samples },null,2));
    console.log(`${aspect}/${name} ${version} ${trial}: ${result.frameMs.toFixed(2)}ms, p95 ${result.p95Ms.toFixed(2)}ms`);
    return row;
  } finally { await page.close(); }
}
function compare(before,after) {
  const reduce = values => ({ frameMs:median(values.map(r=>r.frameMs)),p95Ms:median(values.map(r=>r.p95Ms)),drawCalls:median(values.map(r=>r.drawCalls)) });
  const b=reduce(before), a=reduce(after);
  return { before:b,after:a,frameChangePercent:(a.frameMs/b.frameMs-1)*100,p95ChangePercent:(a.p95Ms/b.p95Ms-1)*100 };
}
const regresses = row => row.frameChangePercent > 10 || row.p95ChangePercent > 10;
try {
  browser = await chromium.launch({ headless: true, channel: 'chrome' });
  if(previousBrowser && previousBrowser!==browser.version()) throw new Error('Resume browser changed');
  for (const [aspect,width,height] of views) for (const [name,beforeQuery,afterQuery] of cases) {
    const before = [await measure('baseline',aspect,width,height,name,beforeQuery,0)];
    const after = [await measure('candidate',aspect,width,height,name,afterQuery,0)];
    const initial = compare(before,after);
    const stalled = [...before,...after].some(sample=>sample.maxFrameMs>250 || sample.frames<60);
    const followupsExist = samples.some(sample=>sample.aspect===aspect && sample.name===name && sample.trial>0);
    if (regresses(initial) || stalled || followupsExist) {
      console.log(`Investigating ${aspect}/${name}: three alternating pairs in total.`);
      for(let trial=1;trial<3;trial++) {
        before.push(await measure('baseline',aspect,width,height,name,beforeQuery,trial));
        after.push(await measure('candidate',aspect,width,height,name,afterQuery,trial));
      }
    }
    rows.push({aspect,name,baselineWeather:beforeQuery,initial,trials:before.length,...compare(before,after)});
  }
  if(new Set(samples.map(s=>s.device)).size!==1) throw new Error('GPU changed during measurement');
  const regressions = rows.filter(regresses);
  const summary={baseline:baselineRef,browser:browser.version(),device:samples[0].device,
    method:'Sequential baseline/candidate pairs, 2s warmup (7s firefly) + 4s measured rendering. Flagged >10% mean/p95 or >250ms stalled cases expanded to three alternating pairs, compared by medians. Resume rejects samples with fewer than 60 frames. Snow/firefly compare to the same damp evening without the feature. Vsync and scheduling limit GPU headroom inference.',rows,regressions};
  await writeFile(resolve(output,'performance-comparison.json'),JSON.stringify(summary,null,2));
  console.log(JSON.stringify({regressions},null,2));
  if(regressions.length) process.exitCode=1;
} finally { await browser?.close(); await baseline.server.close(); await candidate.server.close(); }
