# From narration to finished film

The deliverable is an encoded film, its sources, and an honest QA/review record. A storyboard is an intermediate artifact. Use the [CLI reference](../scripts/CLI.md) for exact arguments and the [project schema](../packages/schema/index.ts) for accepted fields.

## 1. Establish the timeline

Create a project from the template. Copy the user's recording into `narration/`, ingest it, and record ffprobe's duration. Obtain a supplied transcript or use a transcription provider. Preserve the original recording. Check the first and last spoken words against timestamps before composing scenes.

Split at changes of argument, cause, scale, evidence, person, place, or time. Silence can suggest an edit; it does not determine meaning. A phrase may span a scene boundary when the visuals form a continuous explanation. Do not shorten speech to accommodate an attractive transition.

## 2. Identify what visuals must contribute

For each segment write the spoken claim and one thing the visual can add: spatial relationship, scale, chronology, mechanism, evidence, or contrast. Select its visual mode using [storyboarding](STORYBOARDING.md). If the only added information is the same sentence in bigger type, redesign the scene.

Make research tasks concrete: “monthly Brent, USD/barrel, January–June 2024” is actionable; “find oil statistics” invites unrelated numbers. Request only needed assets. Choose authentic material when identity or reality is the point, and illustration when showing an abstract mechanism.

## 3. Build a reviewable evidence base

Create source, claim, dataset, and asset records. Preserve publisher, URL, retrieval date, units, period, uncertainty, and usage rights. Distinguish a verified fact from a proposed policy or estimate. Store media locally. Read [research](RESEARCH_POLICY.md), [assets](ASSET_POLICY.md), and [data visualization](DATA_VISUALIZATION.md) when applicable.

## 4. Storyboard before scene implementation

Choose the film's art direction autonomously using [the style presets](ART_DIRECTION.md). Record why the theme, imagery, contrasting light/dark pages and motion suit this narration. Ask about style only when an actual client constraint is missing; do not turn routine palette selection into an approval gate.

For each scene provide `thesis`, `addedInformation`, mode, source/claim references, and local reveal `beats`. Decide the visual noun carried into the next shot: a route, number, line, person, document, or quantity. Give the transition a reason. Plan enough readable holds for the viewer to understand the result after its reveal.

Avoid repeating a layout three times consecutively. Variety comes from changing the reasoning task and scale, not arbitrarily changing fonts or colors. Prefer a photograph followed by an evidence zoom, then a mechanism, then a map when the story actually supports those steps.

## 5. Implement through the DSL

Use [scene families](SCENE_CATALOG.md); add custom code only where existing composition cannot express the intended idea. Use shared motion, camera, theme, typography, and transition functions. Keep project facts outside engine code. Validate the project early so schema failures do not accumulate.

Render a single representative frame while building a scene. For geographic and data scenes, compare the rendered geometry/axes to source values. Inspect Polish diacritics, long labels, and composition at the intended aspect ratio.

## 6. Inspect the draft

Render a labeled contact sheet and a draft with narration. Open the sheet, open representative full-size frames, and inspect motion around every seam. Check the first and last second and listen at actual playback speed. A contact sheet cannot show clipping that lasts one frame or speech/visual misalignment.

Write `renders/REVIEW.md` with timestamps, evidence, scores, and prioritized fixes using [the quality rubric](QUALITY_RUBRIC.md). At least one revision pass is mandatory: improve observed weaknesses, or document inspected alternatives and why a measured result is already preferable. Do not fill a scorecard without looking at output.

## 7. Finish and verify

Render final resolution, mux the original narration, run project/video QA, and generate provenance. Verify video dimensions, audio stream, duration tolerance, and expected frame count. Review final samples because high resolution can expose missing fonts or different line wrapping. A technical pass does not replace editorial review.

Return links to final video, contact sheet, QA report, source list, and review record. State any unresolved issue specifically. If an external resource is unavailable, finish independent work and explain the actual dependency; do not silently replace evidence with generated imagery.

## Decision shortcuts

| Narration problem           | Productive visual response                                                                | Common weak response                         |
| --------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------- |
| “Prices rose”               | Dated series with units and a visible comparison window                                   | Unsourced rising arrow                       |
| “The president opposed it”  | Attributed proposal/veto document with procedural context                                 | Hostile portrait grading                     |
| “Trade was disrupted”       | Locate a chokepoint and show the constrained route; distinguish scenario from observation | Random tanker stock footage                  |
| “A tax changes incentives”  | Sequential causal diagram with qualified effects                                          | A number counter implying guaranteed savings |
| “This changed over decades” | Scale-consistent timeline with a few consequential events                                 | Decorative date carousel                     |
