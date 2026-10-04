# Command reference

Run commands from the repository root. `npm install`, `npx playwright install chromium`, and `ffmpeg`/`ffprobe` on PATH are prerequisites. Node 22.12+ is required. No paid service or cloud credential is required.

In Windows PowerShell, use `npm.cmd` and `npx.cmd` if their PowerShell shims consume named arguments after `--`. For example: `npm.cmd run render:frame -- --project demo-fuel-prices --time 12.4`.

Every command accepts `--project ID`, defaulting to `demo-fuel-prices`. IDs contain lowercase letters, numbers and hyphens. A project lives at `projects/ID/project.json` or `project.yaml`/`project.yml`; JSON takes precedence if both exist. Paths in the project and CLI asset/audio arguments are relative to that project directory. Traversal and files symlinked outside the project are rejected. Unknown CLI options are errors.

```bash
npm run dev -- --project demo-fuel-prices
npm run new:project -- my-video
npm run audio:ingest -- --project my-video
npm run assets:check -- --project my-video
npm run render:frame -- --project my-video --time 12.4
npm run render:range -- --project my-video --from 10 --to 20
npm run render:contact -- --project my-video
npm run render:draft -- --project my-video --workers 2 --resume
npm run render:final -- --project my-video --workers 2 --resume
npm run qa -- --project my-video
npm run sources -- --project my-video
```

