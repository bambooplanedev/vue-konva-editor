import { describe, expect, it } from 'vitest';
import { applyTransform } from '../src/editor/transform';
import type {
  CircleObject,
  LineObject,
  RectObject,
  TextObject,
} from '../src/editor/types';

const base = {
  id: 'o1',
  name: 'obj',
  x: 10,
  y: 20,
  rotation: 0,
  visible: true,
  locked: false,
};

const rect: RectObject = {
  ...base,
  type: 'rect',
  width: 100,
  height: 50,
  fill: '#4CAF50',
  stroke: '#256325',
  strokeWidth: 2,
};

const circle: CircleObject = {
  ...base,
  type: 'circle',
  radius: 40,
  fill: '#f0a830',
  stroke: '#256325',
  strokeWidth: 2,
};

const line: LineObject = {
  ...base,
  type: 'line',
  points: [0, 0, 120, 80],
  stroke: '#256325',
  strokeWidth: 4,
};

const text: TextObject = {
  ...base,
  type: 'text',
  text: 'Hi',
  fontSize: 24,
  fill: '#1a1a1a',
};

describe('applyTransform', () => {
  it('bakes scale into rect width/height and commits x/y/rotation', () => {
    const out = applyTransform(rect, { x: 15, y: 25, rotation: 45, scaleX: 2, scaleY: 0.5 });
    expect(out).toMatchObject({ x: 15, y: 25, rotation: 45, width: 200, height: 25 });
    expect(out).not.toHaveProperty('scaleX');
  });

  it('clamps rect to min size 5', () => {
    const out = applyTransform(rect, { x: 10, y: 20, rotation: 0, scaleX: 0.01, scaleY: 0.01 });
    expect(out).toMatchObject({ width: 5, height: 5 });
  });

  it('bakes uniform scale into circle radius (min 3)', () => {
    const out = applyTransform(circle, { x: 10, y: 20, rotation: 0, scaleX: 1.5, scaleY: 1.5 });
    expect(out).toMatchObject({ radius: 60 });
    const tiny = applyTransform(circle, { x: 10, y: 20, rotation: 0, scaleX: 0.001, scaleY: 0.001 });
    expect(tiny).toMatchObject({ radius: 3 });
  });

  it('bakes scale into text fontSize (min 6)', () => {
    const out = applyTransform(text, { x: 10, y: 20, rotation: 0, scaleX: 2, scaleY: 2 });
    expect(out).toMatchObject({ fontSize: 48 });
  });

  it('bakes per-axis scale into line points', () => {
    const out = applyTransform(line, { x: 10, y: 20, rotation: 30, scaleX: 2, scaleY: 0.5 });
    expect(out).toMatchObject({ points: [0, 0, 240, 40], rotation: 30 });
  });

  it('rounds to 2 decimals and normalizes -0', () => {
    const out = applyTransform(rect, { x: -0.001, y: 33.3333, rotation: 0, scaleX: 1 / 3, scaleY: 1, });
    expect(Object.is(out.x, 0)).toBe(true);
    expect(out.y).toBe(33.33);
    expect((out as RectObject).width).toBe(33.33);
  });

  it('does not mutate the input object', () => {
    const before = JSON.stringify(rect);
    applyTransform(rect, { x: 0, y: 0, rotation: 0, scaleX: 3, scaleY: 3 });
    expect(JSON.stringify(rect)).toBe(before);
  });
});
