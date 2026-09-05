# Project Progress

## Current milestone

Production tree interaction is complete. The accepted neighborhood composition and passive scene remain intact; click/tap on the blossom crown now creates a restrained five-lobed blossom peel, a small local crown response, and bounded ground memory.

## Production interaction

- One Pointer Events path handles mouse and touch. Only the visible blossom crown responds; trunk, store, road, and sky do not.
- Targeting follows the 189 live canopy clusters through their existing sway, rather than using a broad manual tree hitbox. The petal release point is the nearby cluster center, avoiding inflated-sphere surface pops.
- A successful gesture peels an authored cluster of 5–7 five-lobed blossoms over `0.28s`. Seven shuffled flight profiles provide close falls, lateral crossings, delayed lifts, depth travel, and varied tumble.
- Rapid input is deliberately restrained through a `0.9s` full-strength gap, token/diminishing-return budget, maximum 8 live interactive blossoms, maximum 9 queued releases, and a 6-slot passive reserve.
- Interactive releases use seed `4217`, separate from the established passive seed. Interaction therefore does not perturb passive timing or paths.
- Interactive blossoms use the existing dynamic settled-petal ring only. The 34 authored story petals remain protected and old dynamic petals recycle at the existing cap.
- A touched crown zone receives a short damped rustle and shares a smaller delayed response with one neighboring zone. The hard additive rotation cap is `0.022` radians; the trunk and branch gesture are unchanged.
- No hover reaction, UI, debug global, free camera, trunk shake, weather, or persistence was added.

## Preserved artwork and systems

- Fixed responsive three-quarter composition and crisp low-resolution render/upscale pipeline.
- Willowy hierarchical sakura, instanced five-lobed blossom brushes, accepted canopy silhouette, and passive multi-zone sway.
- Accepted storefront/light, clear-weather atmospheric depth, layered neighborhood geometry, road/sidewalk, utility framing, and environmental details.
- Existing bounded passive airborne blossoms and authored/dynamic settled-petal populations.

## Important tuning locations

- `src/config.js` → `ART_DIRECTION.interaction`: master interaction switch.
- `src/config.js` → `ART_DIRECTION.treeResponse`: cooldown, hit radius, damping, neighbor share, and rotation limits.
- `src/config.js` → `ART_DIRECTION.petals.interactive`: count, cooldown, token refill, caps, origin bounds, cluster timing, impulse, and landing-attractor chance.
- `src/config.js` → `ART_DIRECTION.petals.rosyFill`: falling-blossom visibility (`0.29` after capture review).
- `src/interaction/createTreeInteraction.js`: canopy-cluster targeting and the single pointer-input policy.
- `src/scene/createPetalSystem.js`: authored flight profiles, cluster planner, queue/caps, separate RNG, and bounded settling.
- `src/scene/createSakuraTree.js`: localized damped response layered over passive sway.
- `src/main.js`: one integration callback combining release direction, petal choreography, and local tree response.

## Visual validation

- Clean six-viewport captures completed without page/console errors: desktop, laptop, ultrawide, annotation aspect, tree detail, and portrait.
- Interaction captures cover desktop before/release/peel/midflight/settled/repeated input and portrait before/release/peel.
- Clean before-input frames preserve the accepted composition.
- Release and peel frames stay localized to the selected crown region and show discrete dark-rose blossoms rather than a merged emitter clump.
- Repeated-input captures remain restrained rather than turning into a storm.
- Capture sets live in `screenshots/scene-*.png` and `screenshots/production-interaction-*.png`.

## Technical state

- JavaScript syntax checks pass across `src/` and `scripts/`.
- `npm run analyze:sway`: established maximum passive canopy drift remains `0.0674`.
- `npm run analyze:response`: peak rapid-input response `0.01929` radians, under the `0.022` cap; 180-second run stays finite and bounded.
- `npm run analyze:interaction`: peak 8/8 interactive and 6/9 queued under deliberate stress; all releases eventually drain to zero; transforms remain finite; all protected story petals remain unchanged.
- `npm run build` passes with Vite 8.2.2. The existing Three.js chunk-size advisory remains non-blocking.
- The workspace has no usable Git metadata, so no local milestone commit was possible.

## Known weaknesses / human review questions

- Is `rosyFill: 0.29` the right balance, or are airborne blossoms too conspicuous during a long idle?
- Does 5–7 blossoms feel satisfying on a live click/tap without reading as an effect burst?
- Is the local rustle discoverable enough in motion, or should it remain almost subliminal at the current amplitude?
- Does the `0.9s` full-strength gap feel gracefully restrained during repeated taps?
- Are newly settled interactive blossoms noticeable enough to create memory without making the pavement too pink?

## Suggested next bounded task

Perform a short human live-feel review on desktop and touch-width framing. If needed, make one conservative tuning pass limited to `rosyFill`, interaction count/cooldown, and local-response amplitude; do not reopen the tree, environment, or interaction architecture.

## Run locally

- `npm run dev` — local development server.
- `npm run capture` — regenerate the clean viewport set.
- `npm run capture:interaction` — regenerate click/tap choreography captures.
- `npm run analyze:interaction` — bounded population, RNG isolation, settling, and finite-transform checks.
- `npm run analyze:response` — local crown-response cap/stability check.
- `npm run analyze:sway` — passive canopy-motion continuity check.
- `npm run build` — production build.
