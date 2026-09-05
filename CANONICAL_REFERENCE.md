# Canonical reference — temporal review only

The current scene is frozen at `d5f110295f813560f240799ce540935962fa64ca`,
tagged locally as `nocturne-canonical`. This freeze supersedes earlier permission
for broader artistic changes. Do not conduct another beauty pass.

The desktop camera is position `[12.15, 8.75, 14.85]`, target
`[0.15, 3.05, -0.2]`, vertical FOV `33°`. All existing portrait/ultrawide
camera settings are also frozen. The [reference manifest](screenshots/nocturne-temporal/canonical-reference.json)
records the actual desktop quaternion/matrix, render settings, source SHA-256
hashes and all responsive camera settings. The original reference captures and
director's-pass captures remain preserved.

Only investigate sway coherence/faintness, subordinate non-spark-like petals,
tree-coupled cast-shadow movement, rain repetition/trajectories/foreground
events/intersections, the lower-left curb/gutter as a possible eye-exit path,
and storefront structure beneath the hotspot on the intended display.
Do not change facade, canopy density, lighting hierarchy, camera, architecture,
props or overall exposure unless one of those temporal tests demonstrates a
concrete failure.

## Evidence and review status

**The requested continuous visual viewing is not signed off.** The available
tools provided still images but no continuous visual feed or access to the
physical intended display. Recording and frame inspection are not equivalent
to watching continuously at playback speed. No scene changes were made on the
basis of incomplete perceptual evidence.

The [normal-speed recording](screenshots/nocturne-temporal/canonical-65s.mp4)
contains 64.93 seconds of uninterrupted playback, without taps, clock changes,
RNG overrides, camera adjustments or scene edits. The
[playback page](screenshots/nocturne-temporal/index.html) presents it at 1×,
without looping. Capture used a 1920×1080 CSS viewport at DPR 1 and the scene's
native 960×540 render buffer. The recording preserves timestamps and that
pixel grid; it contains 3,648 video frames. The app rendered 3,878 frames over
64.99 seconds, with 64.91 seconds of integrated particle motion and no
visibility interruptions. Mean rendered frame interval was 16.76 ms. The
recording has variable capture cadence, so it cannot establish perfect frame
pacing on the physical display.

| Temporal check | Evidence available; remaining limit |
|---|---|
| Tree/blossom sway | Sampled zone Z rotation spans 0.90–1.54° peak-to-peak; largest sampled rotation step is 0.036°. Representative frames retain the canopy gaps. Appropriate faintness/coherence at playback speed remains unverified. |
| Petals/leaves | At most three passive falling petals were active. Inspected frames show pink blossoms; their material uses ordinary shading, not additive blending. This cannot establish that they never read as sparks during flight. |
| Cast shadows | Camera matrix and light positions remained exactly fixed. Shadow maps update automatically and the actual tree meshes cast shadows; there are no custom shadow casters. No separate shadow animation is present. Subtle tracking versus visible sliding/shimmer still needs continuous viewing. |
| Rain | No exact whole-rain state repeated in 594 samples. Drop resets and speeds vary; trajectories share a narrow drift direction (sampled world-space angle 1.2–2.6° from vertical). This does not rule out perceptual homogeneity, sprite-like events, or brief visible geometry intersections. |
| Lower-left curb/gutter | Preserved exactly. An eye-exit judgment requires continuous viewing; no change is justified by telemetry or the sampled frames alone. |
| Storefront hotspot | Mullion/counter structure remains visible in the inspected decoded frames. Physical-display clipping and retention through continuous playback remain unverified. |

Full [measured results](screenshots/nocturne-temporal/measured-summary.json)
and [representative frames](screenshots/nocturne-temporal/representative-frames.png)
are preserved separately from the canonical scene. The original high-bitrate
WebM and raw telemetry remain local; the timestamp-preserving MP4 and compressed
telemetry are versioned. No temporal failure has been established strongly
enough to authorize a visual adjustment.

`node scripts/capture-nocturne-temporal.mjs` refuses to record if scene sources
differ from the canonical tag. Its Vite observer is review-only and leaves the
production animation clock, RNG, rendering and source files intact.
`python scripts/analyze-nocturne-temporal.py` reports measured evidence only;
it does not certify perceptual acceptance.
