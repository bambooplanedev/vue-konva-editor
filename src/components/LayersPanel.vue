<script setup lang="ts">
import { computed } from 'vue';
import { useEditorScene } from '../editor/useEditorScene';
import { useHistory } from '../editor/useHistory';

const { state, select, moveObject, toggleVisible, toggleLocked } = useEditorScene();
const history = useHistory();

// Topmost object (end of array) first.
const rows = computed(() => [...state.objects].reverse());

function withCommit(fn: () => void): void {
  fn();
  history.commit();
}
</script>

<template>
  <section class="layers">
    <h2>Layers</h2>
    <p v-if="rows.length === 0" class="empty">No objects yet</p>
    <ul>
      <li
        v-for="obj in rows"
        :key="obj.id"
        :class="{ selected: obj.id === state.selectedId }"
        @click="select(obj.id)"
      >
        <span class="name" :class="{ hidden: !obj.visible }">{{ obj.name }}</span>
        <span class="controls" @click.stop>
          <button title="Bring forward" @click="withCommit(() => moveObject(obj.id, 1))">▲</button>
          <button title="Send backward" @click="withCommit(() => moveObject(obj.id, -1))">▼</button>
          <button :title="obj.visible ? 'Hide' : 'Show'" @click="withCommit(() => toggleVisible(obj.id))">
            {{ obj.visible ? '👁' : '﹘' }}
          </button>
          <button :title="obj.locked ? 'Unlock' : 'Lock'" @click="withCommit(() => toggleLocked(obj.id))">
            {{ obj.locked ? '🔒' : '🔓' }}
          </button>
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.layers {
  padding: 12px;
  border-bottom: 1px solid var(--bp-border);
  flex: 1;
  min-height: 120px;
  overflow-y: auto;
}
h2 {
  margin: 0 0 8px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--bp-green);
}
.empty {
  font-size: 13px;
  opacity: 0.6;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}
li:hover {
  background: var(--bp-charcoal);
}
li.selected {
  background: var(--bp-green-deep);
}
.name.hidden {
  opacity: 0.45;
  text-decoration: line-through;
}
.controls {
  display: flex;
  gap: 2px;
}
.controls button {
  border: none;
  background: transparent;
  color: var(--bp-offwhite);
  font-size: 12px;
  padding: 2px 3px;
  border-radius: 3px;
}
.controls button:hover {
  background: var(--bp-border);
}
</style>
