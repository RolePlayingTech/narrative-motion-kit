# Polish–Lithuanian Commonwealth: historical map source registry

This note is a research/acquisition aid for documentary projects. It does **not** declare any external dataset bundled or relicensed by Narrative Motion Kit.

## c. 1619 — preferred reusable candidate

**Atlas Fontium / Instytut Historii PAN**  
Layer: *Rzeczpospolita - województwa (ok. 1619)*  
Metadata: https://data.atlasfontium.pl/layers/geonode%3Aa__1619_rp_wojewodztwa/metadata_detail

- vector boundary/voivodeship layer;
- CRS: EPSG:4326;
- temporal extent: 1619;
- attribution: IH PAN;
- metadata license: CC BY 4.0;
- responsible cartographer listed by the portal: Tomasz Panecki;
- derived from the map "Podział administracyjny Rzeczypospolitej Obojga Narodów w 1619 r.".

### Production use

Download the GeoJSON from Atlas Fontium, retain the original unchanged, register it as a local project asset, and create a historical sidecar manifest entry with the exact acquisition date and attribution.

For a film about territorial maximum, dissolve internal voivodeship polygons into the external state outline only as a **derived** project asset; keep the original file and record the transformation. The internal boundaries remain useful for visual orientation.

Use `projection: "equal-earth"` when comparing apparent territorial area with another state or with modern Poland. Use Mercator when the map's purpose is regional orientation and area is not being inferred visually.

## c. 1772 — research candidate with a license constraint

**Atlas Fontium / historical geography data from KUL**  
Layer: *Rzeczpospolita - województwa (ok. 1772)*  
Layer page: https://data.atlasfontium.pl/layers/datafontium_data%3Ageonode%3Aa__1772_rp_wojewodztwa

- vector layer;
- temporal extent: 1772;
- Atlas Fontium metadata attributes the underlying material to the historical geography centre at KUL;
- license shown by the portal: **CC BY-NC 2.0 PL**.

### Production use

Do not treat this layer as interchangeable with the CC BY 4.0 layer from 1619. A non-commercial restriction may be incompatible with a monetized/commercial film workflow. Resolve that licensing question before caching or publishing derivative assets.

The layer can still be used as a research reference when checking another properly licensed reconstruction.

## Sixteenth-century Crown — supplementary, not a complete 1569 Commonwealth map

Atlas Fontium publishes *Województwa [Atlas historyczny Polski XVI w.]* under CC BY 4.0:
https://data.atlasfontium.pl/layers/geonode%3Awojewodztwa

This is valuable for Crown administrative geography in the second half of the sixteenth century. Do **not** silently promote it to a complete Polish–Lithuanian Commonwealth boundary: its stated scope is the historical atlas of Poland / Crown lands, not a verified full 1569 federated outline including the whole Grand Duchy of Lithuania.

## 1569, 1793 and 1795

No geometry is blessed here merely because an illustrative map exists online.

For these states:

1. prefer an institutional/scholarly GIS layer with explicit licensing;
2. otherwise georeference a high-quality historical atlas only if its rights permit derivative vectorization;
3. record the reconstruction method and confidence;
4. compare the result with at least one independent scholarly map;
5. label the geometry `reconstructed` or `approximate` unless the source supports stronger certainty.

For the partitions, prefer separate dated states (pre-partition, post-1772, post-1793, post-1795) or explicit lost-territory layers. Do not create the animation by freehand shrinking the 1619 polygon.

## Recommended project layout

```text
projects/<film>/
  assets/
    maps/
      commonwealth/
        source/
          ron-1619-original.geojson
        derived/
          ron-1619-state-outline.geojson
          ron-1772-state-outline.geojson
          ron-1793-state-outline.geojson
          ron-1795-state-outline.geojson
        historical-map.json
  research/
    map-provenance.md
```

The `source/` file is never overwritten. Simplification, dissolve, clipping and topology preparation go into `derived/`. Record each transformation in `research/map-provenance.md`.

## Suggested series

Use separate series in the historical manifest:

- `commonwealth-political-boundary` — dated external state outline;
- `commonwealth-administrative` — voivodeships/provinces;
- `commonwealth-military-control` — only for specific campaigns/occupations;
- `commonwealth-partition-losses` — optional explicit lost-territory overlays.

This prevents an animation from conflating constitutional territory with military presence or administrative subdivision.
