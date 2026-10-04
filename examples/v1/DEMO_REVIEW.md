# Demonstration review — 2026-10-04

Reviewed by the implementation agent, with a separate agent inspecting the latest contact sheets and full-resolution chart. This is an engineering and editorial self-review, not independent publication approval.

The delivered film is `examples/demo-fuel-prices.mp4`: 19.6 seconds, 1920×1080, 30 FPS, six scenes, synthetic Polish narration. The source project is `projects/demo-fuel-prices/project.json`. Technical evidence is indexed in [VALIDATION.md](VALIDATION.md). Authentic portraits show historical institutional context in 2024; the pump number is explicitly illustrative.

## What was inspected

- Both 18-sample contact sheets were opened, followed by full-resolution evidence, geographic and chart frames.
- Five sequences of eight decoded draft frames, at 0.1-second steps around 2.7, 5.7, 8.1, 12.6 and 16.1 seconds, were opened to inspect transition progression. These are retained under the project's `renders/inspection/` directory.
- Final encoded frames at 4.2, 7.4, 11.8, 14.5 and 18.5 seconds were checked for text, asset crop, factual labels, line reveal and geography. The final chart frame was checked separately.
- Browser integration independently tested exact backward seeking, independent workers, cache reuse and corrupted-frame repair. Gallery integration reconstructed DOM, Canvas and Three.js layers at the same time and compared their pixels.
- Audio was decoded and probed: the narration and final audio both span 19.6 seconds, mono 48 kHz. Source peak is −2.6 dBFS and mean level is −21.8 dBFS. The six original synthesized phrases were preserved and padded, not accelerated or cut. This session does not claim a human listening review or word-level alignment verification.

## Explicit revision passes

| Time / surface             | Observed problem                                                                                                                | Revision and inspected result                                                                                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.7–5.7 s, portraits       | Original source crops gave dissimilar apparent framing.                                                                         | Equal portrait windows, matched neutral treatment and individual source crops. Faces and labels are readable. Tusk's face remains about 10–15% larger; exact equality would require a different authentic source image.                                                      |
| 5.7–8.1 s, evidence        | A shortened Article 217 excerpt omitted words without marking the omission. The original layout also needed stronger hierarchy. | Shorter checked excerpt with explicit `[…]`, source attribution and reconstruction label. Enlarged text and a timed highlighted conclusion. Verified against the [RPO source](https://bip.brpo.gov.pl/pl/kategoria-konstytucyjna/art-217-zasady-nakladania-podatkow?page=2). |
| 8.1–12.6 s, mechanism      | Reveals were too compressed and labels too small.                                                                               | Authored sequential beats at 0.4, 1.3, 2.2 and 3.1 seconds, larger labels and useful secondary descriptions. The complete causal order is visible before the next scene. The diagram remains qualitative.                                                                    |
| 12.6–16.1 s, geography     | The 20-million-barrel metric appeared too late.                                                                                 | Reveal moved to local 1.1 seconds, providing roughly two seconds of settled reading. Dates and schematic-route qualification remain visible.                                                                                                                                 |
| 16.1–19.6 s, chart         | Area fill could precede the line; duplicated series ticks and early annotation could disclose unrevealed observations.          | Shared chronological clip for line, points and fill; annotation gated by April's position; unique month ticks and honest 70–95 USD scale with five-dollar steps. The full six-month reversal is shown.                                                                       |
| Gallery cuts / HTML        | Several scene-start frames had nearly no contrast; the HTML heading exceeded its line box.                                      | Titles remain present on cuts, and the DOM heading uses a more generous line height. Gallery QA now completes all 45 samples; only the intentional silent-demo warning remains.                                                                                              |
| Reduced resolution / fonts | Canvas/WebGL sizing and a system monospace font weakened reproducibility.                                                       | Custom hosts scale from design coordinates. Barlow Condensed, Manrope and IBM Plex Mono are bundled and loaded before readiness. Backward-seek, worker and gallery comparisons pass.                                                                                         |

## Creative score and release judgment

Scores assess this short demonstration, not the framework's potential. Motion is assessed through decoded sequential samples; pacing is consequently provisional until a listening review.

| Dimension          | Weight | Score / 5 | Evidence / remaining improvement                                                                             |
| ------------------ | -----: | --------: | ------------------------------------------------------------------------------------------------------------ |
| Visual relevance   |     14 |         4 | Each scene tracks the corresponding phrase; the opening establishes the question.                            |
| Added information  |     14 |         4 | Legal basis, geographical constraint, dated volume and six monthly prices add information beyond speech.     |
| Hierarchy          |     12 |         4 | One clear focal element; secondary sources are intentionally small.                                          |
| Data integrity     |     14 |         5 | Retained primary sources, historical dates, honest axes and explicit illustrative/estimate labels.           |
| Motion quality     |     10 |         4 | Deterministic sequential reveals settle; the full chart hold is brief.                                       |
| Transition quality |      8 |         3 | Route-to-line carries geometry; focus-through and match-cut still rely visibly on opacity and camera motion. |
| Pacing             |     10 |         3 | Six modes in 19.6 seconds are brisk; the finished series holds for only about 0.6 seconds.                   |
| Variety            |      5 |         5 | Object, portraits, evidence, mechanism, geography and data serve distinct reasoning tasks.                   |
| Asset quality      |      5 |         4 | Authentic high-resolution portraits and local geographic geometry; face scale could match more closely.      |
| Coherence          |      5 |         5 | One consistent palette, typography, source treatment and compositional grid.                                 |
| Originality        |      3 |         3 | Useful visual reasoning, with intentionally general-purpose component layouts.                               |

**Weighted result: 80.6/100**, below the recommended 85/100 editorial release target. The film is a finished, technically verified framework demonstration, not a claim of broadcast-ready editorial polish. To cross the higher target for an actual episode, use the user's recorded narration, allow longer evidence/chart holds, and direct more specific shared-object transitions. Do not raise the score merely because technical tests pass.

## Scope limits

The sources are historical, not a report of current prices or officeholders. The narrative does not establish that a Hormuz event caused the plotted Brent changes. No measured tax breakdown or live traffic data is implied. Six vertical sample frames were inspected; there is no completed vertical film. No publishing or independent legal/media-rights approval was performed.
