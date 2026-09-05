// Reuse established review machinery with isolated output and review-only groups.
import { readFile, writeFile, unlink } from 'node:fs/promises';
const temporary = new URL(`./.review-everyday-${process.pid}.mjs`, import.meta.url);
let code = await readFile(new URL('./review-nocturne.mjs', import.meta.url), 'utf8');
code = code.replace("'screenshots/nocturne'", "'screenshots/nocturne-everyday'");
if (process.env.REVIEW_WEATHER) {
  if (!['rain', 'clear'].includes(process.env.REVIEW_WEATHER)) throw new Error('Unknown review weather');
  code = code.replace("['rain', 'clear']", JSON.stringify([process.env.REVIEW_WEATHER]));
}
// Texture requests finish asynchronously after the fixed simulation pass.
code = code.replace('window.reviewReady = true;', `
  window.everydayReviewRender = () => renderer.render(scene, camera);
  window.reviewReady = true;`);
code = code.replace("await page.screenshot({", `await page.evaluate(() => window.everydayReviewRender());
          await page.screenshot({`);
if (process.env.REVIEW_GROUP) {
  const names = { identity: 'shop identity', notice: 'delivery notice', crate: 'bottle return', roof: 'roof material history', plant: 'upper window plant' };
  const name = names[process.env.REVIEW_GROUP];
  if (!name) throw new Error('Unknown detail group');
  code = code.replace("if (ref) {", `if (!ref && relative === 'scene/createEverydayDetails.js') {
    code = code.replace('return result;', 'result.visible = name === ${JSON.stringify(name)}; return result;');
  }
  if (ref) {`);
  // Restore the original notice for isolated reviews of other details.
  if (name !== 'delivery notice') code = code.replace("return code;", `if (!ref && relative === 'scene/createEverydayDetails.js') code = code.replace('tab.removeFromParent();', '').replace('notice.add(paper);', '');
    return code;`);
}
try { await writeFile(temporary, code); await import(temporary.href); }
finally { await unlink(temporary); }
