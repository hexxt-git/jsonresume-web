import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ResumeSchema } from '../types/resume';
import { sampleResume } from '../utils/sample';
import { defaultCustomization, type ThemeCustomization } from './themeCustomStore';

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

interface ResumeStore {
  resume: ResumeSchema;
  selectedThemeId: string;
  activeSection: EditorSection;
  customization: ThemeCustomization;

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
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      resume: { basics: { name: '', label: '', summary: '' } },
      selectedThemeId: 'modern',
      activeSection: 'basics',
      customization: { ...defaultCustomization },

      setResume: (resume) => set({ resume }),

      updateBasics: (field, value) =>
        set((state) => ({
          resume: {
            ...state.resume,
            basics: { ...state.resume.basics, [field]: value },
          },
        })),

      updateBasicsLocation: (field, value) =>
        set((state) => ({
          resume: {
            ...state.resume,
            basics: {
              ...state.resume.basics,
              location: { ...state.resume.basics?.location, [field]: value },
            },
          },
        })),

      updateArraySection: (section, items) =>
        set((state) => ({
          resume: { ...state.resume, [section]: items },
        })),

      setTheme: (themeId) => set({ selectedThemeId: themeId }),
      setActiveSection: (section) => set({ activeSection: section }),
      setCustomization: (field, value) =>
        set((s) => ({
          customization: { ...s.customization, [field]: value },
        })),
      setFullCustomization: (c) => set({ customization: c }),
      resetCustomization: () => set({ customization: { ...defaultCustomization } }),
      loadSample: () => set({ resume: sampleResume }),
      reset: () =>
        set({
          resume: { basics: { name: '', label: '', summary: '' } },
          selectedThemeId: 'modern',
          activeSection: 'basics',
          customization: { ...defaultCustomization },
        }),
    }),
    {
      name: 'resume-store',
    },
  ),
);
