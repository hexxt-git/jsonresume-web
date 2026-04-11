import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { ResumeSchema } from '../types/resume';
import type { AnyMessage, ToolCall } from '../lib/ai';
import { sampleResume } from '../utils/sample';
import { defaultCustomization, type ThemeCustomization } from './themeCustomStore';

/* ── Types ───────────────────────────────────────────────── */

export type EditorSection =
  | 'basics'
  | 'work'
  | 'education'
  | 'skills'
  | 'projects'
  | 'volunteer'
  | 'awards'
  | 'certificates'
  | 'publications'
  | 'languages'
  | 'interests'
  | 'references';

export interface ResumeSlot {
  id: string;
  name: string;
  resume: ResumeSchema;
  themeId: string;
  customization: ThemeCustomization;
  chatHistory: AnyMessage[];
  updatedAt: number;
}

export function slotDisplayName(slot: ResumeSlot): string {
  return slot.name
    ? slot.name
    : slot.resume.basics?.name
      ? `${slot.resume.basics.name}'s Resume`
      : 'Untitled';
}

const EMPTY_RESUME: ResumeSchema = { basics: { name: '', label: '', summary: '' } };

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ── Debounced localStorage ──────────────────────────────── */

let debounceTimer: ReturnType<typeof setTimeout>;
let pendingWrite: { name: string; value: string } | null = null;

const debouncedStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    pendingWrite = { name, value };
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (pendingWrite) {
        localStorage.setItem(pendingWrite.name, pendingWrite.value);
        pendingWrite = null;
      }
    }, 500);
  },
  removeItem: (name) => localStorage.removeItem(name),
};

// Flush pending writes on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (pendingWrite) {
      localStorage.setItem(pendingWrite.name, pendingWrite.value);
      pendingWrite = null;
    }
  });
}

/* ── Store interface ─────────────────────────────────────── */

interface ResumeStore {
  slots: ResumeSlot[];
  activeSlotId: string | null;
  activeSection: EditorSection;

  // Resume mutations (operate on active slot)
  setResume: (resume: ResumeSchema) => void;
  updateBasics: (field: string, value: unknown) => void;
  updateBasicsLocation: (field: string, value: unknown) => void;
  updateArraySection: <K extends keyof ResumeSchema>(section: K, items: ResumeSchema[K]) => void;
  setTheme: (themeId: string) => void;
  setActiveSection: (section: EditorSection) => void;
  setCustomization: (field: keyof ThemeCustomization, value: string | number) => void;
  setFullCustomization: (c: ThemeCustomization) => void;
  resetCustomization: () => void;
  loadSample: () => void;
  reset: () => void;

  // Chat messages (operate on active slot's chatHistory)
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  updateLastAssistantMessage: (content: string) => void;
  addToolCallsToLastAssistant: (calls: ToolCall[]) => void;
  addToolResult: (
    toolName: string,
    result: string,
    success: boolean,
    path: string[],
    before: unknown,
  ) => void;
  toggleToolUndo: (id: string, after: unknown) => void;
  removeLastMessage: () => void;
  removeToolResult: (id: string) => void;
  clearMessages: () => void;

  // Slot management
  saveSlot: (
    name: string,
    resume?: ResumeSchema,
    themeId?: string,
    customization?: ThemeCustomization,
    chatHistory?: AnyMessage[],
  ) => string;
  duplicateSlot: () => void;
  deleteSlot: (id: string) => void;
  renameSlot: (id: string, name: string) => void;
  setActiveSlotId: (id: string | null) => void;
  getSlot: (id: string) => ResumeSlot | undefined;
  updateSlotChatHistory: (id: string, chatHistory: AnyMessage[]) => void;
}

/* ── Helper: immutably update the active slot ────────────── */

function updateActive(
  state: Pick<ResumeStore, 'slots' | 'activeSlotId'>,
  updater: (slot: ResumeSlot) => Partial<ResumeSlot>,
): { slots: ResumeSlot[] } {
  return {
    slots: state.slots.map((slot) =>
      slot.id === state.activeSlotId ? { ...slot, ...updater(slot), updatedAt: Date.now() } : slot,
    ),
  };
}

/* ── Selector helper: get active slot (with safe fallback) ─ */

const EMPTY_SLOT: ResumeSlot = {
  id: '',
  name: '',
  resume: { ...EMPTY_RESUME },
  themeId: 'modern',
  customization: { ...defaultCustomization },
  chatHistory: [],
  updatedAt: 0,
};

export function activeSlot(state: Pick<ResumeStore, 'slots' | 'activeSlotId'>): ResumeSlot {
  return state.slots.find((s) => s.id === state.activeSlotId) ?? EMPTY_SLOT;
}

