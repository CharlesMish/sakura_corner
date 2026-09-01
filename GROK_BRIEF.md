# Grok Creative Direction — Richer World / Weather Study

## Why this lane exists

The current production scene is liked. Its tree, five-lobed blossoms, storefront
light, quiet neighborhood framing, passive petals, and initial click/tap response
are a strong base. The next question is not whether those decisions were wrong;
it is what a more adventurous artist-engineer sees when given room to push the
scene farther.

The desired leap is:

> a lovely small vignette

to

> a tiny place with weather, atmosphere, material history, and a life beyond the frame

This is a creative study, not a production merge. Bold experiments are welcome.

## Central artistic constraint

The mature sakura remains the emotional and visual star. The environment may
become richer, wetter, deeper, stranger, or more specific, but it should make the
tree feel more precious—not bury it beneath effects and props.

Retain the work's identity:

- fixed, authored camera rather than navigation;
- real 3D rendered as a crisp pixelated illustration;
- ordinary Japanese urban-commercial edge without real branding;
- quiet, warm, slightly nostalgic emotional register;
- restrained geometry and readable value hierarchy;
- five-lobed sakura blossom language;
- no game HUD, quests, characters, traffic, or asset-pack street clutter.

Within this lane, implementation details and local composition choices are open
to challenge if the screenshots justify them.

## The strongest invitation: weather as art direction

Explore one coherent weather idea rather than a generic weather menu. Rain or a
just-after-rain state is particularly promising because it can change the whole
image through a small vocabulary:

- cool ambient air against the warm shop interior;
- wet road and pavement value shifts;
- selective, low-resolution reflections rather than mirror surfaces;
- rain streaks visible primarily against suitable depth/value planes;
- gutter, curb, drain, wire, leaf, and blossom responses;
- altered petal motion and occasional petals adhering to wet ground;
- softer distance separation without using fog to hide unfinished scenery;
- tiny puddle or runoff cues where the existing geometry already suggests them.

Do not feel obligated to implement every item. A convincing material/lighting
transformation is more valuable than thousands of rain particles. Heavy bloom,
screen-filling mist, uniform gloss, and a neon cyberpunk conversion would miss
the scene.

If weather is implemented, keep an easy clear-weather comparison—preferably a
single config mode or development query parameter rather than visible UI. One
excellent rainy state is enough; do not build a general climate engine.

## Other fertile directions

Weather is encouraged, not a prison. You may also explore:

### Neighborhood specificity

Make the existing footprint feel more used and connected through camera-specific
architecture, thresholds, drainage logic, partial rooms, utility runs, roof
edges, service spaces, or carefully chosen story details. Do not construct an
explorable district or add a competing hero prop.

### Light and depth

Strengthen the conversation between the blossom crown, approaching evening,
storefront interior, atmosphere, and layered buildings. Preserve shadow contact
and depth. Avoid flattening everything into uniform pastel fill.

### Sakura/environment relationship

Let blossoms affect more than the emitter area: catch on ledges, collect near
drains, cross depth planes, respond differently in rain, or briefly cling to
surfaces. Tree interaction may be retuned, but it need not become louder.

### Camera-authored detail

Use false fronts, cropped silhouettes, incomplete geometry, projected reflection
cards, and other camera-specific cheats freely. This is an illustration, not a
simulation of an entire city.

## Creative freedom and limits

Allowed inside this sandbox:

- substantial material, lighting, atmosphere, and weather experiments;
- new procedural geometry or shader work;
- rearranging or replacing local background details;
- a clearly labeled camera comparison variant;
- development-only query flags or diagnostics that never appear as finished UI;
- one or more checkpoints/commits while discovering the final direction.

Not allowed:

- editing files outside this directory;
- pushing or publishing;
- installing or updating packages through the linked `node_modules`;
- real store branding or recognizable trade dress;
- random downloaded model/texture packs;
- characters, vehicles, gameplay, menus, audio, or free camera controls;
- using fog, darkness, bloom, or rain density to conceal world gaps;
- unbounded particles or per-frame allocation storms.

If an original external asset is truly essential, place it under `assets/`, keep
it small, and document its exact provenance/license in `HANDOFF.md`. Code-native
and procedural solutions are preferred.

## Working method

1. Inspect `reference/` and run the current scene.
2. Before major edits, write a concise visual thesis in `DESIGN.md`: what the
   viewer should feel, what changes, and what remains quiet.
3. Make a baseline capture if possible. Never overwrite `reference/`.
4. Iterate in screenshots. Judge the whole image at desktop first, then laptop
   and portrait.
5. Remove experiments that do not strengthen the thesis. More code is not a
   measure of success.
6. Keep art-direction controls discoverable in `src/config.js` when practical.
7. Run syntax checks, existing analyzers, captures, and `npm run build`.
8. Complete `HANDOFF.md` and update `PROGRESS.md` before stopping.

## Minimum handoff evidence

Preserve at least:

- one baseline desktop capture;
- one strongest candidate desktop capture;
- one tree-detail capture;
- one portrait capture;
- one weather-in-motion or interaction sequence if those systems changed;
- any image that exposes a known regression honestly.

The handoff must separate:

- ideas worth integrating directly;
- ideas worth reinterpreting more conservatively;
- experiments that should stay in the sandbox.

Do not assume the complete lane will be merged wholesale.

