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
| `npm run check:weather-controls` | Keyboard, touch, navigation, and reduced motion. |

Browser checks use Playwright and a local Chrome installation. Capture tools
may require permission to start a localhost server. The existing Vite/Three.js
chunk-size advisory is documented and does not prevent a build.

## Review evidence

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
