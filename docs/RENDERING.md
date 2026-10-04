# Rendering and inspection

All commands run from the repository root. [scripts/CLI.md](../scripts/CLI.md) is the canonical argument reference. Install Node 22.12+, dependencies, a Playwright Chromium build, and ffmpeg/ffprobe on PATH.

## Preview and exact-time frames

```bash
npm run dev -- --project demo-fuel-prices
npm run render:frame -- --project demo-fuel-prices --time 12.4
```

Preview and headless capture use the same `window.motion.renderAt(seconds)` contract. The preview may advance requested time from playback/audio; each rendered composition itself is computed from time. Headless capture waits for project resources and fonts and requests explicit frame times.

## Contact sheets and ranges

```bash
npm run render:contact -- --project demo-fuel-prices
npm run render:contact -- --project demo-fuel-prices --every-seconds 1
npm run render:contact -- --project demo-fuel-prices --every-frames 12
npm run render:range -- --project demo-fuel-prices --from 10 --to 14
```

Default sheets sample each scene's start, midpoint, and last frame. Each cell is labeled with timestamp and scene ID. Long sheets paginate; `samples.json` preserves sample times. A scene-start sample may intentionally show the beginning of an incoming transition. Inspect the midpoint/settled state as well.

For seam inspection, render a short range around the boundary and selected close timestamps. Contact sheets establish composition; range playback establishes motion and narration continuity. Open full-resolution frames for text and evidence details rather than judging only thumbnails.

## Draft and final

```bash
npm run render:draft -- --project demo-fuel-prices --workers 2
npm run render:final -- --project demo-fuel-prices --workers 2 --resume
npm run qa -- --project demo-fuel-prices
```

Drafts default to reduced resolution and at most 15 fps. Final uses project resolution/fps unless explicitly overridden. Frames are PNG; ffmpeg encodes H.264/yuv420p and, when narration is configured, AAC. Output dimensions must be even. The final output directory receives the video, source list, and technical QA metadata.

Parallel workers own independent browser pages and pull frames from one queue. Start with two; increase only after measuring memory and throughput. More workers can slow a GPU-heavy custom scene or exhaust memory. Frame writing is atomic, and `--resume` reuses verified frame files within a fingerprinted cache. Changing inputs creates a different cache identity; do not rename unrelated cached frames into a run.

## Audio precision

Video rendering probes narration and rejects a duration mismatch with the project. Audio ingestion writes analysis; edit duration and scene boundaries deliberately rather than silently stretching narration. The render plan covers the requested interval using `ceil(duration × fps)` frames. Range audio and visuals share the same start offset.

Audio can end between video frames, and AAC is packetized. Technical QA permits the larger of one frame or one AAC packet plus a small mux tolerance. Read [audio guidance](AUDIO.md) before interpreting subframe differences as a sync failure.

## QA and limits

Automated checks cover structure/references, local assets, browser errors/resources, sampled frame appearance, text bounds, and encoded stream properties. Coverage is based on samples; a clean report cannot prove every frame is free of collision or every statement is true. Follow the [creative rubric](QUALITY_RUBRIC.md), inspect audio at playback speed, and preserve the review record.

The `qa --video` option expects a full-project video with the configured dimensions/fps/duration. Drafts and ranges receive output-specific technical QA automatically during encoding; do not pass a deliberately shorter range to full-project QA and mistake the expected mismatch for an encoder defect.

Final rendering blocks external requests. Keep fonts/media local and use available acquisition tools before rendering. Deterministic output requires the same renderer/browser/assets/fonts; GPU rasterization and platform codec changes can prevent cross-machine byte equality.
