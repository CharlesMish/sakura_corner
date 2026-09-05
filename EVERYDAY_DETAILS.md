# Nocturne — small signs of everyday life

User-authorized local decoration pass on `codex/nocturne-everyday-details`.
The user's motion assessment is accepted. This authorization supersedes the
older temporal-only restriction solely for the five detail groups below.
`nocturne-canonical` and all previous captures remain unchanged. No push or
deployment was performed.

All five groups survived still-frame review:

| Group | Retained treatment and practical visibility |
|---|---|
| Shop identity | Faded dark **こかげ商店** painted on the existing fascia. Existing dimensions, background, accent strip and illumination remain intact. Readable on closer desktop inspection; tiny in portrait. |
| Delivery notice | Same 0.27 × 0.35 footprint, aged paper, a heading, three short lines and a muted rule. The previous bright tab is replaced by the printed accent. No motion. |
| Bottle return | Narrow slatted crate, three matte opaque dark-green bottles and folded paper. Mostly hidden by the pole, beside the service-side wall. Narrowed after review to clear the entrance; moved forward along that wall when the narrower version became fully occluded. |
| Roof material history | Two felt laps, one small irregular repair and broad low-contrast wear with filtered grain on the near residence roof. Profile and vent unchanged. Subtle in rain, clearer in the daylight comparison. |
| Window plant | A dim shallow pot/stem/four-leaf silhouette between the existing opaque inset and the curtain/mullion fronts. Deliberately faint in rain; curtains and mullion obscure it. No window brightness change. |

Implementation lives in `src/scene/createEverydayDetails.js`, with one call in
each of the existing storefront and left-neighborhood constructors. The five
`Everyday:` groups are separately named. The notice reuses its backing and
replaces its former tab; reverting that group requires restoring the tab as
well as removing the helper call. Static crate pieces and plant pieces are
merged by material. No new shadow casters, lights, particles, animation, public
API, dependencies or remote asset requests were added.

Three locally bundled PNGs total about 24 KB. Japanese lettering is baked from
Windows Yu Gothic Medium by `scripts/bake-everyday-textures.py`; the browser
does not depend on any installed font. Re-baking requires the font and the
already-installed Pillow. Roof texture uses mipmaps, linear filtering and 4×
anisotropy; broad wear outweighs the subpixel grain. Bottles are opaque,
roughness 0.94, with no labels or glints.

Geometry review: crate bounds are x=5.954–6.266, outside the threshold's right
edge x=5.94 and just inside the side wall's x=6.275 face. Its bottom y=-0.018
sits on the sidewalk (top y=-0.02). The roof card lies 0.001 above the existing
top and adds no visible edge profile. Plant geometry is shallower than the
window layers and behind the curtain/mullion fronts. Sampled frames show no
new shadow acne or distracting highlights.

## Evidence

[Local comparison gallery](screenshots/nocturne-everyday/index.html) contains
canonical/final desktop, laptop, portrait and ultrawide in rain and clear,
grayscale, thumbnails, and each isolated group against canonical before the
combined result. Still comparisons use the existing review-only seeded RNG
and four-second fixed simulation, then wait for bundled textures and redraw.
Production uses its unchanged clock and randomness.

First impression at thumbnail size remains the pink tree, warm window and
street. The additions do not displace the bicycle, canopy or shop interior.
Portrait loses the tucked service objects and most of the residential detail;
this is accepted rather than compensated with lighting or framing changes.

[65-second normal-speed recording](screenshots/nocturne-everyday/temporal/detail-65s.mp4)
and [roof frame samples](screenshots/nocturne-everyday/temporal/roof-samples.png)
are separate from canonical evidence. The recording contains 3,551 rendered
frames and 65.008 seconds of scene time, with 60.411 integrated particle
seconds and no visibility interruptions. Camera matrices and light positions
did not change. Sampled frames show subdued roof detail without evident
grain breakup or bright bottle flashes.

The timestamp-preserving MP4 is 64.942 seconds, 960 × 540, with 3,441 encoded
frames (the native render buffer, displayed at 1920 × 1080 for recording).

**Recording and sampled-frame inspection were performed; continuous visual
playback review was unavailable.** The browser runtime reported no available
browser, so the repository's local Playwright/Chrome recording workflow was
used. The video preserves captured timestamps; cadence and continuous shimmer
perception cannot be certified from these still samples.

## Verification and reproduction

- `npm.cmd run build`: passes; existing large-chunk advisory remains.
- `analyze-canopy-sway.mjs`, `analyze-interaction.mjs`,
  `analyze-tree-response.mjs`, `analyze-weather.mjs`: pass/complete.
- `analyze-everyday-temporal.py`: duration, unchanged camera/light positions,
  finite recorded intervals and no visibility interruption verified.
- Frozen scene sources match `nocturne-canonical`; canonical documents and
  captures match the starting HEAD.

Capture: set `REVIEW_LABEL=baseline` and `REVIEW_REF=nocturne-canonical`, run
`node scripts/review-everyday.mjs`; unset `REVIEW_REF`, set `REVIEW_LABEL=final`
and rerun. `REVIEW_GROUP=identity|notice|crate|roof|plant` with
`REVIEW_ONLY=desktop` captures isolated details. Build the gallery with
`python scripts/review-everyday-images.py`.

Live recording: `node scripts/capture-everyday-temporal.mjs`; transcode the
WebM with timestamp passthrough and extract one frame per five seconds, then
run `python scripts/analyze-everyday-temporal.py`.

Performance uses `REVIEW_PERF=1` with the same baseline/final settings,
sequentially, followed by `node scripts/compare-everyday-performance.mjs`.
Three trials per viewport/weather, four-second warmup and six-second sample;
same device and browser. The 10% threshold is applied to both median mean
frame interval and median p95. Vsync limits inference about GPU headroom.

## Performance result

Intel UHD Graphics / Chrome, DPR 1, sequential local runs. The initial
[comparison](screenshots/nocturne-everyday/performance-comparison.json) passed
seven of eight cases: median mean changes ranged from -0.83% to +1.42%.
Draw calls increase by five (about 0.7%) on desktop/laptop/ultrawide and two
on portrait. Several individual trials contained scheduling pauses; raw data
is retained.

Ultrawide rain initially flagged +18.69% mean and +98.81% p95. This was
investigated using `node scripts/investigate-everyday-performance.mjs`, which
alternates three canonical/detail pairs without overwriting the initial run.
The [paired results](screenshots/nocturne-everyday/performance-investigation.json)
also reproduced slow timing on canonical: its median was 18.503 ms / 33.3 ms
p95, versus 16.896 ms / 16.9 ms for the detail pass. No >10% regression
persisted. This supports device/scheduling variability as a contributor;
it does not establish a rendering speedup or precise GPU headroom. No visual
changes were made to chase that noisy measurement.
