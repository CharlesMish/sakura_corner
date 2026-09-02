# Grok Creative Playground Handoff

## Visual thesis

The frozen parent already says rain is falling through cool air. This pass
adds one more idea: rain has been touching this place for a while. The marks
are local and wet-only. They sit where the camera already looks.

Parent hierarchy/weather-enclosure checkpoint `4980851` is approved and
frozen. Do not reopen storm, hills, shrine, bicycle, pole placement, camera,
sakura, or shop light.

## Strongest result

Rain-contact candidate on `grok/rain-contact`. First glance should still be
sakura plus warm shop. Second glance: the existing shop-light pool catches on
wet pavement, the downspout shoe has a short runoff, and the shop base looks
lived-in.

Compare against the signed-off freeze, not against overnight neighborhood
frames.

## Retained rain-contact treatments

All of this lives in `src/scene/createRainContact.js`. It returns `null` in
clear weather. `createEnvironment()` adds the group only when wet.

1. Shop pool wet catch. Three camera-authored `MeshBasicMaterial` cards in
   the existing warm pool, not a second light and not a larger pool. Main
   card `[0.5, 0.01, 0.32]` at `[3.14, 0.042, -0.62]`, color `0xa07046`,
   opacity `0.3`. Two smaller interrupted cards at `[3.34, 0.04, -0.26]` and
   `[2.96, 0.041, -0.44]`, color `0x7e5636`, opacity `0.2`. Desktop sample at
   the main card went `106,87,64` to `140,103,66`. Window sample at
   `(1226, 694)` stayed `98,99,59`. Pool-region mean `97.4,79.1,59.9` to
   `101.0,80.5,59.5`.

2. One drainage path from the existing downspout shoe. Dark tint pad
   `[0.34, 0.016, 0.3]` at `[7.2, 0.028, -0.92]` plus a short seam
   `[0.08, 0.01, 0.44]` at `[7.16, 0.024, -0.55]`, color `0x1a2226`, opacity
   `0.3`. No new grate. No animated stream. Shoe-region mean `24.6,29.4,30.8`
   to `23.4,28.3,29.7`.

3. Shop-wall rain history. A darker base course on the existing storefront
   trim, `[2.15, 0.14, 0.03]` at `[3.28, 0.16, -1.445]`, and a low plaster
   band left of the window, `[0.95, 0.24, 0.03]` at `[1.72, 0.32, -1.61]`,
   color `0x2a2824`, opacity `0.2`. Lit left plaster sample `93,82,64` to
   `71,63,49`. Base sample `54,52,44` to `43,41,35`.

No animation on any of these marks.

## Experiments attempted and removed

Irregular `BufferGeometry` ground patches were invisible. Winding and
depth at `ndcZ ~ 0.993` swallowed them. Pixel samples at the projected
vertices did not move.

`MeshStandardMaterial` plates in the pool punched dark holes. A vertex at
`(1181, 879)` went `94,76,59` to `33,34,30` and the pool mean dropped from
`97` to `77`. Those plates were removed.

A long runoff toward the curb grate does not survive the hero frames. The
grate at `x=7.24, z=3.77` projects below the desktop, laptop, portrait, and
ultrawide crops. The path was shortened to the shoe and a near sidewalk
seam.

`MeshStandardMaterial` wall boxes fell into the building's own shadow and
read as black rectangles. Portrait plaster went `80,76,64` to `39,38,33`.
Wall history now uses the same transparent `MeshBasicMaterial` tint as the
ground cheats.

A downspout stain on the continuation wall was removed. That wall is already
near black (`0,2,4`), so the stain had no still-frame read.

## Optional petal treatment disposition

Skipped. `createPetalSystem.js` already flattens wet settled petals globally
(`settledTilt` `0.02`, `settledRoughness` `0.62`, lower emissive). A subset
that is more adhered only in the shop-contact zone would need new placement
or material branching. This pass does not require that, and the instruction
was to skip it if the change was not small and safe.

