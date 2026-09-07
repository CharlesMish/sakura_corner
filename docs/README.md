# Development notes

For the scene and its current previews, start with the [project README](../README.md).

## Checks

| Command | Purpose |
| --- | --- |
| `npm run build` | Production build. |
| `npm run analyze:sway` | Canopy motion continuity. |
| `npm run analyze:response` | Local tree-response stability. |
| `npm run analyze:interaction` | Petal population and settling behavior. |
| `npm run analyze:weather` | Weather-mode particle checks. |
| `npm run analyze:snow` | Bounded snowflakes and surface interception. |
| `npm run analyze:life` | Small inhabitants, surface contact, motion bounds, and reduced motion. |
| `npm run check:weather-controls` | Keyboard, touch, navigation, and reduced motion. |

Browser checks use Playwright and a local Chrome installation. Capture tools
may require permission to start a localhost server. The existing Vite/Three.js
chunk-size advisory is documented and does not prevent a build.

## GitHub Pages

The live scene is at [charlesmish.github.io/sakura_corner](https://charlesmish.github.io/sakura_corner/).
The [Pages workflow](../.github/workflows/pages.yml) builds and publishes `dist`
on pushes to `main`, and can also be run manually from GitHub Actions.
The repository's Pages publishing source is **GitHub Actions**.

The build sets Vite's base to `/sakura_corner/`, following
[Vite's GitHub Pages guide](https://vite.dev/guide/static-deploy.html#github-pages).
Local development keeps its existing root URL. To preview the hosted paths:

```sh
npm run build -- --base=/sakura_corner/
npm run preview -- --base=/sakura_corner/
```

Open `http://localhost:4173/sakura_corner/` (or the port printed in the terminal).
To check the build's asset requests and weather navigation in installed Chrome, run
`node scripts/check-pages.mjs`. Set `PAGES_CHECK_URL` to the live address to
run the same checks against the published site.

Only the built scene is published; project documentation and review captures
remain in the repository. If the repository name or hosting path changes,
update the workflow's `--base` argument and these links together.

## Review evidence

[Small lives and winter assessment](SCENE_LIFE.md) covers the weather-specific
cat and birds, their comparison frames, and an approach to a later winter scene.

[Weather implementation and verification](WEATHER_MODES.md) documents the
current weather modes, controls, performance checks, and review limitations.
The [capture index](../screenshots/README.md) identifies current frames and
the separate comparison sets. HTML comparison galleries can be opened locally;
GitHub displays their source rather than running them.

## Project history

Earlier design briefs, handoffs, and milestone reports live in the
[development archive](archive/README.md). They describe earlier checkpoints
and may contain superseded instructions or machine-specific paths.

The README's four curated images are exact copies of the final reviewed
weather frames. Original references and review captures are retained at their
existing paths, so the capture scripts and recorded evidence remain usable.
