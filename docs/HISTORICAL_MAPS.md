# Historical maps

Historical maps are evidence, not decorative backgrounds. A border implies a claim about **who controlled what, when, and in what sense**. Treat every polygon, line, label and transition as a sourced statement.

This guide applies whenever a film shows historical states, administrative divisions, military control, territorial claims, cultural regions, trade zones, changing borders, partitions, annexations or unions.

## 1. Separate the question before drawing the map

Do not use one generic "border" layer for different historical ideas. Decide which relationship the narration actually needs:

- **political** — internationally or constitutionally claimed state territory;
- **administrative** — provinces, voivodeships, counties, dioceses or other internal divisions;
- **military-control** — territory actually occupied or controlled at a specified moment;
- **territorial-claim** — a claim that was not equivalent to control;
- **cultural** — a fuzzy or overlapping cultural/linguistic region;
- **trade** — a corridor, network or zone of exchange;
- **other** — only when none of the above describes the source.

If narration says "wojska weszły do Moskwy", do not shade Muscovy as annexed territory. If a treaty changes a legal boundary, do not silently show a later administrative map as if it represented that exact date.

## 2. Every reusable historical dataset gets a sidecar manifest

Store historical geometry as local GeoJSON/TopoJSON and keep a manifest beside it. Use the contract implemented in `packages/maps/historical.ts`.

Minimum example:

```json
{
  "version": 1,
  "crs": "EPSG:4326",
  "title": "Example historical boundary series",
  "sources": [
    {
      "id": "source-a",
      "title": "Dataset title",
      "url": "https://example.org/dataset",
      "license": "CC BY 4.0",
      "attribution": "Institution / author",
      "publisher": "Institution",
      "acquiredAt": "2026-10-06",
      "redistribution": "allowed"
    }
  ],
  "layers": [
    {
      "id": "polity-1600",
      "series": "political-boundary",
      "asset": "polity-1600-geojson",
      "label": "Polity around 1600",
      "kind": "political",
      "startYear": 1600,
      "endYear": 1650,
      "sourceIds": ["source-a"],
      "confidence": "reconstructed",
      "cartographyLabel": "Boundary reconstructed for c. 1600 · source: Institution"
    }
  ]
}
```

`endYear` is exclusive. Use `null` only when a layer remains valid indefinitely. Two layers in the same `series` may touch at a year but may not overlap. Separate simultaneous concepts into separate series.

### Confidence

Use the strongest label the source actually supports:

- `documented` — defined by a treaty, survey, legal act or equivalent source with reasonably explicit geometry;
- `reconstructed` — scholarly cartographic reconstruction from historical evidence;
- `approximate` — useful spatial estimate whose boundary should not be read as exact.

Confidence is not a beauty setting. It tells the renderer and the editor how literally the line may be read.

## 3. Licensing is part of the data

A URL is not permission to copy a dataset into this repository.

Each source records:

- source URL;
- license name;
- required attribution;
- publisher/author when known;
- acquisition date;
- `redistribution`: `allowed`, `restricted` or `unknown`.

Only copy a dataset into the repository when redistribution is explicitly allowed and its attribution/license can coexist with this project's media policy. Keep third-party data under its own license; the repository's MIT software license does not relicense map data.

A source marked `restricted` or `unknown` may still be useful as research or as an acquisition target in a local project, but an agent must not silently commit it as reusable repository data.

## 4. Projection is an editorial choice

The built-in geographic renderer supports:

- `mercator` — useful for routes, regional orientation and many local geographic explanations;
- `equal-earth` — prefer this when **relative area** is part of the claim.

Mercator does not preserve area. Never demonstrate "three times larger" by comparing apparent polygon size in Mercator. Either use an equal-area projection or show the sourced numeric comparison separately.

For a regional historical map where area is not the argument, Mercator can remain the clearer option. For an empire/state extent comparison across latitude, use `projection: "equal-earth"` and inspect the result.

## 5. Do not morph unrelated polygons

A naive point-to-point morph between two independently created boundary files usually produces false intermediate geography.

Preferred transitions:

