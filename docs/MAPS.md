# Geographic scenes

Use maps to explain a spatial relationship: distance, containment, access, route dependence, borders, or the location of an event. A map with random moving dots teaches none of these.

## Data contract

Register a cached `geojson` or `topojson` asset and reference its ID from a `geo-flow` scene. GeoJSON `Feature` and `FeatureCollection` are supported. TopoJSON selects a named `countries` or `land` object; unknown multi-layer topologies require explicit preparation with `normalizeGeometry(input, {objectName})`. Geometry is not downloaded by the renderer and never synthesized by an image generator.

The preparation layer accepts both D3/TopoJSON and RFC 7946 polygon winding. It evaluates a complete polygon, including holes, before reversing orientation; reversing rings independently can turn a valid Antarctic polar cap into global land. Intentional regions larger than a hemisphere can use `winding: "preserve"` when prepared in code. [D3 documents the different winding conventions](https://d3js.org/d3-geo). Regression tests inspect actual raster pixels as well as geographic point containment.

Coordinates are **[longitude, latitude] in degrees**, including scene centers, route points, and place labels. They are not pixel coordinates. The scene uses a Mercator projection; zoom is a scale multiplier. This is suitable for many regional route explanations, but distorts area toward the poles. Do not use its apparent country areas for geographic comparisons. Use a custom equal-area projection where area matters.

`center`/`zoom` set the destination framing. `fromCenter`/`fromZoom` allow an establishing geographic flight. Places can be emphasized, and an optional metric can state a sourced quantity. A metric is text: its factual value and source relationship remain an editorial responsibility.

`composition: "atlas"` gives the regional map most of the frame and reserves a margin for `metric.value`, `metric.label` and optional `metric.context`. Supply a global `locatorAsset` for the inset; the inset derives its center from the main map. `cartographyLabel` must describe the actual data source/scale. Place `kind` distinguishes `country`, `water` and `place`; `offset: [dx,dy]` moves the label in design pixels while retaining its geographic anchor. The main map includes a north indicator and a physical scale calculated at its central latitude. These do not make Mercator area-preserving.

The Hormuz demo uses the public-domain [Natural Earth 1:10 million countries dataset](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/), retained as a local region subset with a pinned upstream commit, full coordinates and SHA-256. **10m means 1:10 million cartographic scale, not ten-metre accuracy.** Reacquire it with `node scripts/acquire-hormuz-map.mjs`; inspect `research/map-provenance.json`. Use finer verified data if a close-up needs more detail than this scale provides. The world-atlas 1:50 million layer is used only for orientation.

## Routes

Provide route point sequences based on the geographic relationship being shown. A two-point great circle may cross land and is not automatically a shipping route. Add meaningful waypoints for constrained sea passages. The `greatCircle` utility is appropriate for spherical interpolation, not proof that a vessel used that track.

For an explicitly maritime route set `surface: "sea"`. Project QA samples 100 positions on each geodesic segment against the supplied land polygons and reports intersections as errors. This catches bad waypoints, but a coarse coastline or a regional subset can still omit obstacles: inspect the full route against suitable geography. The default `surface: "schematic"` makes no maritime assertion. Routes remain labeled schematic unless an actual observed track is supplied.

Route `strength` is a visual control from 0 to 1. Particle count, opacity, speed, and stroke width must not be treated as observed traffic without a stated data encoding. A decrease drawn for an illustrative disruption needs an on-screen scenario label.

At a chokepoint, identify surrounding countries and waters before zooming deeply. Preserve enough surrounding land for orientation. A close-up without context can make a narrow passage look like a disconnected canal.

## Provenance and politics

Record dataset author, license, version/acquisition date, and simplification. Coastline resolution must be adequate for the intended zoom. Country borders can reflect a particular publication date or political convention; state material disputes rather than silently treating a dataset as universal truth.

Never smooth a coastline so aggressively that an island or strait central to the argument disappears. Inspect the location against the source map. Review coordinate ordering, antimeridian behavior, label placement, and projection clipping.

## Scope

The built-in recipe provides projected land, graticule, routes, geographic camera movement, labels, and a metric. It is not a turn-by-turn navigation system or a complete historical boundary database. A custom globe or alternate projection can use the extension lifecycle; a 2D map does not become 3D merely by adding rotation.
