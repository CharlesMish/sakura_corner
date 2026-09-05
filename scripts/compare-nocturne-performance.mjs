import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const directory = new URL('../screenshots/nocturne/', import.meta.url);
const baseline = JSON.parse(await readFile(new URL('baseline-performance.json', directory), 'utf8'));
const final = JSON.parse(await readFile(new URL('final-performance.json', directory), 'utf8'));
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
assert.equal(baseline.browser, final.browser, 'Browser versions must match');
const devices = new Set([...baseline.results, ...final.results].map(row => row.device));
assert.equal(devices.size, 1, 'GPU/device must match across all trials');
const rows = [];
for (const aspect of ['desktop', 'laptop', 'portrait', 'ultrawide']) {
  for (const weather of ['rain', 'clear']) {
    const measurements = [baseline, final].map(run => {
      const samples = run.results.filter(row => row.aspect === aspect && row.weather === weather);
      assert.equal(samples.length, 3, `${aspect}/${weather}: three trials required`);
      samples.forEach(row => assert.ok(row.frames * row.frameMs >= 5500, `${aspect}/${weather}: incomplete sample`));
      return { frameMs: median(samples.map(row => row.frameMs)), p95Ms: median(samples.map(row => row.p95Ms)), draws: median(samples.map(row => row.drawCalls)) };
    });
    const [before, after] = measurements;
    rows.push({ aspect, weather, before, after,
      frameChangePercent: (after.frameMs / before.frameMs - 1) * 100,
      p95ChangePercent: (after.p95Ms / before.p95Ms - 1) * 100 });
  }
}
const regressions = rows.filter(row => row.frameChangePercent > 10 || row.p95ChangePercent > 10);
const summary = { browser: final.browser, device: [...devices][0], baseline: baseline.ref,
  method: 'Median of three trial means and three trial p95s; 4s warmup + 6s live animation, DPR 1, same GPU. Vsync limits inference about rendering headroom.', rows, regressions };
await writeFile(new URL('performance-comparison.json', directory), JSON.stringify(summary, null, 2));
console.log('| View | Weather | Frame ms before / after | p95 ms before / after | Draws before / after |');
console.log('|---|---|---|---|---|');
for (const row of rows) console.log(`| ${row.aspect} | ${row.weather} | ${row.before.frameMs.toFixed(3)} / ${row.after.frameMs.toFixed(3)} | ${row.before.p95Ms.toFixed(2)} / ${row.after.p95Ms.toFixed(2)} | ${row.before.draws} / ${row.after.draws} |`);
console.log(`Saved ${fileURLToPath(new URL('performance-comparison.json', directory))}`);
assert.equal(regressions.length, 0, 'Investigate performance regressions above 10%');
