# Template creation smoke fixture

Created with `npm.cmd run new:project -- qa-template-fixture` on 2026-10-04 to verify the documented new-project workflow. This is the unchanged silent template, not a documentary deliverable.

Verified:

- The command created a project manifest with its new ID and the narration, transcript, assets, generated, research, data, scenes, and renders directories.
- `npm.cmd run qa -- --project qa-template-fixture --static-only` passed with the expected `silent-demo` warning.
- `npm.cmd run render:frame -- --project qa-template-fixture --time 3.5 --width 960 --height 540` rendered successfully. The PNG was opened and inspected: both nodes, their connecting arrow, Polish headline, and scene chrome were visible and legible.

Evidence is in `renders/QA.md` and `renders/frames/t-3.5000-960x540.png`. This smoke check does not constitute the audio, final-video, or creative review required for a published film.
