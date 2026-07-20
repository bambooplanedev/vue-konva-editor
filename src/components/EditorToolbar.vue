<script setup lang="ts">
import { ref } from 'vue';
import { useEditorScene } from '../editor/useEditorScene';
import { useHistory } from '../editor/useHistory';
import type { ObjectType } from '../editor/types';

const { state, addShape, toggleGrid, addImage } = useEditorScene();
const history = useHistory();
const fileInput = ref<HTMLInputElement | null>(null);

function add(type: Exclude<ObjectType, 'image'>): void {
  addShape(type);
  history.commit();
}

function onToggleGrid(): void {
  toggleGrid();
  history.commit();
}

function onImageFile(e: Event): void {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const src = reader.result as string;
    const img = new Image();
    img.onload = () => {
      const maxSide = 400;
      const k = Math.min(1, maxSide / img.width, maxSide / img.height);
      addImage(src, img.width * k, img.height * k);
      history.commit();
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
}
</script>

<template>
  <header class="toolbar">
    <div class="group">
      <button @click="add('rect')" title="Add rectangle">▭</button>
      <button @click="add('circle')" title="Add circle">◯</button>
      <button @click="add('line')" title="Add line">╱</button>
      <button @click="add('text')" title="Add text">T</button>
      <button title="Add image" @click="fileInput?.click()">🖼</button>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onImageFile" />
    </div>
    <div class="group">
      <label class="grid-toggle">
        <input type="checkbox" :checked="state.grid.enabled" @change="onToggleGrid" />
        Grid
      </label>
    </div>
    <div class="group">
      <button :disabled="!history.canUndo.value" @click="history.undo()" title="Undo">↶</button>
      <button :disabled="!history.canRedo.value" @click="history.redo()" title="Redo">↷</button>
    </div>
  </header>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  background: var(--bp-surface);
  border-bottom: 1px solid var(--bp-border);
}
.group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.group + .group {
  border-left: 1px solid var(--bp-border);
  padding-left: 16px;
}
.toolbar button {
  min-width: 34px;
  height: 30px;
  border: 1px solid var(--bp-border);
  border-radius: 4px;
  background: var(--bp-charcoal);
  color: var(--bp-offwhite);
  font-size: 15px;
}
.toolbar button:hover:not(:disabled) {
  border-color: var(--bp-green);
}
.toolbar button:disabled {
  opacity: 0.4;
  cursor: default;
}
.grid-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}
</style>
