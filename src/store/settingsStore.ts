import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '../i18n';

export type ColorMode = 'light' | 'dark' | 'system';
export type EditorTab = 'form' | 'json' | 'themes' | 'ai' | 'auto';

interface SettingsStore {
  colorMode: ColorMode;
  locale: Locale;
  splitPct: number;
  sidebarPct: number;
  hasSeenOnboarding: boolean;
  editorTab: EditorTab;

  setColorMode: (mode: ColorMode) => void;
  setLocale: (locale: Locale) => void;
  setSplitPct: (pct: number) => void;
  setSidebarPct: (pct: number) => void;
  setHasSeenOnboarding: (v: boolean) => void;
  setEditorTab: (tab: EditorTab) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      colorMode: 'system',
      locale: 'en',
      splitPct: 42,
      sidebarPct: 20,
      hasSeenOnboarding: false,
      editorTab: 'form',

      setColorMode: (colorMode) => set({ colorMode }),
      setLocale: (locale) => set({ locale }),
      setSplitPct: (splitPct) => set({ splitPct }),
      setSidebarPct: (sidebarPct) => set({ sidebarPct }),
      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
      setEditorTab: (editorTab) => set({ editorTab }),
    }),
    { name: 'settings' },
  ),
);

export function applyColorMode(mode: ColorMode) {
  const isDark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}
