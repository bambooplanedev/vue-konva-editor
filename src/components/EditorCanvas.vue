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
  overflow: hidden;
}
.stage-container {
  width: 100%;
  height: 100%;
}
</style>
