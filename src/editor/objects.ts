import type { ImageObject, ObjectType, SceneObject } from './types';

/** Round to 2 decimals; `+ 0` normalizes -0 so it never enters the model. */
export const round2 = (v: number): number => Math.round(v * 100) / 100 + 0;

const newId = (type: string): string => `${type}-${crypto.randomUUID().slice(0, 8)}`;

export interface SpawnPoint {
  x: number;
  y: number;
}

export function createShape(
  type: Exclude<ObjectType, 'image'>,
  at: SpawnPoint,
  name: string,
): SceneObject {
  const base = {
    id: newId(type),
    name,
    x: round2(at.x),
    y: round2(at.y),
    rotation: 0,
    visible: true,
    locked: false,
  };
  switch (type) {
    case 'rect':
      return { ...base, type, width: 120, height: 80, fill: '#4CAF50', stroke: '#256325', strokeWidth: 2 };
    case 'circle':
      return { ...base, type, radius: 50, fill: '#f0a830', stroke: '#256325', strokeWidth: 2 };
    case 'line':
      return { ...base, type, points: [0, 0, 120, 0], stroke: '#256325', strokeWidth: 4 };
    case 'text':
      return { ...base, type, text: 'Edit me', fontSize: 24, fill: '#1a1a1a' };
  }
}

export function createImage(
  src: string,
  width: number,
  height: number,
  at: SpawnPoint,
  name: string,
): ImageObject {
  return {
    id: newId('image'),
    name,
    x: round2(at.x),
    y: round2(at.y),
    rotation: 0,
    visible: true,
    locked: false,
    type: 'image',
    src,
    width: round2(width),
    height: round2(height),
  };
}
