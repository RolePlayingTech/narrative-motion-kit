# Scene catalog

The scene library is a set of composable recipes. Its exact schema is [packages/schema/index.ts](../packages/schema/index.ts). Do not invent a scene type from a desired effect's name. Use an existing recipe or register a custom renderer.

All scenes have `id`, `type`, absolute `start`/`end`, title, visual mode, thesis, and added information. Optional common fields include kicker, subtitle, sources, claims, local reveal beats, incoming transition, and camera. Quantitative families require source IDs even for explicitly illustrative examples.

Choose one of five project themes using [art direction](ART_DIRECTION.md). A scene can use `tone: "paper"` for a contrasting light evidence or data page. Select the style autonomously from the subject and source material; record the rationale in the storyboard.

## Implemented families

| Type            | Best use                                  | Required content beyond common fields       | Scope and design note                                                                                                                                                     |
| --------------- | ----------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `statistic`     | A memorable scale or quantity             | value, unit, label                          | Counter with editorial, pump, and percentage-split variants. The counter's intermediate values are animation, not measurements.                                           |
| `portrait-duel` | Two actors or positions                   | left/right asset, name, role                | Matched photographic panels and optional center label. `position` controls crop focus; `crop` selects a normalized source rectangle. Keep identities and dates authentic. |
| `photo`         | Establish documentary reality             | asset, caption                              | Archive framing, image-led composition, or prepared transparent cutout. `focus` controls crop. It does not generate depth masks or remove a background.                   |
| `evidence`      | Inspect a short source passage            | heading, body, highlight, attribution       | Typeset evidence with timed highlight and optional image backdrop. Label a paraphrase or reconstruction as such. It is not an OCR engine.                                 |
| `flow`          | Explain a process or causal structure     | nodes and edges                             | Sequential node/arrow reveal; directed layout, labels, optional relative edge weights. A cycle falls back to declared order. This is not a full Sankey layout.            |
| `breakdown`     | Show compatible parts of a total          | dataset, totalLabel                         | Horizontal or vertical proportional stack. Values must be nonnegative with positive total. Small parts can create label collisions; simplify or use a different form.     |
| `line-chart`    | Show change over a numeric x-axis         | dataset, xLabel, yLabel                     | Supplied observations, common axes, optional y-domain, point annotation, and series grouping. Use comparable units and limited series.                                    |
| `bar-chart`     | Compare categories                        | dataset, xLabel, yLabel                     | Positive/negative values around zero, labels and sequential reveal. Keep category count readable.                                                                         |
| `geo-flow`      | Explain location and constrained movement | geometry asset, center, routes              | Mercator map, geographic zoom, route strokes, places, optional metric. Use real cached geography; route strength is schematic unless sourced.                             |
| `timeline`      | Explain sequence across dates/eras        | 2–8 events with date and label              | Evenly arranged event steps, optional detail and landscape thumbnails. It is an ordinal timeline, not elapsed-time-proportional geometry.                                 |
| `comparison`    | Contrast two sourced values               | left/right labels and values, unit, dataset | Paired numbers with relative magnitude bars. Use equivalent quantities and nonnegative magnitudes; negative values are better shown on a zero-axis chart.                 |
| `custom`        | An idea beyond existing recipes           | registered renderer ID, props               | SVG renderer and optional DOM/Canvas/WebGL layer lifecycle. Registration is required; arbitrary code does not run from JSON.                                              |

## Geographic and mechanism options

`geo-flow` supports `composition: "atlas"`: a large map, a separate metric and an optional locator from `locatorAsset`. Its `projection` is `mercator` by default and may be set to `equal-earth` when relative area must remain visually honest. Register the locator's local geography asset separately. Use `cartographyLabel` for dataset scale and year, and `places[].kind` (`place`, `country`, `water`) plus optional label `offset` for geographic hierarchy. `metric.context` adds a short explanation beneath its value. A route marked `surface: "sea"` is checked against retained land polygons during QA. See [maps](MAPS.md) for geometry winding, source acquisition, limitations and reproducible examples.

Flow nodes can use reusable `icon` values `oil`, `refinery`, `ship`, `pump`, `money`, and `document`. These icons explain the stage; the arrows remain a qualitative mechanism unless their weights have sources.

