import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ResumeSchema } from '../types/resume';
import type { AnyMessage } from '../lib/ai';
import { defaultCustomization, type ThemeCustomization } from './themeCustomStore';

export function slotDisplayName(slot: ResumeSlot): string {
  return slot.name
    ? slot.name
    : slot.resume.basics?.name
      ? `${slot.resume.basics?.name}'s Resume`
      : 'Untitled';
}

export interface ResumeSlot {
  id: string;
  name: string;
  resume: ResumeSchema;
  themeId: string;
  customization: ThemeCustomization;
  chatHistory: AnyMessage[];
  updatedAt: number;
}

interface SlotsStore {
  slots: ResumeSlot[];
  activeSlotId: string | null;

  saveSlot: (
    name: string,
    resume: ResumeSchema,
    themeId: string,
    customization?: ThemeCustomization,
    chatHistory?: AnyMessage[],
  ) => string;
  updateSlot: (
    id: string,
    resume: ResumeSchema,
    themeId: string,
    customization?: ThemeCustomization,
    chatHistory?: AnyMessage[],
  ) => void;
  deleteSlot: (id: string) => void;
  renameSlot: (id: string, name: string) => void;
  setActiveSlotId: (id: string | null) => void;
  getSlot: (id: string) => ResumeSlot | undefined;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const useSlotsStore = create<SlotsStore>()(
  persist(
    (set, get) => ({
      slots: [],
      activeSlotId: null,

      saveSlot: (name, resume, themeId, customization, chatHistory) => {
        const id = genId();
        set((s) => ({
          slots: [
            ...s.slots,
            {
              id,
              name,
              resume,
              themeId,
              customization: customization || { ...defaultCustomization },
              chatHistory: chatHistory || [],
              updatedAt: Date.now(),
            },
          ],
          activeSlotId: id,
        }));
        return id;
      },

      updateSlot: (id, resume, themeId, customization, chatHistory) =>
        set((s) => ({
          slots: s.slots.map((slot) =>
            slot.id === id
              ? {
                  ...slot,
                  resume,
                  themeId,
                  customization: customization || slot.customization,
                  chatHistory: chatHistory ?? slot.chatHistory ?? [],
                  updatedAt: Date.now(),
                }
              : slot,
          ),
        })),

      deleteSlot: (id) =>
        set((s) => {
          const remaining = s.slots.filter((slot) => slot.id !== id);
          let nextActiveId = s.activeSlotId;
          if (s.activeSlotId === id) {
            nextActiveId = remaining.length
              ? remaining.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b)).id
              : null;
          }
          return { slots: remaining, activeSlotId: nextActiveId };
        }),

      renameSlot: (id, name) =>
        set((s) => ({
          slots: s.slots.map((slot) => (slot.id === id ? { ...slot, name } : slot)),
        })),

      setActiveSlotId: (id) => set({ activeSlotId: id }),

      getSlot: (id) => get().slots.find((s) => s.id === id),
    }),
    { name: 'resume-slots' },
  ),
);
