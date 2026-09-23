# Nocturne — small lives in different weather

A small variation pass based on published checkpoint `1207ccd`, developed on
`codex/nocturne-small-lives`. Camera, architecture, lighting, exposure, tree,
petals, weather and the existing firefly remain as accepted.

## The inhabitants

| Weather | Small moment |
| --- | --- |
| Rain | An orange cat with white chest and paws, curled asleep on the existing shop counter behind the glass. A very small breathing motion. |
| After rain | One muted bird on the pavement. Long pauses, brief pecks, two short hops and a return along the same small route. The optional firefly remains available. |
| Clear | Five distant birds cross in a loose group, with individual wingbeats and slight differences in height. The canopy hides them naturally during part of the crossing. |
| Snow | The same sheltered cat in a slightly tighter curl, with the existing spring flurry and two small roof deposits. |

The cat uses stylized orange fur with a white chest and paws. Its head and markings are partly
concealed by the existing glass streak and shelf structure. At small sizes it
reads as a sleeping shape; close crops show the ears, wrapped tail and paws.
The interior is already a shallow stage, so the cat uses shallow geometry
between the existing backing and glass. Its paws rest on the counter.

The bird's small route repeats after 38 seconds and closes continuously.
Its food is implied by a few pecks; no conspicuous worm or extra prop was
added. The flock's 83-second cycle includes a 42-second crossing window,
with part of that travel outside the frame. It uses an authored path with
individual offsets and wingbeats, rather than a full boids simulation.

Reduced motion freezes the cat and ground bird in their current pose and
hides the flying flock. The private animation clock pauses and resumes;
the previously accepted scene animation keeps its existing behavior.

## Snow and a later winter edition

**Keep the current Snow option.** It constructs 64 instanced flakes only
when selected, with one flake draw and a fixed collision set. The snow module
is included in the shared JavaScript bundle, but its geometry and per-frame
simulation are absent from the other three modes. Nothing in this assessment
calls for removing it to make room for these small inhabitants.

A full winter edition is a separate art direction: snow on branches and
ledges, different ground treatment, seasonal household details, perhaps a
view from inside a room. It can share the neighborhood's materials, geometry,
weather controls and animal model. Larger seasonal assets can be imported
only when that edition is selected; a second scene need not make everyone
load all its assets up front. Its performance should be measured once its
actual geometry and textures exist.

An indoor viewpoint deserves its own room geometry and camera. The current
street's windows use shallow layered silhouettes, so they are useful for a
small counter cat but are not complete rooms to move a camera into.

For a later Grok pass, start from the accepted street, author winter in a
separate branch/scene module, and compare it without replacing the existing
spring flurry. That leaves both versions available while the winter artwork
develops at its own pace.

## Implementation and review

The inhabitants are separately named under `Weather-specific small lives`
in [`createSceneLife.js`](../src/scene/createSceneLife.js). Only the selected
weather's inhabitant is constructed. No dependencies, asset requests, new
lights, sound, interactions or shadow casters were added. Static cat parts
are merged into three material batches. The ground bird uses six small
meshes to allow its head and body to move separately; the five flying birds
share one instanced draw with ten hinged wings.

The Pages build grows from 179.46 KB to 181.33 KB gzipped JavaScript, about
1.9 KB. Local development and the `/sakura_corner/` hosting path are retained.

The [comparison gallery](../screenshots/nocturne-life/index.html) contains
desktop, laptop, portrait and ultrawide frames, grayscale, thumbnails and
enlarged detail crops. All prior reference and review captures remain at
their existing paths. The new public-preview copies are taken from this pass.

`npm run analyze:life` checks 180 seconds per mode, fixed populations, finite
transforms, counter/window contact, pavement bounds, random-stream independence
during animation, reduced motion, 24/60/120 Hz route closure, and flock entry
and exit beyond all four canonical frames. `node scripts/check-scene-life.mjs`
checks eligibility and live reduced-motion changes in the rendered scene.

The Pages build, existing weather/snow/interaction/response/sway analyzers,
new life analyzer, live reduced-motion checks and hosted-path navigation check
pass. The existing large-Three.js-chunk advisory remains.

[Same-device comparisons](../screenshots/nocturne-life/performance-comparison.json)
cover all four modes at desktop and portrait sizes in Chrome 152 on Intel UHD
graphics. Candidate means are 16.64–16.68 ms/frame; the largest increase is
0.10% in mean time and 6.12% in p95. No comparison exceeds 10%. These are short
four-second baseline/candidate pairs, with Clear warmed up long enough to
include the flock. They are vsync-limited measurements, not a claim about
spare GPU capacity or all devices. Visual comparisons additionally cover
laptop and ultrawide.

Final normal-speed recordings contain 5,385 rendered After rain frames and
5,300 Clear frames over 90 seconds each. Mean intervals are 16.71 and 16.98 ms;
there are no visibility interruptions or changes to camera/light positions.
The ground bird was moved slightly onto clearer pavement after a grass stem
overlapped its feet in projection; the final recording and measurements use
that placement.

The two 90-second bird recordings are normal-speed captures. Review consists
of recordings, telemetry and sampled-frame inspection; continuous visual
playback review is unavailable. No uninterrupted human-style viewing is claimed.

Reproduce the comparisons with `scripts/review-scene-life.mjs` (`REVIEW_REF=1207ccd`
for the baseline), then `scripts/review-scene-life-images.py`. Recording and
performance entry points are `scripts/capture-scene-life.mjs` and
`scripts/measure-scene-life.mjs`; their output is isolated in `screenshots/nocturne-life/`.