## Custom extensions included

`globe` uses the local Three.js layer with cached polygon geography. Its props include `asset`, `fromLongitude`, `toLongitude`, and `latitude`. It renders a rotating globe with coastline outlines and an absolute-time camera move. It does not fetch satellite tiles or integrate physics.

`particle-flow` is a deterministic Canvas illustration with optional `count`. It demonstrates a procedural layer; it is not a measured traffic visualization. Label it as a metaphor or schematic if a viewer could interpret its particles quantitatively.

`document-dom` uses a real HTML article with `heading` and `body` props beneath the SVG scene chrome. Its entry opacity and position are assigned from local time. It is a compact extension example, not a paginated document viewer; inspect long text and portrait layouts separately.

All three are exercised in the nine-scene, 36-second [scene gallery](../projects/scene-gallery/project.json). `npm run test:gallery` checks pixel equality after leaving and reconstructing each extension and captures six vertical demo samples. This is engineering coverage, not a creative review of a finished vertical film.

Read [adding scenes](ADDING_SCENES.md) before registering an extension. Each custom layer must assign every animated property at every requested time, including backward seeks. Scenes with a registered DOM, Canvas, or WebGL layer require cuts both into and out of the scene; the renderer rejects SVG transition effects across these boundaries.

## Layout and text

Built-in components use an aspect-aware design space, safe padding, and estimated text fitting. The scene `vertical` object can override title/subtitle and hide supported named elements; currently `subtitle` is the documented hide target. Do not assume arbitrary object IDs are automatically hidden. Portrait panels remain a paired composition; judge their faces and labels in vertical output.

Camera `from`/`to` use normalized center displacement (`x`, `y`), positive zoom, and rotation in degrees. Camera `start` and `end` are scene-local seconds. Use small, motivated moves. The current generic camera transforms the scene's SVG composition, including typography, so inspect label readability after applying it.

For `portrait-duel`, each person's optional `crop` is `[x, y, width, height]` relative to the original image, with coordinates in `[0, 1]`, positive dimensions, and a rectangle that remains within the source. `position: [x, y]` selects the focus within that crop when the panel's aspect ratio requires further trimming. Match apparent face size and eye height through inspection, not by giving dissimilar originals identical crop numbers.

## Authored reveal timing

`beats[].at` is scene-local time in seconds. Beats drive flow nodes, bar-chart categories, breakdown parts, and timeline events in their declared order. Supply one beat per item when the narration needs exact cues. The last beat controls the evidence highlight and geographic metric; for line charts the final beat sets line completion and the second beat can cue an annotation, gated by its data point's reveal. Most beats mark reveal starts rather than settled endpoints; line completion is an exception. Reveal durations and title entry remain component-specific. A route or camera flight has its own timing.

For example, the following three beats can cue a three-node flow:

```json
"beats": [
  { "at": 0.4, "label": "Supply" },
  { "at": 1.5, "label": "Processing" },
  { "at": 2.7, "label": "Retail" }
]
```

Built-in fallbacks distribute uncued item reveals across the scene. Not every family consumes beats: statistic, portrait, photo, and comparison retain their own reveal timing. For precise word alignment beyond these controls, tune the component or use a custom renderer driven by the same timeline. Always leave time after the final cue to read the settled result.

## Select by the reasoning task

Use evidence for proof, flow for mechanism, data scenes for scale, geography for location, and photographs for reality. A photo of a fuel station cannot explain tax incidence. A beautifully animated flow cannot prove that a proposed tax was enacted. Compose different families when a claim needs both explanation and evidence.

There are no placeholder aliases for every requested documentary pattern. New specialist recipes should generalize a demonstrated project need, preserve truthful data and asset contracts, and include rendered inspection evidence.

The manifest can track video assets, but there is no built-in synchronized video-clip scene. A custom decoder/layer must seek the clip to the requested absolute time and wait for decoded pixels before capture; normal `<video>` playback is not deterministic frame rendering.


For historical boundary series, use the provenance/time contract in [HISTORICAL_MAPS.md](HISTORICAL_MAPS.md) rather than treating a dated polygon as an ordinary timeless land asset.
