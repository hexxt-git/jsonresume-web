import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { ResumeSchema } from '../types/resume';
import type { ThemeCustomization } from './themeCustomStore';

/* ── Types ───────────────────────────────────────────────── */

export interface SlotSnapshot {
  resume: ResumeSchema;
  themeId: string;
  customization: ThemeCustomization;
}

interface SlotHistory {
  past: SlotSnapshot[];
  future: SlotSnapshot[];
}

interface UndoStore {
  histories: Record<string, SlotHistory>;

  pushSnapshot: (slotId: string, snapshot: SlotSnapshot) => void;
  undo: (slotId: string, current: SlotSnapshot) => SlotSnapshot | null;
  redo: (slotId: string, current: SlotSnapshot) => SlotSnapshot | null;
  canUndo: (slotId: string) => boolean;
  canRedo: (slotId: string) => boolean;
  deleteSlotHistory: (slotId: string) => void;
}

const MAX_HISTORY = 50;

/* ── Debounced storage (separate instance from resumeStore) ─ */

let timer: ReturnType<typeof setTimeout>;
let pending: { name: string; value: string } | null = null;

const storage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    pending = { name, value };
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (pending) {
        localStorage.setItem(pending.name, pending.value);
        pending = null;
      }
    }, 1000);
  },
  removeItem: (name) => localStorage.removeItem(name),
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (pending) {
      localStorage.setItem(pending.name, pending.value);
      pending = null;
    }
  });
}

/* ── Store ───────────────────────────────────────────────── */

const emptyHistory: SlotHistory = { past: [], future: [] };

export const useUndoStore = create<UndoStore>()(
  persist(
    (set, get) => ({
      histories: {},

      pushSnapshot: (slotId, snapshot) =>
        set((s) => {
          const h = s.histories[slotId] ?? emptyHistory;
          const past = [...h.past, snapshot];
          if (past.length > MAX_HISTORY) past.shift();
          return {
            histories: {
              ...s.histories,
              [slotId]: { past, future: [] },
            },
          };
        }),

      undo: (slotId, current) => {
        const h = get().histories[slotId];
        if (!h || h.past.length === 0) return null;
        const snapshot = h.past[h.past.length - 1];
        set((s) => {
          const hist = s.histories[slotId] ?? emptyHistory;
          return {
            histories: {
              ...s.histories,
              [slotId]: {
                past: hist.past.slice(0, -1),
                future: [...hist.future, current],
              },
            },
          };
        });
        return snapshot;
      },

      redo: (slotId, current) => {
        const h = get().histories[slotId];
        if (!h || h.future.length === 0) return null;
        const snapshot = h.future[h.future.length - 1];
        set((s) => {
          const hist = s.histories[slotId] ?? emptyHistory;
          return {
            histories: {
              ...s.histories,
              [slotId]: {
                past: [...hist.past, current],
                future: hist.future.slice(0, -1),
              },
            },
          };
        });
        return snapshot;
      },

      canUndo: (slotId) => {
        const h = get().histories[slotId];
        return !!h && h.past.length > 0;
      },

      canRedo: (slotId) => {
        const h = get().histories[slotId];
        return !!h && h.future.length > 0;
      },

      deleteSlotHistory: (slotId) =>
        set((s) => {
          const { [slotId]: _, ...rest } = s.histories;
          return { histories: rest };
        }),
    }),
    {
      name: 'undo-histories',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ histories: state.histories }),
    },
  ),
);
