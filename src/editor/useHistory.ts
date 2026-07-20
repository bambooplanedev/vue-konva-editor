import { ref } from 'vue';
import type { SceneSnapshot } from './types';
import { serializeScene } from './serialize';
import { useEditorScene } from './useEditorScene';

const MAX_HISTORY = 50;

// Plain (non-reactive) stacks: snapshots must stay raw so structuredClone
// and replaceScene never see a Vue proxy. `past` includes the current state.
const past: SceneSnapshot[] = [];
const future: SceneSnapshot[] = [];
const canUndo = ref(false);
const canRedo = ref(false);

function sync(): void {
  canUndo.value = past.length > 1;
  canRedo.value = future.length > 0;
}

export function useHistory() {
  const { currentSnapshot, replaceScene } = useEditorScene();
  return {
    canUndo,
    canRedo,

    /** Push the current state as a committed snapshot. */
    commit(): void {
      past.push(currentSnapshot());
      if (past.length > MAX_HISTORY) past.shift();
      future.length = 0;
      sync();
    },

    undo(): void {
      if (past.length === 0) return;
      const current = currentSnapshot();
      const top = past[past.length - 1]!;
      if (serializeScene(current) !== serializeScene(top)) {
        // Uncommitted changes: undo cancels them by restoring the last
        // committed state. Stacks stay untouched so redo still works.
        replaceScene(top);
        sync();
        return;
      }
      if (past.length < 2) return;
      future.push(past.pop()!);
      replaceScene(past[past.length - 1]!);
      sync();
    },

    redo(): void {
      const snapshot = future.pop();
      if (!snapshot) return;
      past.push(snapshot);
      replaceScene(snapshot);
      sync();
    },

    /** Drop everything and seed with the current state (app init / tests). */
    resetHistory(): void {
      past.length = 0;
      future.length = 0;
      past.push(currentSnapshot());
      sync();
    },
  };
}
