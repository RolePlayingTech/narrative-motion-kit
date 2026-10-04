# Create a complete film with this repository

You are producing a finished explainer for Świadek Dziejów. Use the narration audio provided with this request as the master timeline. Optional transcript, brief, sources, and assets are inputs, not permission to invent missing facts.

Read `AGENTS.md`, `README.md`, `docs/AI_WORKFLOW.md`, `docs/SCENE_CATALOG.md`, and `docs/QUALITY_RUBRIC.md`. Use `scripts/CLI.md` for current commands and `packages/schema/index.ts` for the actual DSL. Inspect the existing demo to understand capabilities, but create a storyboard appropriate to this narration.

Carry the task through to a final rendered film. Do not stop after a plan, storyboard, or code generation.

1. Create a project, copy narration locally, and probe its exact duration. Obtain supplied or provider-generated transcript timing; label approximate alignment and verify key edits against audio.
2. Segment by meaning. For each segment identify the visual purpose, sources/assets needed, one dominant thesis, and information added beyond narration. Ask: “What can viewers understand visually here that speech would explain slowly or poorly?”
3. Research factual claims with appropriate primary sources. Cache authentic documentary assets and geographic/data files. Register source dates, authors/licenses, asset roles, uncertainty, and generation prompts. Use generated imagery only for clearly illustrative purposes.
4. Select the art direction autonomously using `docs/ART_DIRECTION.md`; record the topic-specific rationale. Write the storyboard and implement through reusable scene families. Plan reveal beats, camera intent, and semantic transitions. Keep political treatment symmetric. Use real cached geographic data and inspect coastline, scale and route placement for maps. Use custom code only when it materially improves the story and preserve deterministic absolute-time rendering.
5. Validate and render representative frames, a labeled contact sheet, and a draft with audio. Actually open and inspect these artifacts. Check readability, Polish characters, evidence, scales, geography, hierarchy, pacing, seams, dead stretches, and repeated patterns.
6. Write a timestamped creative review with weighted scores. Make at least one explicit revision pass and recheck changed samples. Aim for at least 85/100 with every dimension at least 3/5; do not hide material defects behind the average.
7. Render final resolution with the original narration, run technical QA including ffprobe checks, generate the source/provenance list, and inspect final representative frames. Keep all final rendering dependencies local.
8. Return clickable paths to the final video, contact sheet, QA report, sources, and review record. Describe meaningful limitations, missing evidence, or explicit illustrative assumptions. Never claim an output was rendered or inspected without doing it.

Make routine creative and technical decisions autonomously within the request. If a required input is genuinely missing, explain that dependency precisely and continue all independent work. Do not fabricate a transcript, a source, a politician's action, a price series, or a successful render.
