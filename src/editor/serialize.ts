import type {
  GridSettings,
  SceneObject,
  SceneSnapshot,
} from './types';

export const SCHEMA_VERSION = 1;

/**
 * Rebuild each object field-by-field in a fixed key order so the emitted JSON
 * is canonical: no matter how the in-memory object was constructed (toolbar,
 * parsed file, spread-update), the same model always serializes to the same
 * bytes. Numbers are never formatted here — rounding happens at mutation time.
 */
function canonicalObject(o: SceneObject): SceneObject {
  const base = {
    id: o.id,
    type: o.type,
    name: o.name,
    x: o.x,
    y: o.y,
    rotation: o.rotation,
    visible: o.visible,
    locked: o.locked,
  };
  switch (o.type) {
    case 'rect':
      return { ...base, type: 'rect', width: o.width, height: o.height, fill: o.fill, stroke: o.stroke, strokeWidth: o.strokeWidth };
    case 'circle':
      return { ...base, type: 'circle', radius: o.radius, fill: o.fill, stroke: o.stroke, strokeWidth: o.strokeWidth };
    case 'line':
      return { ...base, type: 'line', points: [...o.points], stroke: o.stroke, strokeWidth: o.strokeWidth };
    case 'text':
      return { ...base, type: 'text', text: o.text, fontSize: o.fontSize, fill: o.fill };
    case 'image':
      return { ...base, type: 'image', src: o.src, width: o.width, height: o.height };
  }
}

export function serializeScene(snapshot: SceneSnapshot): string {
  return JSON.stringify(
    {
      version: SCHEMA_VERSION,
      grid: { enabled: snapshot.grid.enabled, size: snapshot.grid.size },
      objects: snapshot.objects.map(canonicalObject),
    },
    null,
    2,
  );
}

const isFin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';

function isBase(o: Record<string, unknown>): boolean {
  return (
    isStr(o.id) && isStr(o.name) &&
    isFin(o.x) && isFin(o.y) && isFin(o.rotation) &&
    isBool(o.visible) && isBool(o.locked)
  );
}

const isStroke = (o: Record<string, unknown>): boolean =>
  isStr(o.stroke) && isFin(o.strokeWidth);

function isSceneObject(v: unknown): v is SceneObject {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (!isBase(o)) return false;
  switch (o.type) {
    case 'rect':
      return isFin(o.width) && isFin(o.height) && isStr(o.fill) && isStroke(o);
    case 'circle':
      return isFin(o.radius) && isStr(o.fill) && isStroke(o);
    case 'line':
      return Array.isArray(o.points) && o.points.length >= 4 &&
        o.points.length % 2 === 0 && o.points.every(isFin) && isStroke(o);
    case 'text':
      return isStr(o.text) && isFin(o.fontSize) && isStr(o.fill);
    case 'image':
      return isStr(o.src) && isFin(o.width) && isFin(o.height);
    default:
      return false;
  }
}

function isGrid(v: unknown): v is GridSettings {
  if (typeof v !== 'object' || v === null) return false;
  const g = v as Record<string, unknown>;
  return isBool(g.enabled) && isFin(g.size) && (g.size as number) > 0;
}

export function parseSceneFile(json: string): SceneSnapshot {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('File is not valid JSON');
  }
  if (typeof data !== 'object' || data === null) {
    throw new Error('File is not a scene object');
  }
  const d = data as Record<string, unknown>;
  if (d.version !== SCHEMA_VERSION) {
    throw new Error(`Unsupported schema version: ${String(d.version)}`);
  }
  if (!isGrid(d.grid)) {
    throw new Error('Invalid or missing "grid" settings');
  }
  if (!Array.isArray(d.objects)) {
    throw new Error('Invalid or missing "objects" array');
  }
  d.objects.forEach((o, i) => {
    if (!isSceneObject(o)) {
      throw new Error(`Invalid object at index ${i}`);
    }
  });
  return {
    grid: { enabled: d.grid.enabled, size: d.grid.size },
    objects: (d.objects as SceneObject[]).map(canonicalObject),
  };
}
