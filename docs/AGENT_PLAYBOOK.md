# Agent playbook: from an input file to a synchronized film

This is the production contract for an AI agent operating Narrative Motion Kit. Read it before building a film. The user supplies a file; your job is to understand its contents, direct the visuals, acquire useful material, and deliver an inspected film. Make routine research, composition and style decisions autonomously.

## 1. Inspect the input before choosing scenes

Locate and open the actual supplied file. Check its format and contents, not just its name. Preserve the original. Use `ffprobe` for media duration, streams, sample rate and channels; use an appropriate reader for text or documents.

- **Narration audio:** this is the master timeline. Copy it locally, configure `narration.file`, and measure its duration with `audio:ingest`.
- **Video containing narration:** inspect the audio streams and identify the intended narration. Retain the original video; if extracting a working audio file with ffmpeg, preserve the timing and record the selected stream and any offset. Do not silently remove pauses or accelerate speech.
- **Transcript, script or document without audio:** analyze its meaning and structure, but do not invent second-level timing. A precisely synchronized final film requires the recording, or an explicitly requested synthetic narration. Continue research and storyboarding while identifying this dependency.
- **Several inputs:** distinguish the master recording from supporting references. Compare supplied text to the actual speech; the recording wins when they differ. Clarify only a genuinely ambiguous choice of master file.

Analyze the entire recording before composing shots. Write `transcript/input-analysis.md` with duration, input roles, main argument, rhetorical structure (question, context, evidence, contrast, mechanism, conclusion), people, places, dates, quantities, pronunciation uncertainties and transitions of thought. Identify which details the viewer must see to follow the explanation. Do not turn each sentence mechanically into a slide.

## 2. Establish speech timing from evidence

Obtain a transcript using the available audio tools, supplied timestamps, or a configured transcription provider. Correct names, numbers, negations and dates against the recording. Preserve pauses and false starts in the timing even when the display text is shorter.

Use phrase timestamps across the recording and word timestamps for important cues: a person's name, place, number, comparison, causal step or reversal such as “but then it fell.” If an accurate transcript exists without timing, use an available forced aligner or manually checked audio segments. An ASR timestamp is a candidate to verify, not proof of accuracy.

Save accepted timestamps to `transcript/aligned.json` using the segment/optional-word format in [AUDIO.md](AUDIO.md), then ingest them:

```bash
npm run audio:ingest -- --project my-video --timestamps transcript/aligned.json
```

The repository's plain-text provider allocates time by word count. It is useful for an initial sketch, **not precise synchronization**. Silence and waveform intensity do not reveal which word is being spoken. The repository does not bundle speech recognition or forced alignment; use tools actually available in the environment. Do not claim listening or word-level verification if you cannot perform it. Keep uncertain cues explicit and do not describe the result as fully synchronized until they are resolved.

For a long recording, work in overlapping audio chunks and convert every timestamp back to the original absolute timeline. Check joins, the beginning and the end for drift. Never restart time at zero for each chunk in the final project.

## 3. Build a speech-to-screen cue sheet

Before rendering, create `scenes/sync-cues.md`. This is an editorial record, not an extra schema field or a file automatically consumed by the renderer. Include every meaningful visual change and the spoken phrase it serves. Cover the whole recording, including intended holds and pauses.

| Field           | Record                                                                      |
| --------------- | --------------------------------------------------------------------------- |
| Speech interval | Absolute start/end in seconds and the exact spoken phrase                   |
| Timing evidence | Word/phrase timestamps, alignment method and checked/uncertain status       |
| Visual purpose  | What viewers should understand at this moment                               |
| Object / source | Person, image, map, quantity or diagram step; local asset/source IDs        |
| Visual timing   | Entry start, first clearly recognizable/readable moment, highlight and exit |
| Implementation  | Scene ID, absolute boundary and local cue time                              |
| Review          | Observed offset, correction and rechecked time range                        |

Match **what is clearly visible** to **what the narrator is saying now**, not merely to the general subject of the paragraph. For example:

- On a consequential person's first introduction, bring in their verified portrait and name while that person is introduced; hold them while their role is explained.
- When a place is named, locate it on real geography; show the relevant route or constraint as the narration explains it.
- When a quantity is spoken, make that exact quantity and its unit readable then. Do not let an unrelated intermediate counter value dominate the spoken number.
- Reveal a process stage as its cause or action is explained. For a comparison, keep both necessary objects available rather than replacing one before the comparison is understood.
- Keep a qualified statement qualified on screen. Do not show a proposal as an enacted result, or an illustrative image as proof of a specific event.

A short visual lead can orient the viewer, and a deliberate hold can finish a thought. Record the reason; do not disclose a later conclusion early or leave the previous subject onscreen through an unrelated claim. Second-by-second coverage means continuous semantic alignment, **not a cut every second**.

### Cue timing is not animation start time

