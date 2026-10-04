# Reference analysis and independent implementation

Reviewed on 2026-10-03 before implementation. These projects provided architectural inspiration; their characters, art direction, scenes, source code, audio, and assets were not imported.

## Examined snapshots

| Repository                                                                          | Revision examined                          | License observation                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo)                   | `fa546a38092e75f2b079e6a86d6abc54dd525d17` | No LICENSE file in the recursive tree; GitHub repository metadata reported `license: null`. Public availability is not permission to copy.                                                                                                   |
| [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) | `0ac8bf2b31942376cb6b8c4074715595d512acd2` | [MIT, copyright 2026 John Heibel](https://github.com/JohnHeibel/ClaudeAnimationBase/blob/0ac8bf2b31942376cb6b8c4074715595d512acd2/LICENSE). If future changes incorporate substantial code, preserve its notice and record the reused files. |

The review inspected actual `render.mjs`, `src/core.js`, `src/timeline.js`, `studio.html`, the Base configuration and guide, and PDoom's storyboard. It was not limited to README claims. Links below pin the reviewed versions; later upstream changes may differ.

## Findings from the source

### Absolute time and frame independence

Both projects expose a browser `renderAt(t)` hook. Their shot functions receive absolute time, shot-local time, and shot duration, and repaint the entire frame. This makes random-access seeking and independent worker pages possible. PDoom groups shots into chapters; Base flattens them into a sorted shot registry. See [PDoom timeline](https://github.com/JohnHeibel/PDoomVideo/blob/fa546a38092e75f2b079e6a86d6abc54dd525d17/src/timeline.js) and [Base timeline](https://github.com/JohnHeibel/ClaudeAnimationBase/blob/0ac8bf2b31942376cb6b8c4074715595d512acd2/src/timeline.js).

**Adopt the principle independently:** a frame is derived from a validated project and requested time. Treat time as input, never as accumulated state. Enforce scene boundaries and reject unintended gaps or overlaps before rendering. Preview playback may use a wall clock to choose the requested time; scenes must not read that clock.

### Motion and camera

The core files supply clamping, interpolation, easing, keyframes, deterministic hashes, event-based decaying oscillation, and world-to-screen camera transforms. Base also isolates random seeds by element; otherwise one element's changed random consumption can disturb all later elements. Its camera-following inspection crops reuse the last camera transform. See [Base core](https://github.com/JohnHeibel/ClaudeAnimationBase/blob/0ac8bf2b31942376cb6b8c4074715595d512acd2/src/core.js) and [PDoom core](https://github.com/JohnHeibel/PDoomVideo/blob/fa546a38092e75f2b079e6a86d6abc54dd525d17/src/core.js).

**Adopt independently:** pure motion helpers and composable cameras. Give procedural objects stable identities and separate deterministic seeds. Use closed-form springs instead of simulation integration. Keep source labels in screen space so camera movement cannot make evidence unreadable.

### Browser rendering and encoding

The renderers use Puppeteer to load the studio, wait for readiness, request exact times, and retrieve image bytes. Worker pages claim numbered frames from a shared queue; temporary files are renamed after writing. ffmpeg encodes the image sequence and muxes audio. Base adds browser discovery, GPU choices, project duration, and optional audio. PDoom hardcodes its film duration and song path. See [PDoom renderer](https://github.com/JohnHeibel/PDoomVideo/blob/fa546a38092e75f2b079e6a86d6abc54dd525d17/render.mjs) and [Base renderer](https://github.com/JohnHeibel/ClaudeAnimationBase/blob/0ac8bf2b31942376cb6b8c4074715595d512acd2/render.mjs).

**Adapt with stronger safeguards:** derive duration from narration, fingerprint render inputs before resuming, verify decoded frame files, fail on browser/ffmpeg errors, and check final streams with ffprobe. The reference resume check mainly uses existence and file size; stale frames from an older project would otherwise look reusable. Base's streamed clip path waits for ffmpeg closure without testing its exit code. These are reasons for independent error handling.

### Inspection as part of production

Base renders selected-time sheets, every-frame strips, fixed crops, and camera-following crops. Its guide requires visual inspection and revision, especially at action/transition seams. PDoom's storyboard explicitly connects adjacent shots and reuses motifs across chapters. See [Base guide](https://github.com/JohnHeibel/ClaudeAnimationBase/blob/0ac8bf2b31942376cb6b8c4074715595d512acd2/ANIMATION_GUIDE.md) and [PDoom storyboard](https://github.com/JohnHeibel/PDoomVideo/blob/fa546a38092e75f2b079e6a86d6abc54dd525d17/STORYBOARD.md).

**Adopt the workflow:** storyboard the information gain first; inspect labeled scene samples and dense transition samples; record a critique and make an explicit revision before final encoding. A contact sheet establishes composition, but does not prove motion quality or audio alignment.

## Deliberate differences

1. **Documentary composition:** HTML/SVG components, local photographs, documents, supplied datasets, and meaningful geographic geometry replace a single hand-painted character medium. Canvas and WebGL remain optional composition tools.
2. **Narration rather than musical beat as authority:** narration timestamps determine semantic edits; beat helpers may support music but cannot overrule intelligibility.
3. **Validation rather than convention:** schemas, source references, timeline checks, asset checks, and render QA encode decisions that an agent might otherwise forget.
4. **Typography is useful information:** documentary labels, dates, quantities, and evidence are essential. The reference guide's prohibition on text is appropriate to its cartoon brief, not this framework.
5. **Semantic continuity:** geometry, identity, or a causal relationship should carry a transition. A reusable wipe alone cannot establish why one concept follows another.
6. **Offline output:** locally bundled fonts and cached assets are required for repeatable final rendering. [Base studio](https://github.com/JohnHeibel/ClaudeAnimationBase/blob/0ac8bf2b31942376cb6b8c4074715595d512acd2/studio.html) loads p5 scripts locally but requests Google Fonts CSS remotely.
7. **Measured determinism:** same inputs should match in the pinned browser/runtime/font environment. Pixel equality across different browsers, operating systems, GPU drivers, or codecs is a separate promise and must not be implied.

## Attribution boundary

Ideas inspired by the references: absolute-time frames, scene-local timing, a simple browser render hook, independent worker pages, atomic frame files, contact-sheet-first iteration, shared pure motion/camera helpers, and transitions planned in a storyboard.

Independently designed for this repository: project DSL and schema, documentary scene recipes, narration ingestion, factual research records, asset provenance, semantic transition contracts, responsive layouts, theme, QA gates, agent workflow, and demo. No upstream code reuse was needed for this work.
