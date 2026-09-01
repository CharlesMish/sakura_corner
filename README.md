# Cursor / Grok Creative Playground

This is a self-contained creative snapshot of the accepted Urban Edge Sakura
Window production scene. It exists so Grok can explore boldly in Cursor without
touching `/home/cmish/sakura`, which remains Sol's production baseline.

## Open this folder in Cursor

Open only:

`/home/cmish/sakura/CURSOR_GROK_PLAYGROUND`

Then paste the contents of `CURSOR_PROMPT.md` into Grok. The complete creative
assignment is in `GROK_BRIEF.md`.

## Important isolation rules

- Edit only this directory. Do not edit its parent or the older collaborator
  lanes.
- `node_modules`, `.playwright-browsers`, and `.playwright-libs` are read-only-in-
  spirit links to the parent installation. Do not install, update, replace, or
  delete dependencies.
- `reference/` contains immutable accepted captures. Never overwrite them.
- This directory has its own local Git baseline. Commit meaningful experiments
  here if useful; never push.

## Commands

- `npm run dev` — local scene.
- `npm run capture` — six-viewport screenshot set.
- `npm run capture:interaction` — click/tap sequence.
- `npm run analyze:sway` — canopy continuity regression.
- `npm run analyze:response` — local tree-response stability.
- `npm run analyze:interaction` — petal population/RNG/settling stability.
- `npm run build` — production build.

Browser capture may require the host to permit a temporary localhost server.
The existing Three.js chunk-size warning is known and is not itself a defect.

## Returning the work

Leave the lane intact. Complete `HANDOFF.md`, update `PROGRESS.md`, preserve the
best comparison captures, and stop. Sol can then inspect the lane's Git diff and
selectively integrate ideas into production.

