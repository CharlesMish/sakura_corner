// Isolated review output, reusing the established fixed-time capture machinery.
import { readFile, writeFile, unlink } from 'node:fs/promises';
const temporary = new URL(`./.review-weather-${process.pid}.mjs`, import.meta.url);
let code = await readFile(new URL('./review-nocturne.mjs', import.meta.url), 'utf8');
code = code.replace('if (!relative) return;', "if (!relative || !/\\.(js|css)$/.test(relative)) return;");
const modes = process.env.REVIEW_WEATHER ? [process.env.REVIEW_WEATHER]
  : process.env.REVIEW_REF ? ['rain', 'wet', 'clear'] : ['rain', 'wet', 'clear', 'snow'];
if (modes.some(mode => !['rain','wet','clear','snow'].includes(mode))) throw new Error('Unknown weather');
code = code.replace("'screenshots/nocturne'", "'screenshots/nocturne-weather'")
  .replace("['rain', 'clear']", JSON.stringify(modes));
code = code.replace("name: 'nocturne-review',", `name: 'nocturne-review',
  transformIndexHtml(html) {
    return ref ? execFileSync('git', ['-c', 'safe.directory=' + root.replaceAll('\\\\','/'), 'show', ref + ':index.html'], { cwd: root, encoding: 'utf8' }) : html;
  },`);
code = code.replace('window.reviewReady = true;', `
  window.weatherReviewRender = () => {
    renderer.render(scene, camera);
    ${process.env.REVIEW_REF ? '' : 'weatherControls.reveal();'}
  };
  window.reviewReady = true;`);
code = code.replace('await page.screenshot({', `await page.evaluate(() => window.weatherReviewRender());
          await page.waitForTimeout(300);
          await page.screenshot({`);
if (process.env.REVIEW_FIREFLY === '1') code = code.replace('?weather=${weather}', '?weather=${weather}&firefly=1');
try { await writeFile(temporary, code); await import(temporary.href); }
finally { await unlink(temporary); }
