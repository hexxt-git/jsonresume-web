import { useEffect, useCallback } from 'react';
import { useResumeStore, activeSlot } from '../store/resumeStore';
import { useUndoStore, type SlotSnapshot } from '../store/undoStore';

/* ── Module-level singleton state ─────────────────────── */
/* These are intentionally module-scoped — the undo capture
   subscription is a singleton that lives for the app lifetime,
   independent of React component mount/unmount cycles.       */

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

function pushPrevIfChanged() {
  const slotId = getActiveId();
  if (!slotId || !_prevJson) return;
  const currentJson = JSON.stringify(getCurrentSnapshot());
  if (currentJson === _prevJson) return;
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

function doUndo() {
  const slotId = getActiveId();
  if (!slotId) return;
  clearTimeout(_debounceTimer);
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
}

function doRedo() {
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
}

/* ── Store subscription (runs once at module load) ────── */

// Seed baseline
if (getActiveId()) {
  _prevJson = JSON.stringify(getCurrentSnapshot());
}

// Single subscription — handles both slot data changes and slot switches
useResumeStore.subscribe((state, prev) => {
  if (_isUndoRedo) return;

  // Slot switch: re-seed baseline, don't push undo entry
  if (state.activeSlotId !== prev.activeSlotId) {
    if (state.activeSlotId) {
      _prevJson = JSON.stringify(getCurrentSnapshot());
    }
    return;
  }

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

/* ── React hook (pure selector + keyboard shortcuts) ──── */

export function useUndoRedo() {
  const activeSlotId = useResumeStore((s) => s.activeSlotId);
  const histories = useUndoStore((s) => s.histories);

  const h = activeSlotId ? histories[activeSlotId] : null;
  const canUndo = !!h && h.past.length > 0;
  const canRedo = !!h && h.future.length > 0;

  const undo = useCallback(doUndo, []);
  const redo = useCallback(doRedo, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key !== 'z') return;

      // Don't intercept Monaco editor's own undo
      const target = e.target as HTMLElement;
      if (target.closest('.monaco-editor')) return;

      e.preventDefault();
      if (e.shiftKey) doRedo();
      else doUndo();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { undo, redo, canUndo, canRedo };
}
