# Luminous sakura refinement

The new direction is a dreamier rainy night: rose blossoms lead the scene,
amber glass suggests shelter, and blue depth separates the neighborhood.
The user explicitly reopened the prior camera/tree/weather/light freeze.

## Implementation

- Wet blossom materials use a graded pink palette and restrained emission by
  tone. Existing cluster placement, branch silhouette, and instancing remain.
- Cooler sky fill supports the canopy. Lower shop-light intensity, rougher wet
  pavement/glass, and a small glass emission soften hotspots. Four narrow amber
  cards break up the existing light pool.
- Three shallow stepped cloud silhouettes replace the boxes. The far ground
  has an irregular outline, the oversized sidewalk ends behind the plots, and
  layered hills use controlled wet colors. The camera far plane is now 120 so
  it does not slice the background into a straight horizon.
- Portrait targets `[-0.35, 3.55, -0.2]` at 47 degrees. Desktop framing remains.
- `sampleWind(elapsed)` supplies one bounded envelope to tree, petals, and rain.
  Existing tree/petal update calls remain compatible through default arguments.
  Local response settles over 1.05 seconds with damping 0.8; staggered releases
  span 0.06–0.53 seconds. Existing population and rotation limits remain.
- Rain uses instance brightness and scale for depth at unchanged streak counts.
  A fixed pool of 12 hexagonal splash rings appears only in falling rain, in an
  exposed pavement strip beyond the canopy and in front of the awning. No new
  lights, dependencies, postprocessing, or interface controls.

## Validation

`npm run build`, `analyze:sway`, `analyze:interaction`, `analyze:response`, and
`analyze:weather` pass. The existing bundle-size advisory remains.

The new weather analyzer exercises clear, wet, rain, dash, pixel, and invalid
query fallback for 180 simulated seconds each. It checks finite transforms,
bounded wind, fixed particle capacities, splash visibility and placement.
Interaction analysis retains the 20 total / 8 interactive / 9 queued limits;
the response simulation remains within 0.022 radians. Largest measured canopy
neighbor-distance increase over the 30-second sway sample is 0.0603 world units.

Fresh Chrome captures cover 1920×1080, 1366×768, 2560×1080, 390×844, detail,
clear and wet modes, all rain styles, and later rain at 10/30 seconds.
Sign-off and reference images have not been overwritten.

Desktop miss/tap/repeated-tap/settling and portrait touch captures completed
without browser errors. Eight sway frames over 14 seconds were captured and
the endpoint canopy crops visually reviewed alongside the numerical analysis.

Performance instrumentation counts WebGL draw calls and requestAnimationFrame
intervals in the capture harness, not in the production application. Baseline
`e1707a6` is served from Git through a Vite transform without resetting files.
Warm desktop/laptop samples are around 16.7 ms; draw calls increase from 683 to
687 (0.6%). Portrait increases from 611 to 621 (1.6%). These are local headless
frame intervals, not GPU timings or a guarantee for mobile hardware. Cold start
and screenshot activity can create outlier samples.

## Reproducing evidence

PowerShell:

```powershell
$env:CAPTURE_PREFIX='luminous-final-'
npm.cmd run capture
npm.cmd run capture:interaction
```

For comparison, set `CAPTURE_BASELINE=1`, `CAPTURE_PREFIX=luminous-before-`, and
`CAPTURE_ONLY=scene-` when running `capture`. Unset `CAPTURE_BASELINE` before
capturing the current source. On Windows the harness uses installed Chrome;
other platforms retain the existing Playwright browser location.

The final frames are in `screenshots/luminous-final-*.png`. They are local
review artifacts ignored by Git, following the existing screenshot convention.
The changes are uncommitted and have not been deployed.
