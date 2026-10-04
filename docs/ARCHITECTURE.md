# Architecture decision record

The frame contract is `await window.motion.renderAt(seconds)`. It paints a complete, self-contained frame. Rendering out of order is equivalent to rendering sequentially. Animation reads only project data, absolute time, scene-local time and keyed seeded randomness. Browser playback may read audio.currentTime; render-critical code never reads a clock.

One strict TypeScript package with explicit module directories avoids a monorepo publishing/build pipeline that adds no value here. SVG is the primary composition surface; DOM is available for document layouts, Canvas and Three.js through the custom scene lifecycle. No React dependency is needed: scenes are pure markup functions, browser asset/font preparation is separate, and mount/update/dispose hooks handle raster/3D layers.

Zod validates a versioned JSON/YAML DSL. The narration duration is authoritative. Scenes are consecutive half-open intervals, with the final endpoint clamped for previews. Transitions consume the beginning of the incoming scene, so there is one unambiguous owner for every time. The previous scene is sampled at its final instant for a semantic bridge; timeline overlap is never necessary.

Local Vite serves the preview and immutable project assets; Playwright pages seek absolute times; screenshots are lossless PNG; ffmpeg encodes and muxes. Frame caches are keyed by project, all local assets, source code, resolution and renderer settings. Worker pages share a browser but no animation state. Final rendering blocks external requests. No CDN fonts, scripts or media.

Audio is probed with ffprobe. Exact audio duration can lie between video frames: render ceil(duration × fps) frames, limit muxed output to the requested duration, and validate within one frame/AAC packet. A discrete video cannot represent arbitrary duration with subframe visual precision. Documentation and QA state this explicitly.

The library deliberately implements a focused collection of composable scene families, not dozens of nominal aliases. Maps use real cached geometry with d3-geo/TopoJSON. Quantitative scenes always require supplied datasets and source references. A schematic transition never turns illustrative motion into measured data.

All engine and artwork code is independently implemented. See [reference analysis](REFERENCE_ANALYSIS.md) for upstream findings and licenses. Software license does not override individual media licenses.
