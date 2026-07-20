import Konva from 'konva';
import { watch } from 'vue';
import { round2 } from './objects';
import { applyTransform } from './transform';
import { ARTBOARD } from './types';
import type { SceneObject } from './types';
import { useEditorScene } from './useEditorScene';
import { useHistory } from './useHistory';

let stage: Konva.Stage | null = null;
let gridGroup: Konva.Group;
let contentLayer: Konva.Layer;
let overlayLayer: Konva.Layer;
let transformer: Konva.Transformer;

const nodes = new Map<string, Konva.Shape>();
// A node is "gesturing" while the user drags/transforms it; model→node sync
// is skipped for it so the reconciler never fights an in-flight gesture.
const gesturing = new Set<string>();

function baseAttrs(obj: SceneObject): Konva.NodeConfig {
  return {
    x: obj.x,
    y: obj.y,
    rotation: obj.rotation,
    visible: obj.visible,
    draggable: !obj.locked,
    listening: !obj.locked,
  };
}

function attrsFor(obj: SceneObject): Konva.NodeConfig {
  const base = baseAttrs(obj);
  switch (obj.type) {
    case 'rect':
      return { ...base, width: obj.width, height: obj.height, fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth };
    case 'circle':
      return { ...base, radius: obj.radius, fill: obj.fill, stroke: obj.stroke, strokeWidth: obj.strokeWidth };
    case 'line':
      return { ...base, points: [...obj.points], stroke: obj.stroke, strokeWidth: obj.strokeWidth, hitStrokeWidth: 12 };
    case 'text':
      return { ...base, text: obj.text, fontSize: obj.fontSize, fill: obj.fill, fontFamily: 'Manrope' };
    case 'image':
      // Image element attachment is added in Task 8.
      return { ...base, width: obj.width, height: obj.height };
  }
}

function createNode(obj: SceneObject): Konva.Shape {
  const config = { id: obj.id };
  switch (obj.type) {
    case 'rect':
      return new Konva.Rect(config);
    case 'circle':
      return new Konva.Circle(config);
    case 'line':
      return new Konva.Line(config);
    case 'text':
      return new Konva.Text(config);
    case 'image':
      return new Konva.Image({ ...config, image: undefined });
  }
}

