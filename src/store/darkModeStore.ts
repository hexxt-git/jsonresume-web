import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Mode = 'light' | 'dark' | 'system';

interface DarkModeStore {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export const useDarkModeStore = create<DarkModeStore>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'dark-mode' },
  ),
);

/** Call this in a useEffect to sync the `dark` class on <html> */
export function applyDarkMode(mode: Mode) {
  const isDark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}
