import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorScene } from '../src/editor/useEditorScene';
import { useHistory } from '../src/editor/useHistory';

const scene = useEditorScene();
const history = useHistory();

beforeEach(() => {
  scene.resetScene();
  history.resetHistory();
});

describe('undo/redo', () => {
  it('undo restores the previous committed state, redo reapplies it', () => {
    const rect = scene.addShape('rect');
    history.commit();
    scene.updateObject(rect.id, { x: 300 });
    history.commit();
    expect(scene.state.objects[0]!.x).toBe(300);

    history.undo();
    expect(scene.state.objects[0]!.x).not.toBe(300);

    history.redo();
    expect(scene.state.objects[0]!.x).toBe(300);
  });

  it('undo past the first commit restores the empty scene', () => {
    scene.addShape('circle');
    history.commit();
    history.undo();
    expect(scene.state.objects).toHaveLength(0);
    expect(history.canUndo.value).toBe(false);
  });

  it('a commit after undo clears the redo stack', () => {
    scene.addShape('rect');
    history.commit();
    scene.addShape('circle');
    history.commit();
    history.undo();
    expect(history.canRedo.value).toBe(true);
    scene.addShape('text');
    history.commit();
    expect(history.canRedo.value).toBe(false);
  });

  it('selection is not part of history', () => {
    const rect = scene.addShape('rect');
    history.commit();
    scene.updateObject(rect.id, { x: 111 });
    history.commit();
    scene.select(null);
    history.undo();
    expect(scene.state.selectedId).toBeNull();
  });

  it('caps history at 50 snapshots', () => {
    const rect = scene.addShape('rect');
    history.commit();
    for (let i = 1; i <= 60; i++) {
      scene.updateObject(rect.id, { x: i });
      history.commit();
    }
    let undos = 0;
    while (history.canUndo.value) {
      history.undo();
      undos++;
    }
    expect(undos).toBe(49);
  });

  it('snapshots are isolated from later mutations', () => {
    const rect = scene.addShape('rect');
    history.commit();
    scene.updateObject(rect.id, { x: 500 });
    history.commit();
    history.undo();
    const xAfterUndo = scene.state.objects[0]!.x;
    scene.updateObject(rect.id, { x: 999 });
    history.undo();
    expect(scene.state.objects[0]!.x).toBe(xAfterUndo);
  });

  it('undo discards uncommitted changes and keeps redo intact', () => {
    const rect = scene.addShape('rect');
    history.commit();
    scene.updateObject(rect.id, { x: 500 });
    history.commit();
    history.undo();
    const committedX = scene.state.objects[0]!.x;
    scene.updateObject(rect.id, { x: 999 });
    history.undo();
    expect(scene.state.objects[0]!.x).toBe(committedX);
    history.redo();
    expect(scene.state.objects[0]!.x).toBe(500);
  });
});

describe('scene mutations', () => {
  it('moveObject swaps z-order (array order)', () => {
    const a = scene.addShape('rect');
    const b = scene.addShape('circle');
    scene.moveObject(a.id, 1);
    expect(scene.state.objects.map((o) => o.id)).toEqual([b.id, a.id]);
    scene.moveObject(a.id, 1); // already at top: no-op
    expect(scene.state.objects.map((o) => o.id)).toEqual([b.id, a.id]);
  });

  it('removeObject clears selection of the removed object', () => {
    const a = scene.addShape('rect');
    expect(scene.state.selectedId).toBe(a.id);
    scene.removeObject(a.id);
    expect(scene.state.selectedId).toBeNull();
    expect(scene.state.objects).toHaveLength(0);
  });

  it('updateObject rounds numbers at mutation time', () => {
    const a = scene.addShape('rect');
    scene.updateObject(a.id, { x: 10.0001, y: -0.001 });
    expect(scene.state.objects[0]!.x).toBe(10);
    expect(Object.is(scene.state.objects[0]!.y, 0)).toBe(true);
  });

  it('names objects per type sequentially', () => {
    scene.addShape('rect');
    scene.addShape('circle');
    const r2 = scene.addShape('rect');
    expect(r2.name).toBe('rect 2');
  });
});
