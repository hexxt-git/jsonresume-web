import { createContext, useContext } from 'react';
import { useResumeStore, activeSlot } from '../../store/resumeStore';

/**
 * Provides AI writing tools with context about what's being edited.
 * Built automatically from activeSection + entry context — no manual prop drilling.
 */

const AiEntryContext = createContext<string>('');

/** Wrap a repeatable item to give AI context about which entry is being edited. */
export function AiEntryProvider({ label, children }: { label: string; children: React.ReactNode }) {
  return <AiEntryContext.Provider value={label}>{children}</AiEntryContext.Provider>;
}

/** Section name map — activeSection → human-readable name */
const SECTION_NAMES: Record<string, string> = {
  basics: 'Basic Information',
  work: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  languages: 'Languages',
  volunteer: 'Volunteer Experience',
  awards: 'Awards',
  certificates: 'Certificates',
  publications: 'Publications',
  interests: 'Interests',
  references: 'References',
};

/**
 * Build AI context string automatically.
 * Combines: section name + entry label (from RepeatableSection) + field label.
 */
export function useAiContext(fieldLabel: string): string {
  const section = useResumeStore((s) => s.activeSection);
  const entry = useContext(AiEntryContext);
  const basics = activeSlot(useResumeStore.getState()).resume.basics;

  const parts: string[] = [];
  if (basics?.name || basics?.label) {
    parts.push(`Resume of ${[basics.name, basics.label].filter(Boolean).join(', ')}`);
  }
  const sectionName = SECTION_NAMES[section] || section;
  if (entry) {
    parts.push(`${sectionName} > ${entry} > ${fieldLabel}`);
  } else {
    parts.push(`${sectionName} > ${fieldLabel}`);
  }
  return parts.join('. ');
}
