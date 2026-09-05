import { readFile, writeFile, unlink } from 'node:fs/promises';
const temporary = new URL('./.compare-everyday-run.mjs', import.meta.url);
const code = (await readFile(new URL('./compare-nocturne-performance.mjs', import.meta.url), 'utf8'))
  .replace('../screenshots/nocturne/', '../screenshots/nocturne-everyday/');
try { await writeFile(temporary, code); await import(temporary.href); }
finally { await unlink(temporary); }
