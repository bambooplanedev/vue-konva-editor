export const ARTBOARD = { width: 900, height: 600 } as const;
export const GRID_STEP = 10;

export interface BaseObject {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
}

export interface RectObject extends BaseObject {
  type: 'rect';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface CircleObject extends BaseObject {
  type: 'circle';
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface LineObject extends BaseObject {
  type: 'line';
  points: number[];
  stroke: string;
  strokeWidth: number;
}

export interface TextObject extends BaseObject {
  type: 'text';
  text: string;
  fontSize: number;
  fill: string;
}

export interface ImageObject extends BaseObject {
  type: 'image';
  src: string;
  width: number;
  height: number;
}

export type SceneObject =
  | RectObject
  | CircleObject
  | LineObject
  | TextObject
  | ImageObject;

export type ObjectType = SceneObject['type'];

export interface GridSettings {
  enabled: boolean;
  size: number;
}

export interface SceneSnapshot {
  objects: SceneObject[];
  grid: GridSettings;
}
