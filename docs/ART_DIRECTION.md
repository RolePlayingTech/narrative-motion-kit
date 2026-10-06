# Choose an art direction for the film

The production agent chooses a style autonomously from the subject, the available evidence and the intended viewing conditions. Do not ask the user to pick a palette for every film. An explicit user preference takes precedence. A preset is a coherent starting point, not a requirement to make every frame look the same.

Before the storyboard, record the selected `project.theme`, a one-paragraph rationale and the treatment of photographs, maps, evidence and data in `scenes/art-direction.md`. Explain what the visual language helps the audience understand. Inspect two contrasting frames before applying the direction to the whole film.

## Implemented presets

| Theme       | Best fit                                                                 | Visual language                                                                                                  | Direction of motion                                                                                                                        |
| ----------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `reportage` | Contemporary economics, policy, institutions, investigative explanations | Ink black, warm paper, restrained vermilion, muted mint; large photographs, large figures, bright evidence pages | Short opaque changes of composition, controlled image masks, staged mechanisms. Switch to a paper page for inspection.                     |
| `archive`   | History, biography, archival sources                                     | Warm charcoal, parchment, restrained brass and sage; archive framing and attributed document excerpts            | Allow time to examine photographs and dates. Use modest document focus and chronology; do not manufacture aged evidence.                   |
| `chronicle` | Narration-led history, changing states, wars, political systems and long-form historical storytelling | Warm near-black, bone paper, oxblood and brass; atlas-like maps, authentic archive material, deterministic grain | Weighty reveals, readable map construction, restrained camera moves and semantic transitions; avoid faux-antique spectacle. |
| `atlas`     | Geography, infrastructure, trade, geopolitical context                   | Deep blue, sand, pale teal; geography and route structure dominate                                               | Establish location, approach the region, identify the passage, then show the quantity. Route movement must explain a spatial relationship. |
| `technical` | Technology, systems, science, engineering                                | Midnight blue, cyan and restrained warm contrast; diagrams and shared axes                                       | Build relationships in stages; align beats with steps of the explanation. Canvas/Three.js only when spatial reasoning benefits.            |
| `editorial` | General analytical explainers or compatibility with earlier projects     | Charcoal, ivory, gold and cyan; restrained editorial grid                                                        | Plain comparison and measured reveal. Avoid relying on the header as the only source of variety.                                           |

For historical Świadek Dziejów productions, start with `chronicle` and read [the Chronicle style guide](HISTORY_STYLE.md). It bridges maps, archival material and evidence without turning the film into a faux-medieval theme. Use `archive` when source examination/biography dominates and `atlas` when geography itself dominates.

`scene.tone: "paper"` creates a light page within the selected direction, with readable dark text and a darker accent. The default tone uses the project's background. Alternate tones when the reasoning changes, such as from a person to a source passage, not according to a fixed dark/light pattern. A custom raster or HTML layer currently owns its own background and requires separate inspection.

## Composition is more than color

- Choose a dominant object: a face, a price, a short quotation, a place, or a trend. Scale that object for the intended player. A small card in a large empty frame is rarely cinematic.
- Shorten supporting labels while preserving the exact claim, unit and date. Secondary source details belong in the delivered source list as well as concise on-screen attribution.
- Use the `flow.nodes[].icon` vocabulary (`oil`, `refinery`, `ship`, `pump`, `money`, `document`) only when it explains a concrete process. Otherwise keep plain nodes.
- Use the atlas map composition for geographic detail plus a quantitative margin. A map's coastline, islands and borders must come from a retained dataset, never generated artwork or improvised SVG paths.
- Prefer image masks, progressive route/diagram construction and semantic geometry bridges over a cloud of decorative effects. Keep every effect deterministic and preserve readable holds.
- The current schema allows presets and light pages; detailed animation is still directed through beats, camera choices and transitions. Theme tokens do not magically rewrite choreography.

## Current demonstration

The fuel-price demo uses `reportage`: dark opening, symmetric archival portraits, a light constitutional quotation, a dark illustrated supply chain, a light regional atlas and a light data chart. The accent carries attention, not party affiliation. Narration duration is preserved; the chart completes at local 2.1 seconds so the viewer can inspect its ending for about 1.4 seconds.

For a different topic, make a fresh choice. Do not copy this sequence merely because it is the demo.
