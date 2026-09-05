# Nocturne — director's pass

Implemented locally on `codex/nocturne-directors-pass`. Baseline checkpoint
`49ddb72` preserves every inherited source change, including the untracked
neighborhood, street-wear, wind and weather-analyzer modules. Composition and
materials are in `40208f2`; rain and landing-height refinements are in `9034f4a`.
Nothing was pushed or deployed. Original reference and sign-off images remain
unchanged.

Open the [comparison gallery](screenshots/nocturne/index.html) for baseline/final
frames at desktop (1920×1080), laptop (1366×768), portrait (390×844), and
ultrawide (2560×1080), in rain and clear weather. Each pair includes grayscale
and thumbnail views. Full frames use the same particle seed and four seconds
of fixed simulation; these controls exist only in the review script.

The retained changes are:

- Cool reflected color on the lighter trunk and major-branch materials, plus
  a little bicycle-frame fill. Scars and dark limbs retain their depth. Existing
  inner-canopy colors recede more, with the silhouette, spray placement and
  airy gaps preserved.
- Cool, more transparent glazing over separate interior illumination and the
  existing shelf/counter silhouettes. Glass no longer casts an opaque box
  shadow into the recess. The secondary pane reads cooler and less brown;
  the broad wet plaster face is slightly quieter.
- Three existing cloud silhouettes now have uneven curved profiles, including
  their portrait-visible sides. Both hill profiles have shorter irregular
  segments, and the added rooftops sit closer to the distant palette.
- The sidewalk ends at z=3.14, exposing the existing curb and drain. Covers are
  narrower and darker; asphalt repairs move two units toward the corrected
  edge. Two existing wet fragments now sit on the asphalt near the edge of
  the shop spill, leaving most of the road dark. Petal landing boundaries
  follow the corrected paving, curb and drain.
- Nearby rain is slightly smaller and dense-rain opacity changes from 0.22
  to 0.20. Bulb drops retain their eight-sided, rounded-base shape and eight
  slots in the 96-drop dense-rain budget. Falling-petal pink, release timing,
  sway, interaction limits and settled-memory capacity remain intact.

The [shadow study](screenshots/nocturne/shadow-study.png) compares the baseline,
quieter wall with the inherited custom shadow, actual blossom silhouettes,
and a broader-lobed custom shadow candidate. The custom variants did not
show enough improvement in connected shapes/openings to retain. The final
uses the visible blossom geometry for shadows, preserving branch direction
and removing the extra depth attribute and shader customization. The shadow
remains deliberately graphic. The wet street fragments are intentionally
faint, especially in portrait. No camera adjustment was needed to retain the
crown and bicycle. No props, lights, effects or dependencies were added.

Verification completed:

- Production build; the existing large-chunk advisory remains (647.50 kB JS).
- Weather analyzer: 180 simulated seconds for clear, wet, rain, dash, pixel
  and invalid-mode fallback; finite transforms and fixed particle capacities.
- Sway, response and interaction analyzers in both clear and rain modes.
  Maximum reported neighboring-spray drift is 0.0603 world units; response
  peaks at the 0.022-radian cap. The five-minute interaction run peaks at
  13/20 falling petals, 8/8 interactive petals and 9/9 queued releases,
  returns to no interactive backlog and preserves all 34 authored petals.
- Live desktop canopy tap/miss, ten repeated taps, portrait touch, flight and
  settling captures; eight sway/rain samples over fourteen seconds. See the
  motion boards in the gallery; full source frames are alongside them.
- Rain/clear composition, material crops, grayscale and thumbnails reviewed
  in all four aspect ratios. Whitespace check passed.

Performance on this device (Intel UHD Graphics, ANGLE/D3D11, Chrome
152.0.7977.77) stayed at approximately 16.66 ms / 60 fps across all eight
viewport/weather combinations. Three valid trials per combination were
compared with `49ddb72`; incomplete browser samples were discarded and
repeated. The largest median-p95 increase was 7.5% (laptop rain, 17.4 to
18.7 ms), below the 10% investigation threshold. Rain draw calls fell from
700 to 693 on desktop/laptop, 634 to 631 in portrait, and 699 to 692 on
ultrawide. Clear draw calls fell by three in every view. These measurements
are vsync-limited and do not establish uncapped GPU headroom. Raw trials and
the [comparison summary](screenshots/nocturne/performance-comparison.json)
are preserved beside the frames. Run `node scripts/compare-nocturne-performance.mjs`
to validate complete, same-device trials and the 10% regression threshold.

Reproduce captures in PowerShell with `node scripts/review-nocturne.mjs`.
Set `REVIEW_LABEL=baseline` and `REVIEW_REF=49ddb72` for the checkpoint; remove
`REVIEW_REF` and use `REVIEW_LABEL=final` for the working scene. The script
serves a temporary local Vite instance and closes it afterward. Set
`REVIEW_PERF=1` for three live-animation trials per viewport/weather, with four
seconds of warm-up and six seconds of measurement. Incomplete samples retry;
`REVIEW_RESUME=1` reuses valid measurements from the same source. Remove these
performance flags before capturing stills. `python scripts/review-nocturne-images.py`
rebuilds the gallery and boards using the already available Pillow installation.
