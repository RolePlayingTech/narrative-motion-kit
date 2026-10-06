---
name: create-documentary
description: Create and revise complete narration-led documentary explainer videos using this repository's scene DSL, research records, render tools, and visual quality workflow.
---

# Create a documentary explainer

Use the repository's implemented workflow to finish the requested film. This skill applies to video projects in this motion framework, not general website or image design.

Read the repository [AGENTS.md](../../../AGENTS.md), [AI workflow](../../../docs/AI_WORKFLOW.md), and [scene catalog](../../../docs/SCENE_CATALOG.md). Consult [CLI commands](../../../scripts/CLI.md) rather than guessing flags. The [master prompt](../../../prompts/CREATE_VIDEO.md) describes the complete production deliverable.

For each supplied input file, read [the agent playbook](../../../docs/AGENT_PLAYBOOK.md). Inspect the actual recording and its argument, establish verified phrase/critical-word timings, and create a speech-to-screen cue sheet. Align readable moments rather than just animation starts; validate critical cues with the soundtrack and review the timeline second by second. Plain-text duration allocation does not prove synchronization. Document unavailable listening/alignment capabilities instead of claiming checks you could not perform.

Proactively acquire internet images when they improve recognition, explanation or evidence. Normally show important named people using authentic, identity-checked portraits. Verify source, period, context and reuse terms; cache originals and register provenance before rendering. A generated likeness is not documentary evidence. Use diagrams where they explain more than stock imagery.

For narration-led historical productions, start from the [Chronicle historical style](../../../docs/HISTORY_STYLE.md) and `theme: "chronicle"` unless a different preset has a clear explanatory advantage. Chronicle defines the palette, typography, map treatment, texture and motion language; use it as a coherent system rather than copying individual decorative effects.

When the documentary uses historical borders or territorial change, read [historical maps](../../../docs/HISTORICAL_MAPS.md). Treat map construction as part of the film task: research, acquire, derive and validate the required project-local GeoJSON/TopoJSON yourself rather than assuming a dated boundary dataset is already bundled or asking the user to prepare it. Keep the geometry's date, meaning, confidence, license and attribution explicit; do not hand-draw authoritative-looking borders from memory. Use Equal Earth rather than Mercator when the visual argument depends on relative area.

Preserve these production decisions:

- Narration determines duration and semantic edits. Mark approximate alignment; inspect key phrases against audio.
- Choose each shot's information gain before choosing an effect. Prefer reusable scene families, then custom composition where justified.
- Verify claims, label estimates/scenarios, and cache media with rights and provenance. Read [research](../../../docs/RESEARCH_POLICY.md) and [asset policy](../../../docs/ASSET_POLICY.md) when acquiring material.
- Render a contact sheet and draft, open them, critique actual output, and perform an explicit revision pass. Use the [weighted rubric](../../../docs/QUALITY_RUBRIC.md); its release target is 85/100 with each dimension at least 3/5.
- Render final video with narration, run QA, generate sources, and return the real artifacts and unresolved limitations. A storyboard alone does not complete a request to create a film.

The skill uses existing repository scripts and does not require a paid transcription, image-generation, or search provider. Use available tools for optional acquisition, and register their outputs locally. Do not invent unavailable tools or report checks that were not run.