Account for entrance duration and incoming transitions. If a verified spoken cue begins at 12.40 s, a reveal needs 0.35 s to become readable, and the scene starts at 11.00 s, a candidate entry is 12.05 s, or local 1.05 s. These numbers are a fictional timing example, not transcript evidence. Check the actual rendered result: easing, masks and transition occlusion can change the readable moment.

Use frame precision where the audio evidence supports it. As a practical review target, investigate unexplained offsets greater than roughly 0.2 seconds at critical names, numbers and emphasis; this is an editorial target, not an automatic QA guarantee or a reason to fabricate subsecond precision. Also inspect the surrounding phrase for semantic mismatch.

The supported timing controls differ by family. Read [the scene timing contract](SCENE_CATALOG.md#authored-reveal-timing): item-order beats drive sequential diagrams, the last beat drives an evidence highlight/map metric, and a line chart's final beat controls completion while its second beat can cue annotation. Portraits, statistics and photos have their own entrance behavior. Setting a beat does not automatically time every element. Adjust scene boundaries or the appropriate renderer when needed; use a deterministic custom extension only when the existing DSL cannot express the required cue. Keep scene intervals consecutive and transitions inside the incoming scene.

## 4. Research and acquire useful images

Use internet research and download local assets when they add recognition, context, explanation or evidence. Do not wait for the user to supply every photograph. First write what the asset must communicate, then search for the exact person, place, object, event or period. Prefer original files from official institutions, archives, museums, Wikimedia Commons and other sources with documented reuse terms.

**People:** an important named person should normally be shown with an authentic portrait or relevant archival image. Verify identity, date, historical role and context on the source page. A passing mention does not require a disruptive new portrait. Record why a portrait was omitted when identity matters (for example, no verified usable image); use a clear name/role treatment instead of an AI lookalike. Do not generate real-person portraits as documentary evidence.

**Places and events:** distinguish a photo of the actual event from a general illustration of the location. Check date, location and caption. Label archive or illustrative material when viewers might otherwise assume it depicts the narrated event. Real maps must use retained geographic data with an appropriate scale and period.

**Explanations and data:** prefer a purpose-built diagram or sourced chart when stock imagery would add no understanding. Generated imagery can serve a clearly labeled illustration, not an invented photograph, document or factual map.

Open the source page and original asset; a search thumbnail is not sufficient verification. Inspect the downloaded image at the intended crop, resolution and zoom. Keep the original and record derivatives separately. Register the local file, author, source URL, retrieval date, rights, role, dimensions and hash in the asset manifest. Record an image's planned spoken cue in the cue sheet. Preserve credits when cropping or recoloring. Follow [ASSET_POLICY.md](ASSET_POLICY.md) and [RESEARCH_POLICY.md](RESEARCH_POLICY.md).

If a source cannot be downloaded or rights are unsuitable, find another authentic source or use a clearly described alternative. Report a material gap instead of silently substituting unrelated imagery. Acquire before rendering; final rendering must not fetch live websites.

## 5. Direct and implement the film

Choose a style from [ART_DIRECTION.md](ART_DIRECTION.md) based on this recording's subject and material. Do not impose the demo's palette or ask the user to choose routine design details. Write the rationale and storyboard, then implement through the scene DSL.

Keep one dominant focus, legible names/units/dates, and enough time to read the result. Images should occupy meaningful screen space. Use transitions to preserve an idea or change scale; do not sacrifice synchronization for effects. Preserve the original audio and overall duration. A new recording requires new timing analysis; never reuse the demo's six time blocks as a template for arbitrary narration.

## 6. Verify synchronization with the actual soundtrack

Render a draft with the master audio. Play or inspect it using available audio/video tools at normal speed. Compare each cue to the spoken words. Check before, during and after every critical name, number, claim reversal and scene transition. Verify portrait identity/crop, map position, units, qualifier visibility and the length of the final hold.

Also inspect at least one frame in every second of the timeline; use denser frames around critical cues. For example:

```bash
npm run render:contact -- --project my-video --every-seconds 1
npm run render:range -- --project my-video --from 11 --to 14
```

Open the contact sheets and the affected clips. Contact sheets and automatic QA alone cannot establish audio/visual synchronization. Record discrepancies in `scenes/sync-cues.md` and timestamped critique in `renders/REVIEW.md`. Fix early/late reveals, displaced emphasis, irrelevant holds and transition occlusion, then recheck the affected ranges. Do at least one explicit revision pass.

If listening/alignment tools are unavailable, complete independent work and identify exactly which timing checks remain unverified. Do not mark them passed from transcript text or from video metadata alone.

## 7. Finish and deliver

Render the final film, run project/video QA, generate sources and inspect encoded samples with audio. Follow [AI_WORKFLOW.md](AI_WORKFLOW.md) and [CLI.md](../scripts/CLI.md) for commands. Return actual paths to the film, source list, contact sheets, technical QA, creative review and synchronization record. State any remaining timing, source or asset limitation. A plan, a silent preview or a passing schema check is not the finished narrated film.
