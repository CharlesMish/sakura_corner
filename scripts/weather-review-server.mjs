import { createServer } from 'vite';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export const root = fileURLToPath(new URL('../', import.meta.url));
export const baselineRef = '7dbae2c';

// Review-only access; never shipped as part of the app.
export async function startWeatherReview({ ref } = {}) {
  const source = path => execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\','/').replace(/\/$/,'')}`, 'show', `${ref}:${path}`], { cwd: root, encoding: 'utf8' });
  const server = await createServer({ root, logLevel: 'warn', server: { host: '127.0.0.1', port: 0 },
    plugins: [{ name: 'weather-review-observer', enforce: 'pre',
      transformIndexHtml: html => ref ? source('index.html') : html,
      transform(code, id) {
        const path = id.replaceAll('\\','/').split('/src/')[1]?.split('?')[0];
        if (!path || !/\.(js|css)$/.test(path)) return;
        if (ref) code = source(`src/${path}`);
        if (path === 'main.js') {
          code = code.replace('renderer.render(scene, camera);', 'renderer.render(scene, camera); window.weatherObserve?.(elapsed, delta);');
          code += `\nwindow.weatherReview = { scene, camera, renderer, petalSystem, tree, weatherEffects, lighting,
            snowfall: ${ref ? 'null' : 'snowfall'}, firefly: ${ref ? 'null' : 'firefly'} };`;
        }
        return code;
      },
    }],
  });
  await server.listen();
  return { server, url: `http://127.0.0.1:${server.httpServer.address().port}` };
}
