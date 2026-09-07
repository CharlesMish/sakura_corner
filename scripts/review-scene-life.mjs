import { readFile, writeFile, unlink } from 'node:fs/promises';

// Keep this pass separate from all accepted reference and weather captures.
const temporary = new URL(`./.review-life-run-${process.pid}.mjs`, import.meta.url);
const code = (await readFile(new URL('./review-weather-modes.mjs', import.meta.url), 'utf8'))
  .replaceAll('screenshots/nocturne-weather', 'screenshots/nocturne-life')
  .replaceAll('.review-weather-', '.review-life-')
  // This pass's Pages baseline already has the loading curtain and Snow.
  .replace("process.env.REVIEW_REF ? '' : 'weatherControls.reveal();'", "'weatherControls.reveal();'")
  .replace("process.env.REVIEW_REF ? ['rain', 'wet', 'clear'] : ['rain', 'wet', 'clear', 'snow']", "['rain', 'wet', 'clear', 'snow']");
try { await writeFile(temporary, code); await import(temporary.href); }
finally { await unlink(temporary); }
