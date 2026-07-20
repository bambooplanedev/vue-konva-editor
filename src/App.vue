<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import EditorCanvas from './components/EditorCanvas.vue';
import EditorToolbar from './components/EditorToolbar.vue';
import LayersPanel from './components/LayersPanel.vue';
import InspectorPanel from './components/InspectorPanel.vue';
import { useEditorScene } from './editor/useEditorScene';
import { useHistory } from './editor/useHistory';

const history = useHistory();
const { state, removeObject } = useEditorScene();

function onKeydown(e: KeyboardEvent): void {
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

  if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId) {
    e.preventDefault();
    removeObject(state.selectedId);
    history.commit();
    return;
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) history.redo();
    else history.undo();
  }
}

onMounted(() => {
  history.resetHistory();
  window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="app">
    <EditorToolbar />
    <main class="main">
      <EditorCanvas />
      <aside class="sidebar">
        <LayersPanel />
        <InspectorPanel />
      </aside>
    </main>
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.main {
  flex: 1;
  min-height: 0;
  display: flex;
}
.sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bp-surface);
  border-left: 1px solid var(--bp-border);
  overflow-y: auto;
}
</style>
