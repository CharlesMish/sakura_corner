# Playground Progress

## Canonical freeze and temporal evidence — 2026-09-05

The user froze `d5f1102` as the canonical camera and visual state, now tagged
`nocturne-canonical`. No scene source changed. Recorded an uninterrupted
65-second live run and preserved its camera manifest, video and measurements.
Continuous visual viewing and physical-display sign-off were unavailable and
remain unverified; sampled frames/telemetry are not claimed as a substitute.
See [CANONICAL_REFERENCE.md](CANONICAL_REFERENCE.md). Earlier permission for
a beauty pass is superseded by this freeze and the six temporal checks.

## Nocturne director's pass — 2026-09-05

The broader director's pass supersedes the historical composition freezes and
three-change limit below. Baseline checkpoint `49ddb72` includes all inherited
source improvements. Local branch: `codex/nocturne-directors-pass`.

Materials, glazing, cloud/hill profiles and the sidewalk/curb/drain connection
are refined. The special foliage shadow was removed after comparison; visible
blossoms now supply their own shadow. Rain accents are slightly smaller and
quieter. Camera, lights, props, particle budgets and interaction choreography
remain intact. See [the handoff](NOCTURNE_DIRECTORS_PASS.md) and
[comparison gallery](screenshots/nocturne/index.html) for retained changes,
tradeoffs, validation and measurements. Work remains local, with no deployment.

## Still-frame finishing — 2026-09-05

Applied the three agreed adjustments without moving the camera, visible
geometry, lights, or road treatment:

- Blossom shadows use a dedicated depth material with a less scalloped outline.
  Each flower's planar shadow area is normalized to its original area; visible
  vertices, branch shadows, wall materials and lighting are unchanged. This is
  active only in wet weather and follows the existing instanced sway.
- Muted tones in the two interior infill zones have 18% less emissive fill.
  Light/highlight tones, outer zones and falling/settled petals are unchanged.
- Rain size/contrast now interpolates smoothly by actual camera distance
  (14–32 world units), including portrait. Far scale is 0.58 and far brightness
  0.42; near settings, counts and tapered-drop proportions remain intact.

Build, weather, response, sway, interaction and whitespace checks pass.
Fresh four-aspect rain and clear captures use `finish-after-`; comparison rain
frames use `finish-before-`. The sampled upper-wall region (desktop x1110–1290,
y400–510) measured mean luminance 68.14 before / 68.60 after on a 0–255 scale:
no overall darkening, with differences also including non-deterministic rain
and capture timing. Wall brightness controls were not changed. Rendered draw
counts remain 700 desktop / 634 portrait. No new lights or scenery.

## Falling color and rain accents — 2026-09-05

Falling wet-weather blossoms now use the luminous canopy palette and a pale
pink emission instead of the old red fill. Settled petals and clear-weather
materials retain their existing treatment. Passive and interactive releases
share the corrected palette without changing RNG consumption or motion.

Eight percent of rain instances are now small, eight-sided tapered drops with
rounded bases, sharing streak opacity, depth variation and wind. They replace
streak slots rather than increasing population (8 accents in default dense
rain). This adds one instanced draw. Build and weather/interaction checks pass;
the weather analyzer now verifies the combined streak/accent capacity.
Fresh weather and tap/settling captures use `falling-refined-`.

## Neighborhood and street wear — 2026-09-05

Added a quiet second row of rooflines, small chimney/vent/aerial details, and
two dim panes on an existing background facade. Added static, batched sidewalk
cracks, subtle repairs, paint chips, moss at seams, and exposed asphalt repairs.
The luminous tree, camera, lights, weather and interaction remain as accepted.
New comparison captures use `lived-in-` and final captures `lived-in-final-`.
Build and whitespace checks pass; rain/clear and four aspect ratios reviewed.
The additions use eight batched meshes (12 additional rendered draws with
double-sided transparent wear), with no extra lights or per-frame updates.

## Luminous refinement — 2026-09-05

The user authorized a broader art pass, superseding the previous composition
freeze: dreamier pink/cyan lighting, layered cloud silhouettes and distant
ground, portrait framing, shared wind, gentler local response, and pooled rain
contacts. See `LUMINOUS_REFINEMENT.md` for the implementation and validation.
The older milestone notes below are historical. Original sign-off and reference
images remain untouched; new captures use `luminous-before-` / `luminous-final-`.

## Baseline

Snapshot created from the accepted production scene on 2026-08-30, immediately
after the first production click/tap blossom-choreography integration. See
`ROOT_BASELINE_PROGRESS.md` for the exact inherited implementation and checks.

The production parent is intentionally untouched by work in this folder.

## Current milestone

Rain-contact material-memory candidate on `grok/rain-contact`, started from
frozen hierarchy checkpoint `4980851`.

The extra idea is "rain has been touching this place for a while." Wet-only
camera cheats at the existing shop-light pool, the downspout shoe, and the
shop base. No new scenery, no wet-everywhere pass, no petal architecture
change.

Open `http://127.0.0.1:5177/` or `/?weather=rain`. Clear is `/?weather=clear`.

Stopped for director visual audit. Do not commit.

## What remains

- Director sign-off of `screenshots/rain-contact-*.png` versus
  `screenshots/signoff-*.png`.
- The storm is still box grammar. That parent is frozen.
- Hearth and moths stay named for a later mixer hook.

## Known baseline notes

- Existing interaction and passive petals are bounded and regression-tested.
  They were not reopened for this pass.
- The signed-off clear composition should remain available for comparison.
- The known Vite/Three.js chunk-size advisory is non-blocking.
- Linked dependencies must not be installed, updated, or removed.
