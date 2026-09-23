import { readFile, writeFile, unlink } from 'node:fs/promises';

const temporary = new URL(`./.capture-life-${process.pid}.mjs`, import.meta.url);
let code = await readFile(new URL('./capture-weather-temporal.mjs', import.meta.url), 'utf8');
code = code.replace('screenshots/nocturne-weather/temporal', 'screenshots/nocturne-life')
  .replace("[['snow','weather=snow'], ['firefly','weather=wet&firefly=1']]", "[['wet','weather=wet'], ['clear','weather=clear']]")
  .replaceAll('65', '90').replace('part < 5', 'part < 6')
  .replace('13000', '15000').replace('(part+1)*13', '(part+1)*15')
  .replace('const { snowfall, firefly, lighting }', 'const { snowfall, firefly, lighting, sceneLife }')
  .replace('samples.push({ time, camera:', 'samples.push({ time, life: sceneLife.getTelemetry(), pose: sceneLife.group.children[0].matrixWorld.toArray(), camera:');
try { await writeFile(temporary, code); await import(temporary.href); }
finally { await unlink(temporary); }
