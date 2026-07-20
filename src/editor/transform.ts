import { round2 } from './objects';
import type { SceneObject } from './types';

export interface TransformPatch {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

/**
 * Bake a Konva transform result into the model. The model never stores scale:
 * rect/image absorb it into width/height, circle into radius, text into
 * fontSize, line into its points.
 */
export function applyTransform(obj: SceneObject, t: TransformPatch): SceneObject {
  const moved = { x: round2(t.x), y: round2(t.y), rotation: round2(t.rotation) };
  switch (obj.type) {
    case 'rect':
    case 'image':
      return {
        ...obj,
        ...moved,
        width: round2(Math.max(5, Math.abs(obj.width * t.scaleX))),
        height: round2(Math.max(5, Math.abs(obj.height * t.scaleY))),
      };
    case 'circle':
      return { ...obj, ...moved, radius: round2(Math.max(3, Math.abs(obj.radius * t.scaleX))) };
    case 'text':
      return { ...obj, ...moved, fontSize: round2(Math.max(6, Math.abs(obj.fontSize * t.scaleY))) };
    case 'line':
      return {
        ...obj,
        ...moved,
        points: obj.points.map((p, i) => round2(p * (i % 2 === 0 ? t.scaleX : t.scaleY))),
      };
  }
}
