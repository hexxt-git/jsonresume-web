import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '../i18n';

export type ColorMode = 'light' | 'dark' | 'system';

interface SettingsStore {
  colorMode: ColorMode;
  locale: Locale;
  splitPct: number;

  setColorMode: (mode: ColorMode) => void;
  setLocale: (locale: Locale) => void;
  setSplitPct: (pct: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      colorMode: 'system',
      locale: 'en',
      splitPct: 42.86,

      setColorMode: (colorMode) => set({ colorMode }),
      setLocale: (locale) => set({ locale }),
      setSplitPct: (splitPct) => set({ splitPct }),
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