| Command          | Options                                              | Output / behavior                                                                                                                                                                 |
| ---------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev`            | `--port 5173`                                        | Vite preview URL with project selected. Ctrl+C stops it.                                                                                                                          |
| `new:project`    | positional ID                                        | Copies template assets and creates all project directories. Existing directory causes an error.                                                                                   |
| `audio:ingest`   | `--audio narration/file.wav`, provider options below | `transcript/analysis.json`: exact duration, codec, silence intervals, approximate RMS intensity, suggested edit points, optional transcript. Defaults to `narration.file`.        |
| `assets:check`   | none                                                 | Prints errors/warnings for files, hashes, decoding, declared dimensions, duplicate bytes and resolution.                                                                          |
| `render:frame`   | `--time 0`, `--width`, `--height`                    | `renders/frames/t-TIME-WIDTHxHEIGHT.png`. Time is seconds, including the final preview endpoint.                                                                                  |
| `render:range`   | render options below                                 | `renders/range/ID-FROM-TO.mp4`, trimmed narration, technical QA and provenance.                                                                                                   |
| `render:contact` | `--every-seconds N` **or** `--every-frames N`        | Labeled `renders/contact/contact-01.jpg` etc. and `samples.json`. Default samples every scene start/middle/last frame. Up to 15 landscape samples per sheet, 25 portrait samples. |
| `render:draft`   | render options below                                 | `renders/draft/ID.mp4`; half resolution and at most 15 FPS by default; dimensions stay at least 240px.                                                                            |
| `render:final`   | render options below                                 | `renders/final/ID.mp4`; project resolution/FPS, H.264 CRF 18 + 192kbps AAC narration.                                                                                             |
| `qa`             | `--static-only`, `--video renders/final/ID.mp4`      | `renders/QA.md` and `qa.json`. Checks existing final by default; custom video should match full project specifications.                                                           |
| `sources`        | none                                                 | `renders/SOURCES.md`. Video commands also write `SOURCES.md` beside the MP4.                                                                                                      |

Render options: `--from SECONDS`, `--to SECONDS`, `--width PIXELS`, `--height PIXELS`, `--fps INTEGER`, `--workers INTEGER`, `--resume`. Interval defaults to the whole narration. Width/height default independently; set **both** when changing aspect ratio. Dimensions must be even integers in [240,7680], FPS in [1,120], worker count in [1,16]. Two worker pages are the default. Use `range` for excerpts so their outputs cannot be mistaken for the full final. A partial final will fail subsequent full-project QA.

All render modes block external HTTP requests. They load local fonts/assets, wait for browser readiness, seek the deterministic frame contract, and fail on browser/resource errors. A worker pool shares one browser but uses isolated page contexts. PNGs are written atomically. Frame cache keys hash project content, every local project file (excluding renders/cache), application/package/script source, dependency lock and render settings. `--resume` validates and reuses decodable frames with matching dimensions; corrupted frames are repaired. Changing code, project, audio, assets or render settings creates a new cache. Old caches remain in `renders/.cache/` for manual removal.

The final contains `ceil(duration × fps)` frames. Audio duration is authoritative; MP4 duration is checked within one video frame or AAC packet plus 10ms container tolerance. A visual sample cannot represent a fraction of a frame. The renderer rejects a project/narration duration mismatch greater than 10ms before rendering. `silent-demo` projects can render without audio and receive a QA warning.

## Audio providers

Set `narration.file` before ingestion. WAV, MP3 and AAC/M4A work through ffmpeg. Ingestion reports exact duration but deliberately does **not** rewrite scene timings: update `project.duration` and align the storyboard to the result.

```bash
npm run audio:ingest -- --project my-video --transcript transcript/narration.txt
npm run audio:ingest -- --project my-video --timestamps transcript/aligned.json
```

Choose one provider. Without an explicit provider, `narration.transcript` is used if present (`.json` means timestamps). Text-only alignment apportions sentence durations by word count and is marked **approximate**. It is an initial storyboard aid, never word alignment evidence. Supplied timestamp JSON is either an array or `{ "segments": [...] }`:

```json
{
  "segments": [
    {
      "start": 0.0,
      "end": 2.4,
      "text": "Cena paliwa to kilka różnych warstw.",
      "words": [{ "start": 0.0, "end": 0.35, "text": "Cena" }]
    }
  ]
}
```

Segments and optional words must be ordered, nonoverlapping, and fit the narration. The local provider accepts `--transcribe-command` as a JSON argument array, for example `["python","my-adapter.py","{audio}"]`. Shell quoting differs across operating systems. The executable runs directly, with `{audio}` replaced by an absolute filename, and must print the timestamp JSON to stdout. Diagnostics belong on stderr. Download/install a local model separately; no model is bundled. `TranscriptionProvider` in `packages/audio/index.ts` supports additional adapters.

## Acquisition and generated imagery

`acquireAsset(directory, metadata)` in `packages/assets/index.ts` downloads an HTTPS original into the manifest's local path, limits download size, computes SHA-256, and writes a `.provenance.json` sidecar. Pass a complete `Asset` entry with reviewed license/role/source, then add the returned metadata to `project.assets`. HTML error pages are rejected. Acquisition is separate from rendering and does not research licenses for you.

`ImageGenerationProvider` describes provider-neutral generation. No generator is bundled. A generated asset needs `role: "generated"`, its prompt, generator/model metadata and usage note. Retain authentic documentary assets for people/documents/evidence.

## QA and integration

`qa` checks schema (on project load), assets, narration duration, browser/network failures, loaded fonts, frame contrast, suspiciously unchanged compositions, visible text beyond stage bounds, explicit safe-area markers, and an optional final video. It samples every second and each scene start/middle/end. Layout and stagnation findings are warnings requiring inspection; intentional reveal masks can create false positives. Add `data-qa-ignore` or `data-allow-overflow` only to intentional clipping, and `data-qa-safe` to custom elements that must remain inside the 4.5% safe area. A warning does not replace visual review.

Routes declared `surface: "sea"` are sampled along great-circle segments against their scene's retained land polygons; an intersection fails static QA. This catches land-crossing waypoints at the dataset's resolution. It does not certify navigability, traffic density, political borders, or coastal detail absent from that dataset. Keep the source scale and schematic qualification visible.

`npm run test:integration` verifies pixel equality after out-of-order seeking, equality across independent pages, frame-cache resume, repair of a corrupted cache frame, and a short ffmpeg encode with audio/duration/resolution/frame-count QA. It uses the demo by default; `npm run test:integration -- PROJECT-ID` selects another project. Evidence is stored in `renders/integration/`.

`npm run test:gallery` exercises the local `scene-gallery` project. It leaves and reconstructs the Three.js globe, Canvas particles, and DOM document scenes, requiring identical pixels at the same requested time. It also captures six 9:16 frames from the narrated demo. Images and `report.json` are stored in `projects/scene-gallery/renders/integration/`. These samples do not establish that a complete vertical film has passed creative review.

Every video writes `render-manifest.json` with its frame settings, input fingerprint and execution environment: actual Chromium version, Playwright, Node, OS release, architecture, ffmpeg version/build hash, and ffprobe version. These environment values are part of the frame cache key. `technical-qa.json` retains the complete observed ffprobe format/stream metadata, expected values, duration tolerance and findings. The render fails if project or source files change while frames are being captured; keep inputs stable during production.

Determinism is exact within the tested browser/OS/font environment. Cross-platform font rasterization and GPU drivers can differ; retain the lockfile and browser build for reproducible production. Asset hashes and retained local fonts still matter for archival reproduction.

`npm run test:preview` builds the production preview and tests project/media loading, scene selection, keyboard frame stepping, safe-area controls, and concurrent seeks. It saves desktop/mobile screenshots and `report.json` in `projects/demo-fuel-prices/renders/preview/`. CI runs the same check.
