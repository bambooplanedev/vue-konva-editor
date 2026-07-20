import { reactive, toRaw } from 'vue';
import { createImage, createShape, round2 } from './objects';
import type { SpawnPoint } from './objects';
import { ARTBOARD, GRID_STEP } from './types';
import type {
  GridSettings,
  ObjectType,
  SceneObject,
  SceneSnapshot,
} from './types';

export interface EditorState {
  objects: SceneObject[];
  grid: GridSettings;
  selectedId: string | null;
}

/** Loose patch: any subset of any variant's fields (never id/type). */
export type ObjectPatch = Record<string, unknown>;

const state = reactive<EditorState>({
  objects: [],
  grid: { enabled: true, size: GRID_STEP },
  selectedId: null,
});

function spawnPoint(): SpawnPoint {
  const n = state.objects.length % 6;
  return {
    x: ARTBOARD.width / 2 - 60 + n * 20,
    y: ARTBOARD.height / 2 - 40 + n * 20,
  };
}

function nextName(type: ObjectType): string {
  const count = state.objects.filter((o) => o.type === type).length;
  return `${type} ${count + 1}`;
}

function find(id: string): SceneObject | undefined {
  return state.objects.find((o) => o.id === id);
}

export function useEditorScene() {
  return {
    state,

    addShape(type: Exclude<ObjectType, 'image'>): SceneObject {
      const obj = createShape(type, spawnPoint(), nextName(type));
      state.objects.push(obj);
      state.selectedId = obj.id;
      return obj;
    },

    addImage(src: string, width: number, height: number): SceneObject {
      const obj = createImage(src, width, height, spawnPoint(), nextName('image'));
      state.objects.push(obj);
      state.selectedId = obj.id;
      return obj;
    },

    updateObject(id: string, patch: ObjectPatch): void {
      const obj = find(id);
      if (!obj) return;
      for (const [key, value] of Object.entries(patch)) {
        (obj as unknown as Record<string, unknown>)[key] =
          typeof value === 'number' ? round2(value) : value;
      }
    },

    replaceObject(id: string, next: SceneObject): void {
      const i = state.objects.findIndex((o) => o.id === id);
      if (i !== -1) state.objects[i] = next;
    },

    removeObject(id: string): void {
      state.objects = state.objects.filter((o) => o.id !== id);
      if (state.selectedId === id) state.selectedId = null;
    },

    moveObject(id: string, dir: 1 | -1): void {
      const i = state.objects.findIndex((o) => o.id === id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= state.objects.length) return;
      const objects = state.objects;
      [objects[i], objects[j]] = [objects[j]!, objects[i]!];
    },

    toggleVisible(id: string): void {
      const obj = find(id);
      if (obj) obj.visible = !obj.visible;
    },

    toggleLocked(id: string): void {
      const obj = find(id);
      if (obj) obj.locked = !obj.locked;
    },

    select(id: string | null): void {
      state.selectedId = id;
    },

    toggleGrid(): void {
      state.grid.enabled = !state.grid.enabled;
    },

    /** Plain deep copy of the persistent state (no selection). */
    currentSnapshot(): SceneSnapshot {
      const raw = toRaw(state);
      return structuredClone({ objects: raw.objects.map((o) => toRaw(o)), grid: toRaw(raw.grid) });
    },

    /** Replace persistent state; always clones so callers keep ownership. */
    replaceScene(snapshot: SceneSnapshot): void {
      const copy = structuredClone(snapshot);
      state.objects = copy.objects;
      state.grid = copy.grid;
      if (state.selectedId && !copy.objects.some((o) => o.id === state.selectedId)) {
        state.selectedId = null;
      }
    },

    resetScene(): void {
      state.objects = [];
      state.grid = { enabled: true, size: GRID_STEP };
      state.selectedId = null;
    },
  };
}
