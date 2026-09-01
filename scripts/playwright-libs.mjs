import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Some sandboxes (e.g. a stripped Ubuntu Core base with no package manager)
// are missing Chromium's system shared libraries. `.playwright-libs/root`
// is a local, gitignored extraction of just those .deb packages, done
// without root/apt — see PROGRESS.md's environment note.
//
// Only inject it when `ldd` actually reports missing libraries. The overlay
// was built from Ubuntu Noble and needs GLIBC 2.38; on Jammy/WSL (2.35) it
// breaks a Chromium that would otherwise launch against the system libs.
export function applyLocalPlaywrightLibsIfNeeded(projectRoot) {
  const localLibs = resolve(projectRoot, '.playwright-libs/root/usr/lib/x86_64-linux-gnu');
  const browsersRoot = process.env.PLAYWRIGHT_BROWSERS_PATH;
  let chromeBinary;
  if (browsersRoot && existsSync(browsersRoot)) {
    for (const dir of readdirSync(browsersRoot)) {
      const candidate = resolve(
        browsersRoot,
        dir,
        'chrome-headless-shell-linux64/chrome-headless-shell',
      );
      if (existsSync(candidate)) {
        chromeBinary = candidate;
        break;
      }
    }
  }

  let hostMissingChromeLibs = true;
  if (chromeBinary) {
    try {
      hostMissingChromeLibs = execFileSync('ldd', [chromeBinary], {
        encoding: 'utf8',
      }).includes('not found');
    } catch {
      hostMissingChromeLibs = true;
    }
  }

  if (existsSync(localLibs) && hostMissingChromeLibs) {
    process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
      ? `${localLibs}:${process.env.LD_LIBRARY_PATH}`
      : localLibs;
  }
}
