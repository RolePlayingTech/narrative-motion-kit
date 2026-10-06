# Chronicle — historical film art direction

`chronicle` is the default art direction for narration-led historical films in the Świadek Dziejów style: states rise and fall, borders change, archival evidence appears, battles and political mechanisms need explanation, and the viewer must always know **where, when and why** something is happening.

The intended look is **modern historical atlas + serious documentary**, not a theme-park imitation of the past. It should feel authored, cinematic and tactile without sacrificing factual clarity.

## Quick start

Set the project theme:

```json
{
  "theme": "chronicle"
}
```

Use `tone: "paper"` for documents, constitutions, treaty clauses, quotations, compact evidence panels and selected data scenes. Do not alternate dark/paper mechanically; change surface when the reasoning changes.

## Core palette

| Role | Token / color | Use |
| --- | --- | --- |
| Deep ground | `#171916` | default background; near-black with a warm olive bias |
| Raised panel | `#242620` | diagram blocks, dark cards, secondary surfaces |
| Bone paper | `#e8dec7` | evidence, archive mounts, historical atlas land |
| Ink | `#25251f` | text and rules on paper |
| Warm ivory | `#f1e9d8` | primary text on dark scenes |
| Weathered taupe | `#a79b85` | captions, sources, secondary labels |
| Oxblood | `#a94b3a` | main narrative accent: border change, conflict, key thesis |
| Brass | `#c2a15f` | secondary emphasis: dates, institutions, neutral highlight |
| Warning vermilion | `#d06754` | warnings/errors only |
| Grid charcoal | `#3c3b31` | axes, separators, inactive structure |

Do not use oxblood to mean “bad side” and brass to mean “good side”. In political history color must encode narrative category, chronology or geography rather than moral judgment.

## Typography

The preset deliberately uses the production fonts already expected by the renderer.

### Display — Barlow Condensed

Use for scene theses, dates that function as visual anchors, large place/state names, large numeric facts and short quotations/highlights.

Recommended weight: **600**, occasionally **700** for one-word/one-number hooks. Prefer sentence case or compact uppercase labels. A main title should normally fit in **one or two lines**. Do not shrink a thesis until it becomes a subtitle.

### Body — Manrope Variable

Use for explanatory labels, captions, roles, descriptions, source summaries and readable map annotations. Recommended weight: **500** for normal labels, **600** only for a meaningful distinction.

### Technical/date/source — IBM Plex Mono

Use for years/date ranges treated as metadata, source labels, coordinates/scales, chapter markers and short qualifiers such as “TRAKTAT / 1658”, “ŹRÓDŁO” or “SZACUNEK”. It should look editorial, not like a terminal.

## Texture and surface

The `chronicle` renderer adds a deterministic finishing layer:

- sparse static grain;
- restrained edge vignette;
- no animated noise;
- no random scratches;
- no fake film burns;
- no sepia filter over evidence.

The texture must never reduce map-label or source readability. On `tone: "paper"` it becomes ink-like and restrained; on dark scenes it appears as faint light flecks plus a dark edge vignette.

This texture is a **surface treatment**, not historical evidence. Never use it to disguise low-resolution material.

## Composition

Use one dominant object per shot.

Typical 16:9 hierarchy:

- hook/title: one thesis or date occupying roughly 45–70% of the usable visual weight;
- map: geography occupies about 65–75% of the meaningful area, with the metric/legend in the remaining margin;
- archival image: large image or portrait, not a small card floating in empty space;
- evidence: paper surface dominates, with one highlighted clause/number;
- comparison: equal visual treatment on both sides.

The built-in header is part of the identity, but it must not become the main visual. The historical content below it should carry the scene.

## Maps

For historical geography combine this guide with `docs/HISTORICAL_MAPS.md`.

For `chronicle + composition: "atlas"` the renderer uses bone land, desaturated blue-grey water, dark ink labels and oxblood for the main route/change/active event.

Rules:

1. Establish the geography before highlighting the event.
2. The active territorial change should be the strongest colored object.
3. Use brass for a secondary comparison, previous border, neutral institutional layer or selected date.
4. Approximate/disputed frontiers should not look as certain as documented borders.
5. Use `equal-earth` when relative territorial area is part of the argument.
6. Do not use glowing neon borders, fake 3D extrusion or constant camera orbit.
7. A map may remain still for a second after the important reveal. Readability beats perpetual motion.

### Recommended historical-map beat

For a 12–20 second narrated map:

1. 0.0–0.7 s — establish region and date;
2. 0.7–2.0 s — reveal the main state/territory;
3. next spoken phrase — reveal the named gain/loss/route;
4. next spoken phrase — introduce one secondary label or comparison;
5. final 0.8–1.5 s — hold the settled result.

