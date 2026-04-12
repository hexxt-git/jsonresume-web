import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ── Types ───────────────────────────────────────────────── */

export interface SavedJd {
  id: string;
  title: string;
  company: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number;
  usageCount: number;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ── Store ────────────────────────────────────────────────── */

interface JdStore {
  items: SavedJd[];

  save: (data: { title: string; company: string; content: string }) => string;
  update: (id: string, patch: Partial<Pick<SavedJd, 'title' | 'company' | 'content'>>) => void;
  remove: (id: string) => void;
  markUsed: (id: string) => void;
}

export const useJdStore = create<JdStore>()(
  persist(
    (set) => ({
      items: [],

      save: (data) => {
        const id = genId();
        const now = Date.now();
        set((s) => ({
          items: [
            { id, ...data, createdAt: now, updatedAt: now, lastUsedAt: now, usageCount: 0 },
            ...s.items,
          ],
        }));
        return id;
      },

      update: (id, patch) =>
        set((s) => ({
          items: s.items.map((j) => (j.id === id ? { ...j, ...patch, updatedAt: Date.now() } : j)),
        })),

      remove: (id) => set((s) => ({ items: s.items.filter((j) => j.id !== id) })),

      markUsed: (id) =>
        set((s) => ({
          items: s.items.map((j) =>
            j.id === id ? { ...j, lastUsedAt: Date.now(), usageCount: j.usageCount + 1 } : j,
          ),
        })),
    }),
    { name: 'jd-store' },
  ),
);
