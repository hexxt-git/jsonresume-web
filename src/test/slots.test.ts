import { describe, it, expect, beforeEach } from 'vitest';
import { useResumeStore, activeSlot } from '../store/resumeStore';

describe('slot management', () => {
  beforeEach(() => {
    // Clear all slots
    const s = useResumeStore.getState();
    s.slots.forEach((slot) => s.deleteSlot(slot.id));
  });

  it('saveSlot creates slot and activates it', () => {
    const id = useResumeStore.getState().saveSlot('Test');
    expect(useResumeStore.getState().activeSlotId).toBe(id);
    expect(useResumeStore.getState().slots).toHaveLength(1);
    expect(useResumeStore.getState().slots[0].name).toBe('Test');
  });

  it('multiple slots coexist', () => {
    useResumeStore.getState().saveSlot('One');
    useResumeStore.getState().saveSlot('Two');
    expect(useResumeStore.getState().slots).toHaveLength(2);
  });

  it('deleteSlot removes slot and switches to next', () => {
    const id1 = useResumeStore.getState().saveSlot('One');
    useResumeStore.getState().saveSlot('Two');
    useResumeStore.getState().setActiveSlotId(id1);
    useResumeStore.getState().deleteSlot(id1);
    expect(useResumeStore.getState().slots).toHaveLength(1);
    expect(useResumeStore.getState().activeSlotId).not.toBe(id1);
  });

  it('renameSlot updates name', () => {
    const id = useResumeStore.getState().saveSlot('Old');
    useResumeStore.getState().renameSlot(id, 'New');
    expect(useResumeStore.getState().getSlot(id)?.name).toBe('New');
  });

  it('duplicateSlot copies current slot', () => {
    useResumeStore.getState().saveSlot('Original');
    useResumeStore.getState().updateBasics('name', 'Jane');
    useResumeStore.getState().duplicateSlot();
    expect(useResumeStore.getState().slots).toHaveLength(2);
    expect(activeSlot(useResumeStore.getState()).resume.basics?.name).toBe('Jane');
  });

  it('switching slots changes active data', () => {
    const id1 = useResumeStore.getState().saveSlot('');
    useResumeStore.getState().updateBasics('name', 'Alice');
    const id2 = useResumeStore.getState().saveSlot('');
    useResumeStore.getState().updateBasics('name', 'Bob');

    useResumeStore.getState().setActiveSlotId(id1);
    expect(activeSlot(useResumeStore.getState()).resume.basics?.name).toBe('Alice');
    useResumeStore.getState().setActiveSlotId(id2);
    expect(activeSlot(useResumeStore.getState()).resume.basics?.name).toBe('Bob');
  });

  it('chat messages are per-slot', () => {
    const id1 = useResumeStore.getState().saveSlot('');
    useResumeStore.getState().addUserMessage('hello from slot 1');
    const id2 = useResumeStore.getState().saveSlot('');
    useResumeStore.getState().addUserMessage('hello from slot 2');

    useResumeStore.getState().setActiveSlotId(id1);
    expect(activeSlot(useResumeStore.getState()).chatHistory).toHaveLength(1);
    expect(activeSlot(useResumeStore.getState()).chatHistory[0].role).toBe('user');

    useResumeStore.getState().setActiveSlotId(id2);
    expect(activeSlot(useResumeStore.getState()).chatHistory).toHaveLength(1);
  });
});
