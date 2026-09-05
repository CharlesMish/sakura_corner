// Retain the first run; pair canonical/detail trials to investigate device drift.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
const directory = new URL('../screenshots/nocturne-everyday/', import.meta.url);
const original = JSON.parse(await readFile(new URL('performance-comparison.json', directory), 'utf8'));
const results = [];
for (const { aspect, weather } of original.regressions) {
  for (let trial = 0; trial < 3; trial++) {
    for (const version of ['baseline', 'final']) {
      const label = `investigate-${aspect}-${weather}-${trial}-${version}`;
      const env = { ...process.env, REVIEW_ONLY: aspect, REVIEW_WEATHER: weather,
        REVIEW_TRIALS: '1', REVIEW_PERF: '1', REVIEW_LABEL: label };
      delete env.REVIEW_REF;
      if (version === 'baseline') env.REVIEW_REF = 'nocturne-canonical';
      execFileSync(process.execPath, ['scripts/review-everyday.mjs'], { env, stdio: 'inherit' });
      const measurement = JSON.parse(await readFile(new URL(`${label}-performance.json`, directory), 'utf8'));
      results.push({ version, pair: trial, browser: measurement.browser, ...measurement.results[0] });
    }
  }
}
const median = values => values.sort((a,b) => a-b)[Math.floor(values.length/2)];
const rows = original.regressions.map(({ aspect, weather }) => {
  const [before,after] = ['baseline','final'].map(version => {
    const r = results.filter(r => r.aspect === aspect && r.weather === weather && r.version === version);
    return { frameMs: median(r.map(r=>r.frameMs)), p95Ms: median(r.map(r=>r.p95Ms)), draws: median(r.map(r=>r.drawCalls)) };
  });
  return { aspect, weather, before, after, frameChangePercent: (after.frameMs/before.frameMs-1)*100, p95ChangePercent: (after.p95Ms/before.p95Ms-1)*100 };
});
if (new Set(results.map(r=>r.device)).size !== 1 || new Set(results.map(r=>r.browser)).size !== 1) throw new Error('Device/browser changed');
const summary = { method: 'Three alternating canonical/detail pairs, same device, warmup and sample duration. Original flagged measurements retained.', results, rows,
  regressions: rows.filter(r=>r.frameChangePercent>10 || r.p95ChangePercent>10) };
await writeFile(new URL('performance-investigation.json', directory), JSON.stringify(summary,null,2));
console.log(JSON.stringify({rows, regressions:summary.regressions},null,2));
if (summary.regressions.length) throw new Error('Regression persists in paired trials');
