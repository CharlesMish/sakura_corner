// Isolate the decoration recording; never weaken or overwrite the canonical audit.
import { readFile, writeFile, unlink } from 'node:fs/promises';
const temporary = new URL('./.capture-everyday-run.mjs', import.meta.url);
let code = await readFile(new URL('./capture-nocturne-temporal.mjs', import.meta.url), 'utf8');
code = code.replace("'screenshots/nocturne-temporal'", "'screenshots/nocturne-everyday/temporal'");
code = code.replace("if (git('diff', canonical, '--', 'src', 'index.html', 'package.json', 'package-lock.json')) throw new Error('Scene differs from the canonical reference');",
  `if (git('diff', canonical, '--', 'src/config.js', 'src/main.js', 'src/scene/createLighting.js', 'src/scene/createSakuraTree.js', 'src/scene/createPetalSystem.js', 'src/scene/createWeatherEffects.js', 'package.json', 'package-lock.json')) throw new Error('Frozen composition or animation sources changed');`);
code = code.replaceAll('canonical-reference.json', 'detail-reference.json').replaceAll('canonical-start.png', 'detail-start.png').replaceAll('canonical-end.png', 'detail-end.png').replaceAll('canonical-65s.webm', 'detail-65s.webm');
code = code.replace("tag: 'nocturne-canonical'", "tag: 'nocturne-canonical', candidate: 'working tree with everyday decoration'");
try { await writeFile(temporary, code); await import(temporary.href); }
finally { await unlink(temporary); }
