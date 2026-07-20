# vue-konva-editor

**A canvas template editor where the domain model is the single source of truth — Konva only renders it. Lossless JSON round-trip included.**

Live demo: https://bambooplanedev.github.io/vue-konva-editor/

![Editor demo](media/demo.gif)

## What this demonstrates

- rect / circle / line / text / image primitives — select, drag, resize, rotate
- layers panel: z-order, visibility, lock, two-way selection sync with the canvas
- snap-to-grid on a fixed 900×600 artboard
- snapshot-based undo/redo (50 steps)
- export/import to a versioned JSON schema — `serialize(parse(serialize(scene)))`
  is byte-identical, enforced by tests
- PNG export at 1x/2x

The interesting part is the architecture, not the widget list: the whole scene
lives in one plain-data model, and the Konva stage is reconciled from it. That
one decision makes serialization, undo/redo, and import fall out almost for
free — nothing else holds state. Full write-up: [BLOG.md](./BLOG.md)

## Quick start

```bash
git clone https://github.com/bambooplanedev/vue-konva-editor.git
cd vue-konva-editor
npm install
npm run dev
```

## Tests

```bash
npm test
```

Four suites protect the core claims: lossless canonical round-trip,
undo/redo semantics (cap, redo invalidation), transform baking math per
object type, and import validation.

## Stack

Vue 3 (`<script setup>`) + TypeScript strict, Konva.js used directly (no
vue-konva wrapper), Vite, Vitest. No state-management or UI libraries.

## License

MIT
