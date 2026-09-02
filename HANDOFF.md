# Grok Creative Playground Handoff

## Visual thesis

The rainy corner should read as cool air, one living sakura, and one dry
warm shop, with weather continuing past the frame. The overnight neighborhood
pass found useful ingredients and then over-built the world. This stop is a
hierarchy edit: remove the demo beat, quiet the background, and stop adding
places.

## Strongest result

Default rain after the sign-off correction. Compare against the frozen
hierarchy-pass frames.

Sign-off frames:

- `screenshots/signoff-desktop.png`
- `screenshots/signoff-portrait.png`
- `screenshots/signoff-ultrawide.png`
- `screenshots/signoff-laptop.png`
- `screenshots/signoff-clear-desktop.png`

Hierarchy-pass freeze:

- `screenshots/hierarchy-pass-desktop.png`
- `screenshots/hierarchy-pass-portrait.png`
- `screenshots/hierarchy-pass-ultrawide.png`
- `screenshots/hierarchy-pass-laptop.png`
- `screenshots/hierarchy-pass-clear-desktop.png`

## Experiments attempted

Lightning was removed entirely rather than dimmed. A 10-second rain capture
has no pale bolt pixels and the brightest upper-frame samples stay in the
blossom range, not a flash.

Storm massing went from nine countable puffs, through a full-width cropped
lid, to three left-weighted puffs: two as a lower step behind roofs, one
quieter continuation that stays left of the crown. No lightning. No extra
puff row.

Mountains lost snow and forest icons. Peak count dropped and the ridge behind
the tree is a saddle, not a triangle sitting in the canopy.

Left side lost shrine trees, a balcony fragment, a street bush, and then the
remaining cube grove. The bicycle and the far hearth stayed.

Clear-weather pole and wire got dedicated materials. Placement did not move.

## Weather / atmosphere treatment

Rain remains the default. `createRainClouds()` returns `null` in clear mode.
No lightning geometry, no flash light, no capture-script force flag.

Storm materials are step `0x10161c` and retreat `0x1a232b`, `fog: false`.
Three puffs share origin `[-22.4, 9.7, -15.2]`. The span that used to cross
the sakura was removed so portrait sky to the right of the mass stays open.

Portrait row samples at y=90: cloud through x=240, sky from x=270. Hierarchy
pass at the same row was cloud across the full 390px. Crown row y=190 is sky.

Wet atmosphere values in `src/config.js` were not retuned.

Clear sky at (960, 80) samples `148,150,160`. Rain at the same pixel is
`18,27,33`. No leftover storm boxes in clear.

## Environment and storytelling changes

Mountains remain as two long, low ridges in `createDistantHills.js`. Wet
colors `0x161e24` / `0x1c2830` with existing scene fog. No snow. No slope
trees. Highest remaining bump is 1.9 world units, shifted left of the sakura
so it does not read as a peak growing out of the crown.

The shrine is no longer a precinct. `createFarLeftShrineHint.js` keeps a dark
hall and a flat roof. Torii, fence, lantern, pebbles, and the two shrine
grove trees are gone. It should not parse as a shrine on first glance. If
it reads as anything, it is another dark volume at the end of the street.

Grove volumes are gone. Far-left street interior glow stays off. One small
warm note on the left is the sleep-app hearth.

Near-right pole, crossarm, and insulators stay. One street-side wire remains.
Start `[6.57, 8.48, -1.02]`, end `[-12.4, 8.42, -3.2]`, slack `0.12`.
Geometry did not move. Clear-only materials: pole `0x6c6862`, wire `0x7a7670`.
Rain still uses the previous dark utility values. Clear wire at `(860, 36)`
went from `27,17,11` to `114,81,57`.

Bicycle still uses the old `wire` material for rims. Shop metal is unchanged.

## Sakura, petals, and interaction changes

None. Tree structure, five-lobed blossoms, passive petals, and the bounded
interaction path were not opened.

## Exact tuning values

Storm origin `[-22.4, 9.7, -15.2]` with three puffs. Left step heights 4.4 and
4.1. Retreat height 2.5, offset `[5.4, 1.35, -0.45]`.

Hill far profile peaks: 1.55, 1.9, 1.15, 1.4, 0.9. Near: 1.2, 1.5, 0.95, 1.15.
Positions unchanged: far `(-0.6, 0.04, -18.6)`, near `(0.4, 0, -16.4)`.

Wire slack 0.12. Pole top `(6.15, 8.72, -1.05)`. Crossarm y=8.38.

Camera, pixel size, shop light, and wet sky/haze are the previous values.

## Files changed or added

- `src/scene/createRainClouds.js`
- `src/scene/createDistantHills.js`
- `src/scene/createFarLeftShrineHint.js`
- `src/scene/createLeftHorizonFill.js`
- `src/scene/createLeftBackgroundExtension.js`
- `src/scene/createEnvironment.js`
- `src/main.js` (lightning update already removed earlier in this lane)
- `scripts/capture-scene.mjs` (later rain frame, 10s rain frame, clear desktop)
- `PROGRESS.md`
- `HANDOFF.md`

No new dependencies. No parent production edits.

## Visual evidence

- Sign-off rain desktop / portrait / ultrawide / laptop: `screenshots/signoff-*.png`
- Sign-off clear: `screenshots/signoff-clear-desktop.png`
- Hierarchy-pass freeze for comparison: `screenshots/hierarchy-pass-*.png`
- Earlier rain baseline: `screenshots/hierarchy-before-desktop.png`
- Accepted clear reference: `screenshots/hierarchy-reference-clear-desktop.png`

10s pale-bolt count in the upper frame was 0. Brightest samples at 1.8s, 3.6s,
and 10s all sit on the canopy around `(731, 202)` in the 90s RGB, not a
white flash.

## Performance and stability

Storm puff count dropped. Lightning point light is gone. Capture ran clean
after restoring the `THREE` import on the shrine hint. Official viewports
plus the extra hierarchy frames completed without page errors.

## Checks performed

- `npm run build` (chunk-size advisory only)
- `npm run capture` including 10s rain and `?weather=clear`
- Desktop luminance hunt for pale bolts, snow-like pixels, and saturated
  mountain green: all 0 on the rain hero frame
- Tree interaction analyzers were not rerun. That code was not touched.

## Integration map for Sol

### Keep directly

- Default rain with no lightning
- High cropped storm, now left-weighted rather than a spanning lid
- Shop window / door / light pool, sakura, bicycle, near-right pole
- Clear comparison path

### Reinterpret conservatively

- Distant ridges. They still exist, but they should stay this quiet or
  quieter. Do not put snow or tree icons back.
- The leftover shrine hall. It is already only a dark box. Could vanish
  entirely if the street still reads as continuing.

### Leave in the sandbox

- The old lightning bolt and flash
- Mountain forest patches and snow caps
- Readable shrine precinct
- Extra left balcony, bush, and grove count
- Capture-script lightning forcing

## Known regressions / unresolved questions

The storm is still boxes. Portrait no longer has a full-width black band at
y=90. The right side of that row is sky. A viewer can still see a dark
stepped mass on the left. That is the remaining weather object, not a second
pass of puffs.

Clear pole and wire are lighter but still graphic. They should stay visible.

Left street still has box houses and earth banks. Those are neighborhood
continuation, not replacement trees.

Hills nearly disappear in clear haze. Wet ground, drains, and shop-wall
history were not touched.

## Suggested next move

Director sign-off, then checkpoint commit. After that, wet-ground and
shop-wall history. Do not reopen mountains, shrine, lightning, tree, or shop
light.
