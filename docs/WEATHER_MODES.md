# Nocturne — quiet weather choices

Implemented on `codex/nocturne-weather-modes`, starting from everyday-detail
checkpoint `7dbae2c`. The completed everyday pass is preserved on its own
branch. `nocturne-canonical`, previous captures, camera settings, lighting
values, canopy and petal behavior remain unchanged.

Tap the bottom-right dot to choose weather. It has a 44px touch target and
opens a small labeled panel. Weather changes fade out for 180ms, reload at
the same camera and fade in for 250ms after textures and the first rendered
frame are ready. Petals and motion restart. The URL stores the state, preserves
unrelated parameters/hash and supports Back/Forward.

| Choice | URL | Result |
|---|---|---|
| Rain | `?weather=rain` | Existing rainy evening; default and invalid-value fallback. |
| After rain | `?weather=wet` | Existing damp evening without falling rain. Optional Firefly checkbox. |
| Clear | `?weather=clear` | Existing warm daylight. |
| Snow | `?weather=snow` | Cool damp evening, pink tree, gentle spring flurry and two tiny deposits. |

Firefly is off by default. `?weather=wet&firefly=1` enables one muted olive-gold
point near the tree-base vegetation. Its smoothly eased glows last 1.9–3.2
seconds, separated by deterministic irregular 6–12-second dark intervals.
The preference survives weather changes but the insect is only present in
After rain. There is no point light, bloom, trail, additive glow or lightning.
Frame review moved its path 0.6 world units forward onto clearer pavement;
size, tint, brightness and timing stayed unchanged. A lossless peak frame is
included because video compression can erase this roughly one-pixel accent.

Reduced motion hides flakes and the firefly and removes the interface fades,
including when the preference changes live. Static snow deposits remain.
The scene's previously accepted tree/hearth/petal animation is preserved.

## Retained visual additions

- One 0.78 × 0.54 × 0.085 matte maintenance hatch rests on the right shop roof.
  Its shallow darker base and nearly roof-colored lid add depth without a new
  cast shadow or obstruction of the rear building. Portrait crops it naturally.
- Snow is one fixed pool of 64 tiny non-additive, depth-tested flakes, with
  speeds 0.45–0.8 world units/second and mild individual drift. Construction
  bounds and padded canopy/trunk bounds are collected once; flakes recycle
  before entering them or crossing the ground. No accumulation simulation.
- Exactly two small irregular paper-thin deposits: one on the new hatch and
  one next to the near-left roof vent. No white canopy, ground blanket or
  additional roof deposits.
- Snow inherits damp materials and the existing cool lighting. Rain streaks,
  splashes, roof/wire drips and downspout water are absent. The hearth stays;
  moths are absent in Snow. Pink petals keep their existing behavior.

All new geometry uses existing Three.js capabilities. No dependencies,
external assets, lights or changes to existing particle limits were added.
The three existing everyday PNG textures remain locally bundled.

## Verification and evidence

[Comparison gallery](../screenshots/nocturne-weather/index.html): all four weather
states across desktop, laptop, portrait and ultrawide, with baseline/final,
grayscale, thumbnails and hatch crops. The Snow baseline is After rain, whose
appearance it inherits. Fixed-time review resets the liquid-weather RNG and
waits for local textures. Product rendering retains its normal clock/RNG.

The hatch preserves the pole shadow and rear roof silhouette. At thumbnail
size the canopy and warm window remain dominant. The deposits are intentionally
hard to distinguish at small sizes. No visual changes to lights, framing or
exposure were used to make details more visible.

- Build passes with the pre-existing Three.js chunk-size advisory.
- Existing sway, interaction, response and weather analyzers complete/pass.
- Snow analyzer passes 180 seconds at 24, 60 and 120 Hz, checking finite
  transforms, capacity, bounds and construction/canopy/ground interception.
- All 12 [browser controls checks](../screenshots/nocturne-weather/controls-checks.json)
  pass: texture readiness, keyboard/focus, current choice, touch, dismissal
  without petal release, URL preservation, rapid selection, history,
  firefly eligibility and live reduced motion.

[Snow recording](../screenshots/nocturne-weather/temporal/snow-65s.mp4) contains
65 seconds of normal playback; 3,899 rendered frames, no visibility
interruptions, and unchanged camera matrices/light positions. Full-scene
telemetry confirms 64 flakes and 155 static collision bounds, including
observed construction and canopy interception.

[Firefly recording](../screenshots/nocturne-weather/temporal/firefly-65s.mp4) and
peak-glow frame crops document the optional accent. Compressed telemetry and
sampled frame boards accompany both videos; raw WebMs/telemetry remain local.

[Same-device performance comparisons](../screenshots/nocturne-weather/performance-comparison.json)
cover the four viewport sizes and five cases (three original modes, Snow,
and After rain with the firefly) in Chrome 152 on Intel UHD graphics. Final
case means/medians stay at 16.64–16.70 ms per rendered frame. The largest
increase is 0.11% in mean frame time and 9.57% in p95; no remaining comparison
exceeds the 10% investigation threshold. Snow and firefly use After rain as
their baseline. The hatch adds two visible draws outside portrait; the
firefly adds one during glows. Snow has a net increase of one draw outside
portrait because liquid effects and moths are omitted.

Four noisy cases were expanded to three alternating baseline/candidate pairs
and compared by medians. Samples with fewer than 60 frames were rerun.
Earlier raw samples, including multi-second scheduling pauses, are retained
in `performance-initial-samples.json` and `performance-prevalidation-samples.json`.
These vsync-limited browser measurements do not establish spare GPU capacity
or performance on other devices. The separate uninterrupted recordings
average 16.67 ms/frame for Snow and 16.66 ms/frame for the firefly.

**Recordings and sampled-frame inspection were completed. Continuous visual
playback review was unavailable.** Still samples cannot certify every brief
intersection, cadence artifact or shimmer event. No physical-display viewing
is claimed.

## Reproduction

Use `npm run build`, `npm run analyze:weather`, `npm run analyze:snow` and
`npm run check:weather-controls` alongside existing scene analyzers.
`scripts/review-weather-modes.mjs` writes isolated captures; set
`REVIEW_REF=7dbae2c` and `REVIEW_LABEL=baseline` for the prior state, or unset
the ref and use `REVIEW_LABEL=final`. `review-weather-images.py` builds the
gallery. The recording/analysis and performance scripts are separately named
`capture-weather-temporal.mjs`, `analyze-weather-temporal.py`, and
`measure-weather-performance.mjs`.

No changes were merged into `main` and no deployment is included.
