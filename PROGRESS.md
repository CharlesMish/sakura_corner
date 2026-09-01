# Playground Progress

## Baseline

Snapshot created from the accepted production scene on 2026-08-30, immediately
after the first production click/tap blossom-choreography integration. See
`ROOT_BASELINE_PROGRESS.md` for the exact inherited implementation and checks.

The production parent is intentionally untouched by work in this folder.

## Current milestone

Rain is the default playground scene and is being tuned as a Nocturne Onsen
candidate: cooler cyan air, sakura pink, shop gold, a far hearth, and a few
moths. Open `http://127.0.0.1:5177/` or `/?weather=rain`. Clear is `/?weather=clear`.

## What remains

- Keep rain readable: blockier drops, puddles that catch light, neighborhood
  still visible through the cool air.
- Flesh camera-cropped street and roof detail without competing with the tree.
- Keep hearth/moths named for a later mixer hook. Do not build the mixer here.
- Complete `HANDOFF.md` when a rain candidate is worth sending back to WSL.

## Known baseline notes

- Existing interaction and passive petals are bounded and regression-tested.
- The accepted clear composition should remain available for comparison.
- The known Vite/Three.js chunk-size advisory is non-blocking.
- Linked dependencies must not be installed, updated, or removed.

