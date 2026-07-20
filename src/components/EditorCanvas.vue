<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { mountRenderer } from '../editor/useKonvaRenderer';

const container = ref<HTMLDivElement | null>(null);
let cleanup: (() => void) | null = null;

onMounted(() => {
  cleanup = mountRenderer(container.value!);
});
onBeforeUnmount(() => cleanup?.());
</script>

<template>
  <div class="canvas-wrap">
    <div ref="container" class="stage-container"></div>
  </div>
</template>

<style scoped>
.canvas-wrap {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 16px;
}
.stage-container {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
}
</style>
