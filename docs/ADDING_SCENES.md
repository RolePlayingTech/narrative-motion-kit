# Adding a scene or rendering layer

First inspect the catalog. Extend an existing family's content/layout when it already expresses the idea. Add a reusable family when several projects benefit from the same reasoning pattern. Use `custom` for a distinct composition whose contract is not yet stable.

## Pure SVG scene

The scene context provides the project, absolute `time`, scene `localTime`, width/height in design coordinates, theme, asset URL resolver, and prepared geographic data. A renderer returns complete SVG markup for that time.

Register a custom SVG renderer with `registerCustomScene` from `packages/scenes/index.ts`; import its registration from `packages/core/extensions.ts` so preview and headless rendering use the same code. The project uses `type: custom`, the registered `renderer` ID, and JSON-compatible `props`. Inspect the existing extension registrations for the exact signature.

Use shared typography helpers to XML-escape supplied text and fit it deliberately. Use theme colors and spacing. Resolve assets by manifest ID. Avoid a mutable module counter for generated IDs; stable scene and object IDs must produce the same markup on every seek.

## DOM, Canvas, and WebGL

`registerLayer(id, factory)` in `packages/core/layers.ts` registers a factory receiving `(host, scene, context)`. It returns `{ update(scene, context), dispose() }`; creation and updates may be asynchronous. Register a corresponding SVG renderer too, even if it returns an empty body, so the normal scene chrome and lifecycle recognize the custom type.

In `update`, derive every animated property from absolute/local time. Canvas layers clear before drawing. WebGL layers set transforms directly and call `renderer.render`; do not start a separate animation loop. DOM layers assign style/content rather than relying on CSS animations or Web Animations playback state. Asset preparation may cache immutable decoded resources.

In `dispose`, remove created elements and release GPU resources/listeners. A layer can be destroyed and recreated when seeking between scenes. It must not assume the previous frame was rendered. Inspect the built-in particle-flow, globe, and document-dom implementations for working examples.

The current transition compositor bridges SVG compositions. A scene with a registered DOM/Canvas/WebGL layer must have a cut on entry and on exit: omit the incoming transition or set `type: cut`, and do the same on its successor. The renderer rejects other effects at these boundaries instead of silently dropping the custom surface. Pure custom SVG compositions still use supported SVG transitions. Test boundary samples when mixing rendering technologies.

## A new first-class family

1. Define a specific user/content problem and required data contract.
2. Add a strict scene schema variant and semantic validation in `packages/schema/index.ts`.
3. Add the renderer and register it in the scene dispatcher; share math and geometry rather than copying helpers.
4. Add source/asset reference checks for new fields and meaningful diagnostics for invalid inputs.
5. Exercise landscape and vertical compositions, long Polish text, empty/edge values, repeated/backward seeks, and transition seams.
6. Add tests for substantive logic and integration samples for rendering; document the family and its limits.

Keep engine changes independent of the demo topic. Names like `fuelTaxScene` usually belong to project composition; a reusable `breakdown` or `evidence` improvement belongs to the library.

## Deterministic acceptance checks

Render time A, then B, then A; the A frames should match in the same runtime. Render in separate worker pages and compare. Run offline with only local resources. Test first frame, meaningful reveal, settled state, and final frame. An effect that only works during forward playback is not a valid scene.

Run `npm run check` and the relevant browser integration test after runtime changes. `npm run test:gallery` exercises the included Three.js, Canvas, and DOM extensions; `npm run test:integration` exercises the frame cache and a narrated encode. Inspect rendered output; snapshots alone cannot establish information hierarchy, truthful encoding, or readable typography.
