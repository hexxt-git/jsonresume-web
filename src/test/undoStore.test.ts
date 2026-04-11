import { describe, it, expect, beforeEach } from 'vitest';
import { useUndoStore, type SlotSnapshot } from '../store/undoStore';
import { defaultCustomization } from '../store/themeCustomStore';

function snap(name: string): SlotSnapshot {
  return {
    resume: { basics: { name } },
    themeId: 'modern',
    customization: { ...defaultCustomization },
  };
}

describe('undoStore', () => {
  beforeEach(() => {
    // Clear all histories
    const { histories } = useUndoStore.getState();
    Object.keys(histories).forEach((id) => useUndoStore.getState().deleteSlotHistory(id));
  });

  it('push adds to past, clears future', () => {
    useUndoStore.getState().pushSnapshot('s1', snap('A'));
    useUndoStore.getState().pushSnapshot('s1', snap('B'));
    expect(useUndoStore.getState().canUndo('s1')).toBe(true);
    expect(useUndoStore.getState().canRedo('s1')).toBe(false);
  });

  it('undo pops from past, pushes current to future', () => {
    useUndoStore.getState().pushSnapshot('s1', snap('A'));
    useUndoStore.getState().pushSnapshot('s1', snap('B'));
    const result = useUndoStore.getState().undo('s1', snap('C'));
    expect(result?.resume.basics?.name).toBe('B');
    expect(useUndoStore.getState().canRedo('s1')).toBe(true);
  });

  it('redo pops from future, pushes current to past', () => {
    useUndoStore.getState().pushSnapshot('s1', snap('A'));
    useUndoStore.getState().undo('s1', snap('B'));
    const result = useUndoStore.getState().redo('s1', snap('A'));
    expect(result?.resume.basics?.name).toBe('B');
  });

  it('undo returns null when past empty', () => {
    expect(useUndoStore.getState().undo('s1', snap('X'))).toBeNull();
  });

  it('redo returns null when future empty', () => {
    expect(useUndoStore.getState().redo('s1', snap('X'))).toBeNull();
  });

  it('push clears redo stack', () => {
    useUndoStore.getState().pushSnapshot('s1', snap('A'));
    useUndoStore.getState().undo('s1', snap('B'));
    expect(useUndoStore.getState().canRedo('s1')).toBe(true);
    useUndoStore.getState().pushSnapshot('s1', snap('C'));
    expect(useUndoStore.getState().canRedo('s1')).toBe(false);
  });

  it('caps history at 50', () => {
    for (let i = 0; i < 60; i++) {
      useUndoStore.getState().pushSnapshot('s1', snap(`v${i}`));
    }
    const h = useUndoStore.getState().histories['s1'];
    expect(h.past.length).toBe(50);
  });

  it('isolates histories per slot', () => {
    useUndoStore.getState().pushSnapshot('s1', snap('A'));
    useUndoStore.getState().pushSnapshot('s2', snap('X'));
    expect(useUndoStore.getState().canUndo('s1')).toBe(true);
    expect(useUndoStore.getState().canUndo('s2')).toBe(true);
    expect(useUndoStore.getState().canUndo('s3')).toBe(false);
  });

  it('deleteSlotHistory removes history', () => {
    useUndoStore.getState().pushSnapshot('s1', snap('A'));
    useUndoStore.getState().deleteSlotHistory('s1');
    expect(useUndoStore.getState().canUndo('s1')).toBe(false);
  });
});
