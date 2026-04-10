import { describe, it, expect, beforeEach } from 'vitest';
import { useSlotsStore } from '../store/slotsStore';

describe('slotsStore', () => {
  beforeEach(() => {
    useSlotsStore.setState({ slots: [], activeSlotId: null });
  });

  it('starts empty', () => {
    expect(useSlotsStore.getState().slots).toHaveLength(0);
    expect(useSlotsStore.getState().activeSlotId).toBeNull();
  });

  it('saves a new slot', () => {
    const id = useSlotsStore
      .getState()
      .saveSlot('My Resume', { basics: { name: 'Jane' } }, 'modern');
    expect(useSlotsStore.getState().slots).toHaveLength(1);
    expect(useSlotsStore.getState().activeSlotId).toBe(id);
    expect(useSlotsStore.getState().slots[0].name).toBe('My Resume');
    expect(useSlotsStore.getState().slots[0].resume.basics?.name).toBe('Jane');
  });

  it('saves multiple slots', () => {
    useSlotsStore.getState().saveSlot('Resume A', { basics: { name: 'A' } }, 'modern');
    useSlotsStore.getState().saveSlot('Resume B', { basics: { name: 'B' } }, 'dark');
    expect(useSlotsStore.getState().slots).toHaveLength(2);
  });

  it('updates an existing slot', () => {
    const id = useSlotsStore.getState().saveSlot('Old', { basics: { name: 'Old' } }, 'modern');
    useSlotsStore.getState().updateSlot(id, { basics: { name: 'New' } }, 'dark');
    const slot = useSlotsStore.getState().getSlot(id);
    expect(slot?.resume.basics?.name).toBe('New');
    expect(slot?.themeId).toBe('dark');
  });

  it('deletes a slot', () => {
    const id = useSlotsStore.getState().saveSlot('Delete Me', { basics: {} }, 'modern');
    useSlotsStore.getState().deleteSlot(id);
    expect(useSlotsStore.getState().slots).toHaveLength(0);
    expect(useSlotsStore.getState().activeSlotId).toBeNull();
  });

  it('renames a slot', () => {
    const id = useSlotsStore.getState().saveSlot('Old Name', { basics: {} }, 'modern');
    useSlotsStore.getState().renameSlot(id, 'New Name');
    expect(useSlotsStore.getState().getSlot(id)?.name).toBe('New Name');
  });

  it('getSlot returns undefined for unknown id', () => {
    expect(useSlotsStore.getState().getSlot('nonexistent')).toBeUndefined();
  });

  it('delete non-active slot preserves activeSlotId', () => {
    const id1 = useSlotsStore.getState().saveSlot('A', { basics: {} }, 'modern');
    const id2 = useSlotsStore.getState().saveSlot('B', { basics: {} }, 'modern');
    // id2 is active (last saved)
    useSlotsStore.getState().deleteSlot(id1);
    expect(useSlotsStore.getState().activeSlotId).toBe(id2);
    expect(useSlotsStore.getState().slots).toHaveLength(1);
  });

  it('delete active slot auto-selects a remaining slot', () => {
    const id1 = useSlotsStore.getState().saveSlot('A', { basics: {} }, 'modern');
    const id2 = useSlotsStore.getState().saveSlot('B', { basics: {} }, 'modern');
    // id2 is active (last saved)
    useSlotsStore.getState().deleteSlot(id2);
    expect(useSlotsStore.getState().activeSlotId).toBe(id1);
    expect(useSlotsStore.getState().slots).toHaveLength(1);
  });
});