/* ── Store ───────────────────────────────────────────────── */

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      slots: [],
      activeSlotId: null,
      activeSection: 'basics',

      // ── Resume mutations (target active slot) ──

      setResume: (resume) => set((s) => updateActive(s, () => ({ resume }))),

      updateBasics: (field, value) =>
        set((s) =>
          updateActive(s, (slot) => ({
            resume: {
              ...slot.resume,
              basics: { ...slot.resume.basics, [field]: value },
            },
          })),
        ),

      updateBasicsLocation: (field, value) =>
        set((s) =>
          updateActive(s, (slot) => ({
            resume: {
              ...slot.resume,
              basics: {
                ...slot.resume.basics,
                location: { ...slot.resume.basics?.location, [field]: value },
              },
            },
          })),
        ),

      updateArraySection: (section, items) =>
        set((s) =>
          updateActive(s, (slot) => ({
            resume: { ...slot.resume, [section]: items },
          })),
        ),

      setTheme: (themeId) => set((s) => updateActive(s, () => ({ themeId }))),

      setActiveSection: (section) => set({ activeSection: section }),

      setCustomization: (field, value) =>
        set((s) =>
          updateActive(s, (slot) => ({
            customization: { ...slot.customization, [field]: value },
          })),
        ),

      setFullCustomization: (c) => set((s) => updateActive(s, () => ({ customization: c }))),

      resetCustomization: () =>
        set((s) => updateActive(s, () => ({ customization: { ...defaultCustomization } }))),

      loadSample: () => set((s) => updateActive(s, () => ({ resume: sampleResume }))),

      reset: () =>
        set((s) => ({
          ...updateActive(s, () => ({
            resume: { basics: { name: '', label: '', summary: '' } },
            themeId: 'modern',
            customization: { ...defaultCustomization },
          })),
          activeSection: 'basics' as EditorSection,
        })),

      // ── Chat messages (modify active slot's chatHistory) ──

      addUserMessage: (content) =>
        set((s) =>
          updateActive(s, (slot) => ({
            chatHistory: [
              ...slot.chatHistory,
              { id: genId(), role: 'user' as const, content, timestamp: Date.now() },
            ],
          })),
        ),

      addAssistantMessage: (content) =>
        set((s) =>
          updateActive(s, (slot) => ({
            chatHistory: [
              ...slot.chatHistory,
              { id: genId(), role: 'assistant' as const, content, timestamp: Date.now() },
            ],
          })),
        ),

      updateLastAssistantMessage: (content) =>
        set((s) =>
          updateActive(s, (slot) => {
            const msgs = [...slot.chatHistory];
            const last = msgs[msgs.length - 1];
            if (last?.role === 'assistant') {
              msgs[msgs.length - 1] = { ...last, content };
            }
            return { chatHistory: msgs };
          }),
        ),

      addToolCallsToLastAssistant: (calls) =>
        set((s) =>
          updateActive(s, (slot) => {
            const msgs = [...slot.chatHistory];
            const last = msgs[msgs.length - 1];
            if (last?.role === 'assistant') {
              msgs[msgs.length - 1] = {
                ...last,
                toolCalls: [...(last.toolCalls || []), ...calls],
              };
            }
            return { chatHistory: msgs };
          }),
        ),

      addToolResult: (toolName, result, success, path, before) =>
        set((s) =>
          updateActive(s, (slot) => ({
            chatHistory: [
              ...slot.chatHistory,
              {
                id: genId(),
                role: 'tool_result' as const,
                toolName,
                result,
                success,
                path,
                before,
                timestamp: Date.now(),
              },
            ],
          })),
        ),

      toggleToolUndo: (id, after) =>
        set((s) =>
          updateActive(s, (slot) => ({
            chatHistory: slot.chatHistory.map((m) => {
              if (m.id !== id || m.role !== 'tool_result') return m;
              if (m.undone) return { ...m, undone: false };
              return { ...m, after, undone: true };
            }),
          })),
        ),

      removeLastMessage: () =>
        set((s) =>
          updateActive(s, (slot) => ({
            chatHistory: slot.chatHistory.slice(0, -1),
          })),
        ),

      removeToolResult: (id) =>
        set((s) =>
          updateActive(s, (slot) => ({
            chatHistory: slot.chatHistory.filter((m) => m.id !== id),
          })),
        ),

      clearMessages: () =>
        set((s) =>
          updateActive(s, () => ({
            chatHistory: [],
          })),
        ),

      // ── Slot management ──

      saveSlot: (name, resume, themeId, customization, chatHistory) => {
        const id = genId();
        set((s) => ({
          slots: [
            ...s.slots,
            {
              id,
              name,
              resume: resume ?? { basics: { name: '', label: '', summary: '' } },
              themeId: themeId ?? 'modern',
              customization: customization ?? { ...defaultCustomization },
              chatHistory: chatHistory ?? [],
              updatedAt: Date.now(),
            },
          ],
          activeSlotId: id,
        }));
        return id;
      },

      duplicateSlot: () => {
        const slot = activeSlot(get());
        if (!slot.id) return;
        const id = genId();
        set((s) => ({
          slots: [
            ...s.slots,
            {
              ...structuredClone(slot),
              id,
              name: '',
              updatedAt: Date.now(),
            },
          ],
          activeSlotId: id,
        }));
      },

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

      updateSlotChatHistory: (id, chatHistory) =>
        set((s) => ({
          slots: s.slots.map((slot) =>
            slot.id === id ? { ...slot, chatHistory, updatedAt: Date.now() } : slot,
          ),
        })),
    }),
    {
      name: 'resume-slots',
      storage: createJSONStorage(() => debouncedStorage),
    },
  ),
);
