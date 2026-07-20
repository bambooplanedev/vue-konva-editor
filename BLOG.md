# The model is the editor. Konva just draws it.

Canvas editors tend to grow the same disease: the canvas library's node tree
becomes the database. Position lives in the node, styling lives in the node,
z-order lives in the node tree — and then export, undo, and testing each
require excavating state back out of the renderer. This project is a small,
complete demonstration of the opposite architecture.

## One source of truth

The entire scene is a plain-data model:

```ts
interface RectObject {
  id: string; type: 'rect'; name: string;
  x: number; y: number; rotation: number;
  visible: boolean; locked: boolean;
  width: number; height: number;
  fill: string; stroke: string; strokeWidth: number;
}
// circle | line | text | image follow the same pattern
```

Z-order is simply array order. Selection is ephemeral UI state and is not part
of the model. Nothing in the model refers to Konva.

The renderer is a reconciler keyed by object id: one watcher walks the model,
creates missing Konva nodes, updates changed attributes in place, destroys
removed nodes, and aligns z-index with array position. Konva's own gesture
handling (drag, transform) runs natively; on `dragend`/`transformend` the
result is committed back into the model — and only the model.

Two consequences do most of the work in this repo:

- **Undo/redo is `structuredClone`.** History is a stack of model snapshots.
  Undo replaces the model; the reconciler repaints. There is no per-action
  inverse logic anywhere.
- **Import is a mutation.** Loading a file replaces the model through the same
  write path every other edit uses. No special restore code, and it lands in
  history as one undoable step.

## The model never stores scale

Konva's Transformer expresses resizing as `scaleX`/`scaleY`. Persisting scale
factors is how editors end up with `width: 100, scaleX: 1.73` — two numbers
describing one fact. On `transformend` the scale is baked into real geometry
and reset to 1: rect and image absorb it into width/height, circle into
radius, text into fontSize, line into its points. The baking is a pure
function per type, which makes the trickiest math in the editor unit-testable
without a canvas.

## Lossless means canonical

The round-trip claim is precise: `serialize(parse(serialize(scene)))` is
**byte-identical** to `serialize(scene)`, and a test asserts it as string
equality. That takes more than `JSON.stringify`:

- The serializer rebuilds every object field-by-field in a fixed key order, so
  key insertion order (toolbar-created vs parsed vs updated) never leaks into
  the bytes.
- Numbers are rounded when they enter the model (and `-0` is normalized), never
  at serialize time — formatting on the way out would silently lose data.
- The parser validates structure with hand-written type guards, including
  `Number.isFinite` — `NaN` would stringify to `null` and corrupt the next
  round-trip.

Why not Konva's built-in `node.toJSON()`? It serializes the renderer, not the
scene: renderer-specific attributes, class names, and whatever scale/position
state the nodes happen to carry. It has no schema version, so old files break
silently. An owned schema (`version: 1`) is boring, readable, and stable —
which is exactly what a persistence format should be.

## What this costs

Honest trade-offs, deliberately taken:

- **Snapshots are memory-hungry.** Every commit clones the scene. At this
  scale it's irrelevant; at thousands of objects you'd want structural sharing
  or a command log. Snapshots were chosen because the entire undo system is
  ~40 lines and obviously correct.
- **Images are data URLs in the JSON.** The file is self-contained and the
  round-trip stays honest, but a scene with photos gets big. The alternative —
  external references — trades file size for a resolution mechanism.
- **The artboard is a constant (900×600).** Keeping it out of the file keeps
  version 1 minimal; moving it into the schema is the obvious version 2.