## Archival photographs and portraits

Authentic material should remain recognizably authentic.

Preferred treatment:

- large crop with deliberate subject focus;
- warm paper mount for `treatment: "archive"`;
- thin oxblood/brass structural accent;
- original image color unless a source-specific editorial reason justifies another treatment;
- subtle push-in only when it changes attention, typically 1–4% over several seconds.

Avoid automatic sepia, fake dust/scratches baked into photographs, generated portraits masquerading as archive material, excessive Ken Burns motion, and mosaics of tiny images when one image would explain the point.

## Documents and quotations

Use `tone: "paper"` and the `evidence` family.

The source should feel like a document being **examined**, not a prop being theatrically aged.

Good: bone paper, dark ink, one oxblood highlight, an authentic source image underneath at low opacity when useful, and one clause/number/consequence emphasized.

Avoid burned edges, decorative wax seals, quill animations, fake handwriting overlays and illegible scans shown only “for atmosphere”.

## Motion language

The style is deliberate and weighty. Historical importance comes from hierarchy and timing, not from shaking everything.

| Motion | Typical duration | Preferred feel |
| --- | ---: | --- |
| scene/header settle | 0.45–0.70 s | `easeOutCubic` |
| short label/date reveal | 0.25–0.45 s | fast, clean |
| archival image curtain/reveal | 0.55–0.85 s | measured |
| map border/territory reveal | 0.80–1.40 s | readable construction |
| battle/campaign route draw | 0.60–1.10 s | directional, not frantic |
| geographic camera move | 1.20–2.20 s | `cinematic` |
| evidence highlight | 0.35–0.60 s | precise |
| semantic transition | 0.45–0.80 s | connected to meaning |
| final readable hold | 0.80–1.50 s | mostly static |

Use `spring`, `overshoot` and `elastic` extremely rarely in historical editorial scenes. They usually feel like interface animation rather than documentary motion.

`shake` is not a default battle effect. If a single impact genuinely benefits from it, keep it short and subtle; never shake documents, portraits or maps continuously.

## Transition vocabulary

Prefer transitions that preserve an idea:

- map → map: stable camera, reveal/loss layer, or restrained dissolve;
- route → chart: `route-to-line` when the line genuinely changes semantic role;
- portrait → document: focus-through or clean cut after the spoken pivot;
- document → map: match position/color of the highlighted place/date where possible;
- chronology jump: short fade/cut with an explicit new date.

Do not use a different transition for every scene. Repetition creates identity.

## Battle and crisis sequences

Speed may increase, but information must stay legible.

A good escalation pattern:

1. calm map establishes state;
2. one attack direction enters;
3. second front appears only when narration names it;
4. important place/date locks on screen;
5. destruction/loss is shown by a controlled state change;
6. hold the consequence.

Avoid showers of arrows, explosions and particles that no longer correspond to specific narration.

## Świadek Dziejów character

When the Świadek character appears in a mixed production, treat him as the stable visual anchor rather than another historical artifact.

Recommended: neutral/dark background compatible with `#171916`, warm ivory typography and oxblood accent for the current thesis. Maps/documents can enter beside or behind him, but should become full-screen when spatial/detail reading matters.

Do not apply archive grain or sepia directly to the character unless the scene explicitly turns him into an illustrative historical tableau.

## Anti-slop rules

Never default to burning parchment, floating dust storms, random ink splashes, glowing gold borders, embossed 3D maps, endless parallax, “epic” camera shake, generic swords/crowns/eagles, AI-generated pseudo-paintings used as evidence, red arrows covering half the map or tiny unreadable citations added only to look academic.

If removing an effect makes the historical claim clearer, remove it.

## Agent workflow

Before storyboarding a historical film:

1. choose `theme: "chronicle"` unless another preset clearly serves the argument better;
2. create `scenes/art-direction.md` and state why `chronicle` fits;
3. list the film's repeated visual motifs: e.g. border, date, treaty, portrait, grain route;
4. decide which scenes switch to `tone: "paper"`;
5. plan map colors/categories before animating them;
6. align important visual reveals to spoken words in `scenes/sync-cues.md`;
7. render at least one dark map frame, one paper evidence frame and one archive/photo frame before committing to the whole film;
8. inspect the texture at full resolution and at small-player size;
9. revise if the look becomes decorative, muddy or nostalgic at the cost of explanation.

For a Świadek Dziejów historical film, `chronicle` is the starting preset, not a command to make every frame identical. Switch to `atlas`, `archive` or a custom composition only when a scene's reasoning genuinely needs it.
