import { useEffect, useRef, useCallback } from 'react';
import { useResumeStore, activeSlot } from '../store/resumeStore';
import { useUndoStore, type SlotSnapshot } from '../store/undoStore';

/* ── Snapshot capture ─────────────────────────────────── */

let _isUndoRedo = false;
let _debounceTimer: ReturnType<typeof setTimeout>;
let _prevJson = '';

function getCurrentSnapshot(): SlotSnapshot {
  const slot = activeSlot(useResumeStore.getState());
  return {
    resume: slot.resume,
    themeId: slot.themeId,
    customization: slot.customization,
  };
}

function getActiveId(): string | null {
  return useResumeStore.getState().activeSlotId;
}

/**
 * Push the PREVIOUS state (before the latest burst of edits) to the undo stack,
 * then update _prevJson to the current state.
 */
function pushPrevIfChanged() {
  const slotId = getActiveId();
  if (!slotId || !_prevJson) return;
  const currentJson = JSON.stringify(getCurrentSnapshot());
  if (currentJson === _prevJson) return;
  // Push the state from BEFORE the edits
  const prevSnap: SlotSnapshot = JSON.parse(_prevJson);
  useUndoStore.getState().pushSnapshot(slotId, prevSnap);
  _prevJson = currentJson;
}

/**
 * Call BEFORE a discrete mutation (theme change, AI tool call, import, etc.)
 * to save the current state as a checkpoint before it changes.
 */
export function captureBeforeDiscreteMutation() {
  if (_isUndoRedo) return;
  clearTimeout(_debounceTimer);
  pushPrevIfChanged();
}

/* ── Subscriber: auto-capture debounced snapshots ────── */

let _subscribed = false;

function ensureSubscribed() {
  if (_subscribed) return;
  _subscribed = true;

  // Seed _prevJson with current state (baseline for first edit)
  if (getActiveId()) {
    _prevJson = JSON.stringify(getCurrentSnapshot());
  }

  useResumeStore.subscribe((state, prev) => {
    if (_isUndoRedo) return;

    const slotId = state.activeSlotId;
    if (!slotId) return;

    // Check if slot data actually changed
    const slot = activeSlot(state);
    const prevSlot = activeSlot(prev);
    if (
      slot.resume === prevSlot.resume &&
      slot.themeId === prevSlot.themeId &&
      slot.customization === prevSlot.customization
    ) {
      return;
    }

    // Debounced capture: push previous state after edits settle
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(pushPrevIfChanged, 1000);
  });
}

/* ── Hook ─────────────────────────────────────────────── */

export function useUndoRedo() {
  const activeSlotId = useResumeStore((s) => s.activeSlotId);
  const histories = useUndoStore((s) => s.histories);

  const h = activeSlotId ? histories[activeSlotId] : null;
  const canUndo = !!h && h.past.length > 0;
  const canRedo = !!h && h.future.length > 0;

  // Subscribe once on mount
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    ensureSubscribed();
  }, []);

  // Re-seed _prevJson when switching slots
  useEffect(() => {
    if (!activeSlotId) return;
    _prevJson = JSON.stringify(getCurrentSnapshot());
  }, [activeSlotId]);

  const undo = useCallback(() => {
    const slotId = getActiveId();
    if (!slotId) return;
    clearTimeout(_debounceTimer);

    // Flush any pending debounced snapshot first
    pushPrevIfChanged();

    const current = getCurrentSnapshot();
    const snapshot = useUndoStore.getState().undo(slotId, current);
    if (!snapshot) return;

    _isUndoRedo = true;
    const store = useResumeStore.getState();
    store.setResume(snapshot.resume);
    store.setTheme(snapshot.themeId);
    store.setFullCustomization(snapshot.customization);
    _prevJson = JSON.stringify(snapshot);
    _isUndoRedo = false;
  }, []);

  const redo = useCallback(() => {
    const slotId = getActiveId();
    if (!slotId) return;
    clearTimeout(_debounceTimer);

    const current = getCurrentSnapshot();
    const snapshot = useUndoStore.getState().redo(slotId, current);
    if (!snapshot) return;

    _isUndoRedo = true;
    const store = useResumeStore.getState();
    store.setResume(snapshot.resume);
    store.setTheme(snapshot.themeId);
    store.setFullCustomization(snapshot.customization);
    _prevJson = JSON.stringify(snapshot);
    _isUndoRedo = false;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key !== 'z') return;

      // Don't intercept Monaco editor's own undo
      const target = e.target as HTMLElement;
      if (target.closest('.monaco-editor')) return;

      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return { undo, redo, canUndo, canRedo };
}
