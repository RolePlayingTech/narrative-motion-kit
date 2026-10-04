# Troubleshooting

Start with the first actionable error. Preserve the project and the failing time, then render the smallest relevant frame/range. Do not suppress browser warnings or replace failed evidence assets with empty placeholders to obtain a green run.

| Symptom                             | Likely cause and useful action                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ffmpeg` or `ffprobe` not found     | Install both executables and add their directory to PATH; reopen the terminal so it sees the change. Check the executables run directly.                                  |
| Chromium executable missing         | Run `npx playwright install chromium` for the installed Playwright version. Linux may also need browser system dependencies.                                              |
| Schema rejects a project            | Read the reported field path; compare with `packages/schema/index.ts`. Unknown fields are rejected deliberately.                                                          |
| Timeline gap/overlap                | Keep ordered consecutive scene intervals from zero to narration duration. Incoming transitions do not require overlap.                                                    |
| Narration duration mismatch         | Run audio ingestion, read the measured duration, and adjust the authored timeline. Do not round a recording to an arbitrary whole second.                                 |
| Asset missing or path rejected      | Use project-relative paths, confirm local files, and avoid traversal or symlinks escaping the project.                                                                    |
| Downloaded image is HTML            | Use the original media URL, not its gallery page. Reacquire the asset and preserve the original page as its provenance.                                                   |
| SHA mismatch                        | Determine whether the file changed intentionally. Preserve the original and update derivative metadata; do not remove hashes merely to pass checks.                       |
| Source or dataset ID missing        | Add the actual record and support, or fix the mistaken ID. An invented citation is not a repair.                                                                          |
| Font or Polish characters fail      | Confirm the bundled font packages/resources load. Inspect the browser error and UTF-8 source text; do not rely on a platform-specific fallback.                           |
| Labels overlap or become tiny       | Shorten copy, reduce simultaneously visible detail, adjust layout, or split the explanation. Estimated fitting cannot make unlimited text readable.                       |
| Map appears in the wrong place      | Check `[longitude, latitude]`, projection/zoom, geographic asset type, and adequate coastline resolution.                                                                 |
| Map closes a strait                 | Use suitable geometry resolution and inspect simplification. Do not redraw geography to fit the story.                                                                    |
| Chart zigzags unexpectedly          | Check numeric x order within each series, duplicated observations, units, and label mapping.                                                                              |
| Custom renderer missing             | Register the renderer and import its module from the shared extension entry point; use the same ID in the project.                                                        |
| Backward seeking differs            | Find accumulated state: counters, mutable random streams, CSS animation, physics integration, or properties not assigned on each update.                                  |
| Custom layer remains in next scene  | Ensure `dispose()` removes DOM/resources/listeners and lifecycle registration is correct.                                                                                 |
| Blank or suspiciously static sample | Inspect the exact frame. It may be an intended hold/transition, but check resources and whether scene-local time drives the reveal.                                       |
| Resume redraws frames               | Inputs/settings/runtime fingerprint may have changed. This is safer than reusing stale images.                                                                            |
| ffmpeg fails or final MP4 is absent | Inspect the actual process error; confirm codec availability, free disk space, readable narration, and valid even resolution. Failed `.part.mp4` is not a completed film. |
| Vertical version feels crowded      | Author shorter vertical titles and a different composition; a dimension override is only the start of adaptation.                                                         |

## Report a reproducible failure

Include project ID/config, command, failing timestamp, error text, Node/Chromium/ffmpeg versions, operating system, and relevant local assets or a minimized substitute. Never include private credentials. Distinguish “the command exited” from “the output passed QA and was inspected.”

For a suspected nondeterministic scene, compare A → B → A in one page and A in a new page. For a suspected source error, preserve the original source URL/date and what was actually rendered. Fix the reusable cause when possible and rerender the affected evidence.
