import { describe, expect, it } from 'vitest';
import { parseSceneFile, serializeScene } from '../src/editor/serialize';
import type { SceneSnapshot } from '../src/editor/types';

const scene: SceneSnapshot = {
  grid: { enabled: true, size: 10 },
  objects: [
    { id: 'r1', name: 'rect 1', type: 'rect', x: 10, y: 20, rotation: 45, visible: true, locked: false, width: 120, height: 80, fill: '#4CAF50', stroke: '#256325', strokeWidth: 2 },
    { id: 'c1', name: 'circle 1', type: 'circle', x: 200, y: 100, rotation: 0, visible: false, locked: false, radius: 50, fill: '#f0a830', stroke: '#256325', strokeWidth: 2 },
    { id: 'l1', name: 'line 1', type: 'line', x: 300, y: 300, rotation: 15.5, visible: true, locked: true, points: [0, 0, 120, 40], stroke: '#256325', strokeWidth: 4 },
    { id: 't1', name: 'text 1', type: 'text', x: 50, y: 500, rotation: 0, visible: true, locked: false, text: 'Hello', fontSize: 24, fill: '#1a1a1a' },
    { id: 'i1', name: 'image 1', type: 'image', x: 400, y: 200, rotation: 0, visible: true, locked: false, src: 'data:image/png;base64,iVBORw0KGgo=', width: 100, height: 60 },
  ],
};

describe('round-trip', () => {
  it('parse(serialize(scene)) deep-equals the scene', () => {
    expect(parseSceneFile(serializeScene(scene))).toEqual(scene);
  });

  it('serialize(parse(s)) is string-identical to s (canonical form)', () => {
    const s = serializeScene(scene);
    expect(serializeScene(parseSceneFile(s))).toBe(s);
  });

  it('canonicalizes key order: scrambled input keys serialize identically', () => {
    const s = serializeScene(scene);
    const data = JSON.parse(s) as { objects: Record<string, unknown>[] };
    data.objects = data.objects.map((o) =>
      Object.fromEntries(Object.entries(o).reverse()),
    );
    expect(serializeScene(parseSceneFile(JSON.stringify(data)))).toBe(s);
  });

  it('emits version 1 and pretty-printed JSON', () => {
    const s = serializeScene(scene);
    expect(JSON.parse(s).version).toBe(1);
    expect(s).toContain('\n  ');
  });
});

describe('parse rejection', () => {
  const fileOf = (mutate: (d: any) => void): string => {
    const d = JSON.parse(serializeScene(scene));
    mutate(d);
    return JSON.stringify(d);
  };

  it('rejects invalid JSON', () => {
    expect(() => parseSceneFile('not json {')).toThrow(/JSON/);
  });

  it('rejects unsupported version', () => {
    expect(() => parseSceneFile(fileOf((d) => (d.version = 2)))).toThrow(/version/i);
  });

  it('rejects non-array objects', () => {
    expect(() => parseSceneFile(fileOf((d) => (d.objects = {})))).toThrow(/objects/i);
  });

  it('rejects an object with a wrong-typed field', () => {
    expect(() => parseSceneFile(fileOf((d) => (d.objects[0].x = '10')))).toThrow(/rect 1|index 0/i);
  });

  it('rejects an unknown object type', () => {
    expect(() => parseSceneFile(fileOf((d) => (d.objects[0].type = 'star')))).toThrow();
  });

  it('rejects missing grid', () => {
    expect(() => parseSceneFile(fileOf((d) => delete d.grid))).toThrow(/grid/i);
  });
});