export function mountRenderer(container: HTMLDivElement): () => void {
  const { state, select, updateObject, replaceObject } = useEditorScene();
  const history = useHistory();

  stage = new Konva.Stage({
    container,
    width: ARTBOARD.width,
    height: ARTBOARD.height,
  });

  const gridLayer = new Konva.Layer({ listening: false });
  gridLayer.add(
    new Konva.Rect({ x: 0, y: 0, width: ARTBOARD.width, height: ARTBOARD.height, fill: '#ffffff' }),
  );
  gridGroup = new Konva.Group();
  gridLayer.add(gridGroup);

  contentLayer = new Konva.Layer();
  overlayLayer = new Konva.Layer();
  stage.add(gridLayer, contentLayer, overlayLayer);

  transformer = new Konva.Transformer({
    rotateEnabled: true,
    borderStroke: '#4CAF50',
    anchorStroke: '#256325',
    anchorFill: '#ffffff',
    anchorSize: 9,
  });
  overlayLayer.add(transformer);

  stage.on('click tap', (e) => {
    if (e.target === stage) {
      select(null);
      return;
    }
    const id = e.target.id();
    const obj = state.objects.find((o) => o.id === id);
    if (obj && !obj.locked) select(id);
  });

  function attachEvents(node: Konva.Shape): void {
    node.on('dragstart', () => gesturing.add(node.id()));

    node.on('dragmove', () => {
      if (!state.grid.enabled) return;
      const s = state.grid.size;
      node.position({
        x: Math.round(node.x() / s) * s,
        y: Math.round(node.y() / s) * s,
      });
    });

    node.on('dragend', () => {
      gesturing.delete(node.id());
      updateObject(node.id(), { x: round2(node.x()), y: round2(node.y()) });
      history.commit();
    });

    node.on('transformstart', () => gesturing.add(node.id()));

    node.on('transformend', () => {
      gesturing.delete(node.id());
      const obj = state.objects.find((o) => o.id === node.id());
      if (!obj) return;
      const patch = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      };
      // Reset node scale BEFORE the model commit so the reconcile pass
      // never renders double-scaled geometry.
      node.scale({ x: 1, y: 1 });
      replaceObject(obj.id, applyTransform(obj, patch));
      history.commit();
    });
  }

  function syncSelection(): void {
    const sel = state.objects.find((o) => o.id === state.selectedId);
    const node = sel ? nodes.get(sel.id) : undefined;
    if (state.selectedId && !sel) {
      // Selected object vanished (undo/redo/import) — clear selection.
      select(null);
    }
    if (!sel || !node || !sel.visible || sel.locked) {
      transformer.nodes([]);
      return;
    }
    const uniform = sel.type === 'circle' || sel.type === 'text';
    transformer.setAttrs({
      enabledAnchors: uniform
        ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
        : ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'],
      keepRatio: uniform,
    });
    transformer.nodes([node]);
  }

  function drawGrid(): void {
    gridGroup.destroyChildren();
    if (state.grid.enabled) {
      const s = state.grid.size;
      for (let x = s; x < ARTBOARD.width; x += s) {
        gridGroup.add(new Konva.Line({ points: [x, 0, x, ARTBOARD.height], stroke: '#e7e7e2', strokeWidth: 1 }));
      }
      for (let y = s; y < ARTBOARD.height; y += s) {
        gridGroup.add(new Konva.Line({ points: [0, y, ARTBOARD.width, y], stroke: '#e7e7e2', strokeWidth: 1 }));
      }
    }
    gridLayer.batchDraw();
  }

  function reconcile(): void {
    const seen = new Set<string>();
    state.objects.forEach((obj, index) => {
      seen.add(obj.id);
      let node = nodes.get(obj.id);
      if (!node) {
        node = createNode(obj);
        nodes.set(obj.id, node);
        contentLayer.add(node);
        attachEvents(node);
      }
      if (!gesturing.has(obj.id)) node.setAttrs(attrsFor(obj));
      node.zIndex(index);
    });
    for (const [id, node] of nodes) {
      if (!seen.has(id)) {
        node.destroy();
        nodes.delete(id);
      }
    }
    syncSelection();
    stage!.batchDraw();
  }

  function fit(): void {
    const wrap = container.parentElement!;
    const scale = Math.min(
      1,
      wrap.clientWidth / ARTBOARD.width,
      wrap.clientHeight / ARTBOARD.height,
    );
    stage!.size({ width: ARTBOARD.width * scale, height: ARTBOARD.height * scale });
    stage!.scale({ x: scale, y: scale });
    stage!.batchDraw();
  }

  const resizeObserver = new ResizeObserver(fit);
  resizeObserver.observe(container.parentElement!);

  const stopScene = watch(() => state, reconcile, { deep: true });
  const stopGrid = watch(() => [state.grid.enabled, state.grid.size], drawGrid);

  drawGrid();
  reconcile();
  fit();

  return () => {
    stopScene();
    stopGrid();
    resizeObserver.disconnect();
    nodes.clear();
    gesturing.clear();
    stage?.destroy();
    stage = null;
  };
}

export function exportStagePNG(pixelRatio: 1 | 2): string {
  if (!stage) throw new Error('Stage is not mounted');
  const prev = { scale: stage.scaleX(), width: stage.width(), height: stage.height() };
  gridGroup.visible(false);
  overlayLayer.visible(false);
  stage.scale({ x: 1, y: 1 });
  stage.size({ width: ARTBOARD.width, height: ARTBOARD.height });
  try {
    return stage.toDataURL({ pixelRatio });
  } finally {
    gridGroup.visible(true);
    overlayLayer.visible(true);
    stage.scale({ x: prev.scale, y: prev.scale });
    stage.size({ width: prev.width, height: prev.height });
    stage.batchDraw();
  }
}
