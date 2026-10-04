# Semantic transitions

A transition should preserve a recognizable concept while changing its representation. Write its `reason` before tuning its duration. “The highlighted price becomes the chart's quantity” is meaningful; “dynamic cinematic transition” is not.

The DSL supports `cut`, `match-cut`, `focus-through`, `route-to-line`, and `bar-to-layer`. These are reusable geometric bridges. They do not infer object identities, prove causation, or automatically morph arbitrary assets into one another.

## Choose a bridge

| Type            | Use when                                                       | Arrange before rendering                                                   |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `cut`           | A clear editorial reset is the best connection                 | Adjacent focal points should not create accidental confusion               |
| `match-cut`     | Position/shape/identity persists across the cut                | Place corresponding objects in comparable screen positions                 |
| `focus-through` | The next shot is a closer explanation of a visible element     | Set normalized anchor on the evidence, quantity, or region being examined  |
| `route-to-line` | Geographic movement leads into a related time/data explanation | Match line direction and color; label any distinction in measured quantity |
| `bar-to-layer`  | A quantity becomes parts, stages, or physical layers           | Preserve ordering and a consistent color meaning                           |

`anchor` is `[x, y]` in normalized screen coordinates. Duration is seconds, at most 1.5, and no longer than the incoming scene. Transitions occupy the beginning of the incoming scene. The previous scene is sampled at its final frame; do not create overlapping timeline intervals.

The geometric aperture replaces opaque artwork without fading text or exposing an empty frame. Titles and source bands switch as complete units halfway through the transition; the wipe never combines fragments of two headings. `focus-through` expands from its anchor in two dimensions, while `match-cut` opens along the focal axis. Keep artwork within the scene content area so it does not collide with these protected bands.

Route bridges follow the supplied great-circle geometry and the incoming chart's currently revealed first series. Original bends are preserved, and additional series are never joined into a fabricated path. The intermediate shape is an editorial bridge, not geographic or quantitative evidence. Bars likewise transform from their actual reveal state.

`route-to-line` requires both neighboring scenes to be `geo-flow` or `line-chart`; it uses the first geographic route or the chart geometry. `bar-to-layer` requires `bar-chart`/`breakdown` endpoints with equal data-item counts. Unsupported pairs fail during rendering. Keep mapped item order consistent so a bridge does not silently swap categories. A multi-series chart needs explicit editorial care because a single bridge path does not explain separate series identities.

Registered DOM, Canvas, and WebGL layers require a cut into and out of their scenes. Omit the transition or use `type: cut` on both the layered scene and its successor. Other effects are rejected because the current compositor operates on SVG; it cannot transform a custom surface through the SVG bridge. This restriction does not apply to a custom renderer that returns only SVG.

## Example

```yaml
transition:
  type: focus-through
  duration: 0.45
  anchor: [0.5, 0.5]
  reason: The highlighted legal requirement becomes the process we explain next.
```

The explanation matters more than the recipe name. A map-to-chart bridge can imply “this caused that” even if the datasets describe different years. Keep historical periods and scenario labels explicit, and avoid a causal title without evidence.

## Inspection

Inspect at the scene boundary, mid-transition, and immediately after it. Also inspect a short motion range; a perfect midpoint image can hide a jump. Check continuity of source labels, clipping, contrast, object scale, and the first readable frame of the new scene. Leave enough scene time after the bridge for the new information to land.

Use custom transitions when the story requires a specific transformation. Define stable shared geometry and interpolate it from absolute progress. Avoid frame-integrated path deformation and stateful simulation. A cut remains preferable to a misleading or unreadable morph.
