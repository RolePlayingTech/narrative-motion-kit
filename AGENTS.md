# Instructions for agents

Build a finished, inspected film from the supplied narration. The governing question is: **what can viewers understand visually that speech would explain slowly or poorly?**

## Read and decide

Read `README.md`, `docs/AI_WORKFLOW.md`, and `docs/QUALITY_RUBRIC.md`. Read the scene catalog before inventing a new component. Use `prompts/CREATE_VIDEO.md` for a complete production brief. `packages/schema/index.ts` and `scripts/CLI.md` are the authoritative schema and command references.

For every new film, follow `docs/AGENT_PLAYBOOK.md`: inspect the actual input file, understand the whole narration and its argument, establish evidenced speech timestamps, and create `scenes/sync-cues.md` before implementation. Match the first readable appearance of people, places, numbers and diagram steps to the relevant spoken words, accounting for entrance and transition duration. Verify against the soundtrack and sample every second; approximate text timing or technical QA cannot certify synchronization.

Actively research and download useful authentic photographs/graphics with local provenance. Normally show an important named person with a verified portrait at their introduction; choose imagery for explanatory value, not keyword decoration. Verify identity, period, context and rights. Do not wait for the user to supply all visual assets or substitute generated likenesses for documentary evidence.

1. Probe narration and preserve its duration. Segment ideas, not equal time blocks. Approximate transcript alignment is not word-level evidence.
2. Research claims and acquire local assets before presenting them as facts. Every quantitative scene needs source references; illustrative values must be visibly labeled. Do not generate political portraits, documents, or historical photographs as evidence.
3. Write a storyboard with one visual thesis, information added beyond narration, reveal beats, and a reason for each transition. Prefer the DSL; custom rendering is an extension point, not the default.
4. Render and **open** the contact sheet. Inspect full-resolution text, representative frames, and transition motion. Record a critique and make at least one explicit revision pass.
5. Render the film, run technical QA, generate sources, and return the actual output paths plus known limitations. Do not stop at a plan or call a render successful without checking the output.

## Invariants

- Frames are functions of project, absolute time, and seeded randomness. No accumulated animation state, unseeded randomness, CSS animations, asynchronous live data, or clock reads in render-critical code.
- Narration owns the timeline. Scenes are ordered, consecutive half-open intervals. Transitions occupy the incoming scene; do not overlap scenes to create one.
- Final rendering uses local assets and bundled fonts. Preserve provenance, asset roles, generation prompts, and source dates.
- Real charts use supplied data with visible units, dates, and honest scales. Route particles are schematic unless actual traffic data backs their counts.
- Keep one dominant focus; reveal complexity in order. Motion must reveal, compare, locate, or connect. Political comparisons receive symmetric treatment.
- The default is 16:9. Inspect a vertical version separately; a crop does not constitute a finished 9:16 composition.

For code changes, run `npm run check` and relevant rendering integration checks. For a project edit, validate, render affected samples, and run project QA; rerender the final when needed. Keep reusable improvements in packages, topic facts in projects, and verified results in the project's review record.
