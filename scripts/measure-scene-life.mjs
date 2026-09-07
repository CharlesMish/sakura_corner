import { readFile, writeFile, unlink } from 'node:fs/promises';

const temporary = new URL(`./.review-life-performance-${process.pid}.mjs`, import.meta.url);
let code = await readFile(new URL('./measure-weather-performance.mjs', import.meta.url), 'utf8');
code = code.replace('root, baselineRef, startWeatherReview', 'root, startWeatherReview')
  .replace("const output =", "const baselineRef = '1207ccd';\nconst output =")
  .replace('screenshots/nocturne-weather', 'screenshots/nocturne-life')
  .replace("['snow','wet','snow'], ['firefly','wet','wet&firefly=1']", "['snow','snow','snow']")
  .replace("['laptop',1366,768], ", '')
  .replace(", ['ultrawide',2560,1080]", '')
  .replace("name === 'firefly' ? 7000 : 2000", "name === 'clear' ? 15000 : 2000")
  .replace('2s warmup (7s firefly)', '2s warmup (15s Clear to include the flock)')
  .replace('Snow/firefly compare to the same damp evening without the feature.', 'Each mode compares to the same weather in the published Pages baseline.');
try { await writeFile(temporary, code); await import(temporary.href); }
finally { await unlink(temporary); }