1. **Stable camera + reveal/loss layer** — keep the base state fixed and reveal the area gained or lost.
2. **Cut/dissolve between dated states** — best when the exact intermediate boundary is not known.
3. **Shared TopoJSON arcs** — for a carefully prepared time series where adjacent states intentionally reuse boundary arcs.
4. **Animated treaty/front line** — only when the line itself is the historical subject and is sourced.

For partitions, annexations or unions, the most legible pattern is often: establish the full state, reveal the first removed region, hold, reveal the next, hold, then show the remaining state. Do not continuously "liquefy" the outline.

## 6. Fuzzy and disputed borders must look fuzzy or disputed

If the source describes an approximate frontier, do not render it with the same visual certainty as a surveyed modern border. Use a restrained dashed/softened treatment, a short on-screen qualifier, or both.

For overlapping cultural zones, transparency may be more truthful than forcing non-overlapping state polygons.

Never resolve a scholarly dispute by choosing whichever outline looks cleaner.

## 7. Narration-to-map synchronization

Build the map around speech cues, not generic motion.

A useful cue sheet for each map:

| Spoken phrase | First readable visual state | Map action |
| --- | --- | --- |
| names a state/region | state and label readable | establish frame |
| names an annexed/lost region | region readable | reveal highlight |
| gives a date/treaty | date readable | update state label |
| gives a magnitude | final boundary settled | reveal numeric metric |
| compares with today | both comparison objects settled | show comparison |

The first readable appearance matters more than animation start. Leave a hold after the final reveal.

For a 15–20 second narrated map, aim for 3–5 meaningful spatial changes, not constant movement.

## 8. Historical-map QA

Before final render, verify:

- geometry is WGS84 / EPSG:4326 and coordinates are `[longitude, latitude]`;
- the layer date matches the narration date;
- political, administrative, claimed and occupied territory are not conflated;
- all source IDs resolve in the sidecar manifest;
- the source license allows the way the data is stored/used;
- coastline/border detail survives the intended zoom;
- labels do not imply modern names existed in the historical period without a reason;
- no important island, enclave or detached territory vanished during simplification;
- the projection matches the claim;
- the map remains understandable with narration muted;
- the narration remains accurate if the map is hidden.

If the film makes a quantitative area claim, verify the number from a source independently of the projected SVG.

## 9. Recommended workflow for a new historical film

1. Write the narration claim in one sentence.
2. Decide map `kind` and target date.
3. Find a scholarly/institutional GIS source where possible.
4. Record license and provenance before downloading.
5. Cache the exact original.
6. Convert/simplify into a derived local asset without overwriting the original.
7. Create/update the historical sidecar manifest.
8. Validate the manifest with `parseHistoricalMapManifest`.
9. Use `historicalLayerAt` to select the correct time layer when a series spans multiple periods.
10. Storyboard speech-to-map cues.
11. Render representative frames and a contact sheet.
12. Compare the rendered outline with the source and at least one independent reference for high-risk claims.

## 10. Polish–Lithuanian Commonwealth example

For the Commonwealth around 1619, Atlas Fontium / IH PAN publishes a vector layer "Rzeczpospolita - województwa (ok. 1619)" with EPSG:4326 geometry and CC BY 4.0 metadata. It is suitable as a strong source candidate for a reusable 1619 layer after the downloaded file and attribution are retained.

A separate Atlas Fontium layer for c. 1772 is published under CC BY-NC 2.0 PL. Treat that licensing difference as material: do not assume that because both layers come from the same portal they have the same reuse terms, and do not use an NC dataset for a monetized/commercial production without resolving that license question.

For 1569, 1793 and 1795, acquire date-appropriate layers separately. Do not derive them by simply scaling or hand-editing the 1619 outline unless the result is explicitly labelled an editorial approximation and the film can tolerate that weaker claim.

## Related files

- `docs/MAPS.md` — general geographic rendering and route rules.
- `docs/STORYBOARDING.md` — cue and information-gain planning.
- `docs/RESEARCH_POLICY.md` — claim/source standards.
- `docs/ASSET_POLICY.md` — local asset provenance.
- `examples/historical-map-manifest.json` — reusable manifest example.
