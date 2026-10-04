# Storyboarding decisions

Each scene is an argument made visually. The schema requires a thesis and information added beyond narration so an agent must state why the shot exists.

## Visual modes

The DSL uses these exact mode names. They are editorial labels, not alternate renderers.

| Mode         | Question answered                             | Useful families                                 |
| ------------ | --------------------------------------------- | ----------------------------------------------- |
| `EVIDENCE`   | What supports the claim?                      | evidence, photo                                 |
| `MECHANISM`  | How does this work?                           | flow, breakdown                                 |
| `SCALE`      | How much, compared with what?                 | statistic, comparison, line-chart, bar-chart    |
| `CONTEXT`    | Where and when does it fit?                   | geo-flow, timeline, photo                       |
| `CHARACTER`  | Who is involved?                              | photo, portrait-duel                            |
| `CONTRAST`   | What differs or conflicts?                    | portrait-duel, comparison, evidence             |
| `METAPHOR`   | Which abstraction benefits from illustration? | custom, photo, flow                             |
| `TRANSITION` | Why does this idea lead to the next?          | semantic transition plus either adjacent family |

`MECHANISM` serves explanation; `SCALE` serves data. Do not invent `EXPLANATION` or `DATA` enum values in project files.

`recommendScenes(mode, { hasData, hasImages, hasGeography })` from `packages/scenes/index.ts` returns matching recipes, including their purpose, required inputs, and common misuse. For example, `recommendScenes('CONTEXT', { hasImages: false, hasGeography: true, hasData: false })` returns geographic and timeline options while excluding photographs and charts. Supply `false` for missing inputs; omitted flags do not filter anything. This is a deterministic shortlist to support a decision, not transcript analysis or an automatic storyboard generator.

## A useful storyboard record

For every interval write: narration phrase, visual purpose, scene type, primary object, subordinate information, source/claim IDs, entry and exit logic, camera intent, local reveal beats, and information gained. The DSL stores the renderable subset; a Markdown storyboard can preserve narration wording and editorial reasoning.

Maintain a separate `scenes/sync-cues.md` using [the playbook's cue-sheet fields](AGENT_PLAYBOOK.md#3-build-a-speech-to-screen-cue-sheet). Link each meaningful visual change to verified speech timing, distinguish entry start from first readability, and record the observed offset after reviewing audio/video. This planning record is not loaded by the renderer; implement its timings using the supported scene controls.

Example reasoning for a legal mechanism:

- Spoken topic: “Politycy zapowiadają niższe podatki.”
- Thesis: a proposal passes through institutions before changing law.
- Added information: legislative initiative is shared, and presidential review follows parliament.
- Visual: balanced institutional comparison, then a clearly labeled constitutional paraphrase, then a simplified process.
- Transition: the highlighted legal phrase becomes the first process node.
- Check: the flow must not imply automatic signature or guaranteed lower pump prices.

## Timing

Scene `start` and `end` are absolute seconds. `beats[].at` is local time since scene start. Scene intervals must cover `[0, duration)` consecutively and in order. A transition belongs to the incoming interval. Use an explicit scene for an intentional pause; do not leave a timeline gap.

Check the [catalog's timing contract](SCENE_CATALOG.md#authored-reveal-timing) when assigning beats. Sequential item scenes use beats in item order, while an evidence highlight or map metric uses the last cue. Beats are not universal word-alignment controls for every object.

Give a reveal a readable result. A 1.5-second animated build followed immediately by a cut may leave zero time to understand the diagram. For large changes in geographic or conceptual scale, establish the new frame before presenting another new fact.

## Review before coding

Read the storyboard with pictures hidden. Is each information gain specific? Then read it with narration hidden. Does it still express a coherent chain of ideas? If both fail, implementation quality will not rescue the plan.

Flag three repeated scene families, unsupported numeric claims, unnamed geographic coordinates, excessive simultaneous labels, or transitions whose reasons merely say “looks cinematic.” Rewrite those decisions before finalizing assets.
