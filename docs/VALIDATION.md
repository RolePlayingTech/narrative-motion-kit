# Validation record — revision 2, 2026-10-04

Observed local Windows results for the revised film. The repository includes Linux CI, but that remote workflow has not run in this session. The prior delivery is preserved in `examples/v1/`.

## Delivered artifacts

- [Revised film](../examples/demo-fuel-prices-v2.mp4), also copied to the default [demo path](../examples/demo-fuel-prices.mp4): **1,630,801 bytes**, H.264, 1920×1080, 30 FPS, **588 decoded frames**, **19.600000 seconds**.
- Audio: AAC LC, mono 48 kHz, 19.600000 seconds. Original synthetic narration WAV retained without shortening.
- [Contact sheet 1](../examples/contact-01.jpg), [sheet 2](../examples/contact-02.jpg), [map comparison](../examples/map-before-after.jpg), [five presets](../examples/style-presets.jpg), [preview screenshot](../examples/studio.png).
- [Sources and provenance](../examples/SOURCES.md), [creative critique](DEMO_REVIEW.md), [project QA](../examples/QA.md), [technical audit](../examples/technical-qa.json), [render manifest](../examples/render-manifest.json).

Film SHA-256: `c2d561f4b7ba7487fb5fdd09b80070868c404804ea8ca8dfbcb1c2ab3782ec3f`.

Final input fingerprint: `0ed5a97be6f4460f1221eb011f5c60aa1c5de278a04fa2998f269fddffd3c132`.

Original output: `projects/demo-fuel-prices/renders/final/demo-fuel-prices.mp4`. `examples/` retains inspected delivery snapshots outside ignored render/cache directories. Refresh these copies deliberately after a new render.

## Executed checks

| Check                                                                                 | Observed result                                                                                                                                                         |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                                       | TypeScript, ESLint and **117 tests across six files** passed.                                                                                                           |
| Geographic regressions                                                                | GeoJSON/TopoJSON orientation, holes, polar caps, real Iranian/Omani/UAE land and sea points, rasterized geography, antimeridian framing and demo route checked.         |
| Sea-route QA                                                                          | Zero land intersections at 100 samples per great-circle segment. A deliberately land-crossing route is detected by regression tests.                                    |
| Transition regressions                                                                | Opaque raster output, exact endpoints, random access, complete header/source bands and geometry bridges passed.                                                         |
| `npm run test:integration`                                                            | Exact pixels after out-of-order seeks and across independent pages; eight frames reused; deliberately corrupted cached frame repaired; short video/audio encode passed. |
| `npm run test:gallery`                                                                | DOM, Canvas and Three.js reconstruct identically; six vertical demo samples captured.                                                                                   |
| `npm run test:preview`                                                                | Production build, local media loading, scene selection, frame stepping, safe-area control and concurrent seeking passed.                                                |
| `npm run render:draft -- --project demo-fuel-prices --workers 2 --resume`             | Complete 294-frame, 960×540, 15 FPS draft with narration. Five transition strips opened and revised.                                                                    |
| `npm run render:final -- --project demo-fuel-prices --workers 2 --resume`             | Complete 588-frame Full HD film with narration. Final representative frames decoded and opened.                                                                         |
| `npm run qa -- --project demo-fuel-prices --video renders/final/demo-fuel-prices.mp4` | **PASS**, 37 visual samples, zero findings. Video/audio dimensions, duration and frame count passed.                                                                    |
| `npm run qa -- --project scene-gallery`                                               | **PASS**, 45 samples and the expected silent-demo warning.                                                                                                              |
| Five presets                                                                          | All five captured at 1920×1080 in dark and paper scenes; comparison opened.                                                                                             |
| `npm run format:check`                                                                | Passed after review records and delivery metadata were formatted. Geographic asset bytes remain unchanged.                                                              |

Map source is pinned to Natural Earth revision `ca96624a56bd078437bca8184e78163e5039ad19`. Retained regional asset SHA-256: `9e139661403277d5e4bd3510a18c02eedad0e252a54b969791cc3a504d032dec`. Acquisition and transformations are recorded in the project research directory. Render processes block remote HTTP and use local assets/fonts.

## Runtime

- Node v22.14.0; Windows x64, OS release 10.0.26200.
- Playwright 1.63.0; Chromium 153.0.8010.12.
- ffmpeg / ffprobe N-121938-g2456a39581-20251130.
- ffmpeg build SHA-256: `e470f1b615ab6e5561ac2479d786a1a7221389651f404bc5d658e73e2d1b52ba`.
- Local Barlow Condensed, Manrope Variable and IBM Plex Mono.

Lockfile, asset hashes and runtime identify the tested environment. Pixel identity across different operating systems, GPUs or browser builds is not promised.

## Scope and limits

The framework has 12 scene families, three custom-layer examples and five palette/art-direction presets. Flow is qualitative, not a full Sankey solver. Synchronized video-clip scenes and bundled transcription/image-generation models are not included. Custom DOM/Canvas/WebGL layers require cuts. Research and visual direction still require editorial judgment; preset choice is delegated to the production agent through the workflow.

Theme `grain`, `vignette`, `motion` and `stroke` remain extension tokens, not globally applied effects. Camera transformations also affect typography. Long labels, dense charts and new aspect ratios need inspection beyond automatic bounds checks.

Creative self-review: **86.6/100**, with pacing provisional until listening review. Narration remains synthetic. Data and political roles are historical; the route is schematic and Natural Earth 1:10 million is not navigation-grade mapping. No human listening review or completed vertical film is claimed.

The `toolchain-smoke` and `qa-template-fixture` projects remain excluded from the production build. An earlier automatic approval review blocked cleanup of `toolchain-smoke`; it was retained without bypassing the block.
