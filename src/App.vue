<script setup lang="ts">
import { onMounted } from 'vue';
import EditorCanvas from './components/EditorCanvas.vue';
import EditorToolbar from './components/EditorToolbar.vue';
import { useHistory } from './editor/useHistory';

const history = useHistory();
onMounted(() => history.resetHistory());
</script>

<template>
  <div class="app">
    <EditorToolbar />
    <main class="main">
      <EditorCanvas />
      <aside class="sidebar">
        <!-- LayersPanel (Task 7) and InspectorPanel (Task 8) mount here -->
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
