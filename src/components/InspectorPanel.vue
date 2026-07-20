<script setup lang="ts">
import { computed } from 'vue';
import { useEditorScene } from '../editor/useEditorScene';
import { useHistory } from '../editor/useHistory';
import type { ObjectPatch } from '../editor/useEditorScene';

const { state, updateObject } = useEditorScene();
const history = useHistory();

const selected = computed(() => state.objects.find((o) => o.id === state.selectedId) ?? null);
const hasFill = computed(() => selected.value !== null && 'fill' in selected.value);
const hasStroke = computed(() => selected.value !== null && 'stroke' in selected.value);
const isText = computed(() => selected.value?.type === 'text');

// Model updates live on input (preview); history commits on change/blur only.
function setNumber(key: keyof ObjectPatch, e: Event): void {
  const value = Number((e.target as HTMLInputElement).value);
  if (!Number.isFinite(value) || !selected.value) return;
  updateObject(selected.value.id, { [key]: value } as ObjectPatch);
}

function setString(key: keyof ObjectPatch, e: Event): void {
  if (!selected.value) return;
  const value = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
  updateObject(selected.value.id, { [key]: value } as ObjectPatch);
}

const commit = (): void => history.commit();
</script>

<template>
  <section class="inspector">
    <h2>Inspector</h2>
    <p v-if="!selected" class="empty">Nothing selected</p>
    <div v-else class="fields">
      <label>
        X
        <input type="number" :value="selected.x" @input="setNumber('x', $event)" @change="commit" />
      </label>
      <label>
        Y
        <input type="number" :value="selected.y" @input="setNumber('y', $event)" @change="commit" />
      </label>
      <label v-if="hasFill">
        Fill
        <input type="color" :value="(selected as any).fill" @input="setString('fill', $event)" @change="commit" />
      </label>
      <label v-if="hasStroke">
        Stroke
        <input type="color" :value="(selected as any).stroke" @input="setString('stroke', $event)" @change="commit" />
      </label>
      <label v-if="hasStroke">
        Stroke width
        <input type="number" min="0" :value="(selected as any).strokeWidth" @input="setNumber('strokeWidth', $event)" @change="commit" />
      </label>
      <label v-if="isText" class="wide">
        Text
        <textarea rows="2" :value="(selected as any).text" @input="setString('text', $event)" @change="commit"></textarea>
      </label>
      <label v-if="isText">
        Font size
        <input type="number" min="6" :value="(selected as any).fontSize" @input="setNumber('fontSize', $event)" @change="commit" />
      </label>
    </div>
  </section>
</template>

<style scoped>
.inspector {
  padding: 12px;
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
.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
}
label.wide {
  grid-column: 1 / -1;
}
input,
textarea {
  font-family: inherit;
  font-size: 13px;
  background: var(--bp-charcoal);
  color: var(--bp-offwhite);
  border: 1px solid var(--bp-border);
  border-radius: 4px;
  padding: 4px 6px;
  width: 100%;
  min-width: 0;
}
input[type='color'] {
  padding: 1px;
  height: 28px;
}
</style>
