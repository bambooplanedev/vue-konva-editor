import { ref } from 'vue';
import type { SceneSnapshot } from './types';
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
      if (past.length < 2) return;
      const current = currentSnapshot();
      const lastCommitted = past[past.length - 1]!;

      // Check if current state differs from last committed state (uncommitted mutations)
      const hasUncommittedChanges = JSON.stringify({objects: current.objects, grid: current.grid}) !==
                                    JSON.stringify({objects: lastCommitted.objects, grid: lastCommitted.grid});

      if (hasUncommittedChanges) {
        // Current state has uncommitted mutations: just restore to last committed, preserve it in future
        future.push(current);
        replaceScene(lastCommitted);
      } else {
        // Current state matches last commit: undo to previous commit
        future.push(past.pop()!);
        replaceScene(past[past.length - 1]!);
      }
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
