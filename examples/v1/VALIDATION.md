# Validation record — 2026-10-04

This is the observed local Windows run, not a guarantee for untested platforms. The repository includes a Linux CI workflow but that remote workflow has not been executed in this session.

## Delivered artifacts

- [Final demonstration](../examples/demo-fuel-prices.mp4) — 2,269,134 bytes; H.264, 1920×1080, 30 FPS, 588 decoded frames, exactly 19.600000 seconds.
- Audio: AAC LC, mono 48 kHz, 19.600000 seconds. The original synthetic narration WAV is retained in the source project.
- [Contact sheet 1](../examples/contact-01.jpg), [sheet 2](../examples/contact-02.jpg), [preview screenshot](../examples/studio.png).
- [Sources and asset provenance](../examples/SOURCES.md), [creative critique and revisions](DEMO_REVIEW.md).
- [Project QA](../examples/QA.md), [technical video audit](../examples/technical-qa.json), [render manifest](../examples/render-manifest.json).

Film SHA-256: `e9c53f48ac0e228dc161e121d359f5ca02f71ebb789c8b91aff3c4ff98785b77`.

Final input fingerprint: `28a62f80f12cd3c4c59c6ce4284894e3f0db12fce02a9ce71061f0d5c8f7e32a`.

Original output: `projects/demo-fuel-prices/renders/final/demo-fuel-prices.mp4`. `examples/` retains a delivery snapshot outside the ignored render/cache tree. Regenerate the source project outputs with the documented CLI; refresh the example copies deliberately after another inspected render.

## Executed checks

| Check                                                                                 | Observed result                                                                                                                                                                          |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                                       | TypeScript, ESLint and all **91 tests** across four files passed.                                                                                                                        |
| `npm run test:integration`                                                            | Exact pixels after out-of-order seeks and across independent pages; all eight cached frames reused; one deliberately corrupted frame repaired; short video and audio encoding passed QA. |
| `npm run test:gallery`                                                                | Three.js, Canvas and DOM reconstruct identically; six 9:16 demo frames render within bounds.                                                                                             |
| `npm run test:preview`                                                                | Production Vite build, local project/media loading, scene selection, keyboard stepping, safe-area controls and concurrent seeks passed. Desktop/mobile screenshots retained.             |
| `npm run render:draft -- --workers 2 --resume`                                        | Complete 294-frame, 960×540, 15 FPS draft encoded with narration.                                                                                                                        |
| `npm run render:final -- --workers 2 --resume`                                        | Complete 588-frame, 1920×1080, 30 FPS final encoded with narration. A final font-preload revision produced the same MP4 SHA-256 as the prior visual revision.                            |
| `npm run qa -- --project demo-fuel-prices --video renders/final/demo-fuel-prices.mp4` | **PASS**, 37 visual samples, zero findings; video/audio dimensions, frame count and duration passed.                                                                                     |
| `npm run qa -- --project scene-gallery`                                               | **PASS**, 45 visual samples; one expected warning for the intentionally silent demonstration.                                                                                            |
| `npm run format:check`                                                                | Passed after formatting the completed review records.                                                                                                                                    |
| Dependency audit during final font installation                                       | 183 packages audited; zero reported vulnerabilities. This is a dated audit, not a security guarantee.                                                                                    |

The final renderer blocks remote HTTP resources. No paid transcription or image-generation service was used. Reference repositories were researched without copying their implementations; see [REFERENCE_ANALYSIS.md](REFERENCE_ANALYSIS.md).

## Runtime

- Node v22.14.0; Windows x64, OS release 10.0.26200.
- Playwright 1.63.0; Chromium 153.0.8010.12.
- ffmpeg / ffprobe N-121938-g2456a39581-20251130.
- ffmpeg build SHA-256: `e470f1b615ab6e5561ac2479d786a1a7221389651f404bc5d658e73e2d1b52ba`.
- Locally bundled Barlow Condensed, Manrope Variable and IBM Plex Mono.

The lockfile, asset hashes and recorded runtime identify the tested environment. Pixel equality across different operating systems, GPUs or browsers is not promised.

## Deliberate boundaries and known limits

The framework implements 12 scene families and three custom layer examples, rather than nominal placeholders for every specialist pattern. Flow is a directed qualitative diagram, not a complete Sankey solver. Video files can have provenance records, but a synchronized video-clip scene is not included. Custom DOM/Canvas/WebGL layers currently require cuts at their boundaries. Transcription and image generation have provider interfaces; no model or cloud adapter is bundled. Semantic segmentation, research, factual verification and visual direction still require an agent or editor.

Theme `grain`, `vignette`, `motion` and `stroke` fields are extension tokens; current built-in scenes do not apply these as global controls. Camera transformations affect scene typography as well as artwork. Long labels, dense breakdowns and new vertical compositions need visual inspection beyond automatic bounds checks.

The creative self-review is **80.6/100**, below the recommended editorial target of 85. The compact demonstration is technically complete, but its source labels, legal passage and final chart deserve longer holds in a full episode. Narration is synthetic, the underlying data and political context are historical, and no human listening review is claimed. The six vertical samples are engineering coverage, not a finished 9:16 film.

The `toolchain-smoke` and `qa-template-fixture` projects are retained test fixtures and excluded from the production preview build. An automatic approval review blocked an attempted cleanup of `toolchain-smoke`; no bypass was attempted. All required output remains available.