Authored story petals, interaction budgets, and landing architecture were
not opened.

## Weather / atmosphere treatment

Unchanged from the frozen parent. Rain remains the default. Clear is
`/?weather=clear`. Storm, fog, rain streaks, drips, and spout trickle are
the previous values. The existing trickle is still a tiny animated drop at
the shoe. The new runoff is a still-frame tint, not a second water system.

## Environment and storytelling changes

No new props, scenery, or civic infrastructure. Shop mass, window, door,
downspout geometry, curb, and grate layout did not move. Left side mean in
the desktop rain frame stayed `28.8,37.0,39.3`.

## Sakura, petals, and interaction changes

None.

## Exact tuning values

Camera, pixel size, shop light, and wet palette are the frozen parent
values. Light remains at `[3.25, 1.75, -1.25]`, wet intensity `9.1`.

Rain-contact cards use `MeshBasicMaterial`, `depthWrite: false`,
`receiveShadow: false`, `renderOrder: 2`.

## Files changed or added

- `src/scene/createRainContact.js`
- `src/scene/createEnvironment.js` (wires the wet-only group)
- `scripts/capture-scene.mjs` (rain-contact named frames, `CAPTURE_ONLY` filter)
- `PROGRESS.md`
- `HANDOFF.md`

No new dependencies. No parent production edits.

## Visual evidence

Signed-off checkpoint (do not replace):

- `screenshots/signoff-desktop.png`
- `screenshots/signoff-portrait.png`
- `screenshots/signoff-ultrawide.png`
- `screenshots/signoff-laptop.png`
- `screenshots/signoff-clear-desktop.png`

Local copies of that freeze: `screenshots/rain-contact-before-*.png`

This candidate:

- `screenshots/rain-contact-desktop.png`
- `screenshots/rain-contact-portrait.png`
- `screenshots/rain-contact-ultrawide.png`
- `screenshots/rain-contact-laptop.png`
- `screenshots/rain-contact-clear-desktop.png`
- `screenshots/rain-contact-detail.png` (shop wall, light pool, shoe/contact)

Official `scene-*.png` and hierarchy extra frames are also recaptured.

## Performance and stability

A handful of thin unlit cards. No extra lights, particles, or shadow casters.

## Checks performed

- `npm run build` (chunk-size advisory only)
- `npm run capture` including 10s rain and `?weather=clear`
- Desktop pixel samples versus `signoff-desktop.png` at the pool, shoe, wall,
  window, canopy, and left street
- Clear desktop pool/wall/shoe means matched the signed-off clear frame
- Tree interaction analyzers were not rerun. That code was not touched.

## Integration map for Sol

### Keep directly

- Frozen hierarchy/weather-enclosure composition
- Wet-only rain-contact cards if this candidate signs off

### Reinterpret conservatively

- The drainage path is shoe-to-near-pavement, not shoe-to-grate, because the
  grate is below the approved crops. Do not lengthen it just to "complete"
  the civic diagram.

### Leave in the sandbox

- Dark standard-material pool plates
- Full-length runoff to an off-frame grate
- Wall grunge maps, cracks, posters, extra pipes

## Known residual weaknesses

The curb grate on the downspout line is not in the hero frames, so a viewer
cannot see water arrive at a drain. The still-frame evidence is the shoe
contact and a short darker seam.

Wall history is a low band left of the window plus a darker base course. It
is not a weathered facade. The large plaster plane above the sill is still
mostly clean except for the tree shadow.

Pool catch is three small warm fragments, not a wet-mirror system. If a
director wants more "irregular wet surface," the next move is another
interrupted card in the same pool, not a roughness pass on the whole
sidewalk.

Portrait crops the downspout. Pool and left plaster band still read. The
plaster band is a low rectangle, not a full-height stripe.

## Suggested next move

Director visual audit of the rain-contact frames. Do not commit until that
passes. Do not reopen the frozen parent.
