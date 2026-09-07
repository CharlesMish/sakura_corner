import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { startWeatherReview } from './weather-review-server.mjs';

const { server, url } = await startWeatherReview();
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const errors = [], checks = [];
try {
  for (const weather of ['rain','wet','clear','snow']) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${url}/?weather=${weather}`, { waitUntil:'networkidle' });
    await page.waitForFunction(() => document.documentElement.dataset.sceneReady==='true');
    const initial = await page.evaluate(() => {
      const { sceneLife, snowfall } = window.weatherReview;
      const meshes=[];
      sceneLife.group.traverse(object=>{if(object.isMesh) meshes.push(object.uuid);});
      return { ...sceneLife.getTelemetry(), name:sceneLife.group.children[0].name, meshes, snow:snowfall?.getStats() };
    });
    assert.equal(initial.weather,weather);
    assert.equal(initial.meshes.length, weather==='clear' ? 1 : weather==='wet' ? 6 : 3);
    assert.equal(initial.snow?.capacity, weather==='snow' ? 64 : undefined);
    await page.emulateMedia({ reducedMotion:'reduce' });
    await page.waitForTimeout(150);
    const snapshot = () => page.evaluate(() => {
      const { sceneLife } = window.weatherReview;
      const poses=[];
      sceneLife.group.traverse(object=>{if(object.isMesh) poses.push(object.matrixWorld.toArray());});
      return { ...sceneLife.getTelemetry(), poses };
    });
    const frozen = await snapshot();
    await page.waitForTimeout(400);
    assert.deepEqual(await snapshot(),frozen,'Live reduced motion freezes the new animation');
    if(weather==='clear') assert.equal(frozen.active,false);
    await page.emulateMedia({ reducedMotion:'no-preference' });
    await page.waitForTimeout(300);
    assert.ok((await snapshot()).time>frozen.time);
    checks.push({weather,name:initial.name,meshes:initial.meshes.length,reducedMotion:'pass',snowCapacity:initial.snow?.capacity});
    await page.close();
  }
  assert.deepEqual(errors,[]);
  await writeFile(new URL('../screenshots/nocturne-life/browser-checks.json',import.meta.url),JSON.stringify({checks,errors},null,2));
  console.log(JSON.stringify({checks,errors},null,2));
} finally { await browser.close(); await server.close(); }
