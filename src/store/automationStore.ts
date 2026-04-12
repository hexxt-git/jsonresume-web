import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ── Types ────────────────────────────────────────────────── */

export type Tone = 'formal' | 'professional' | 'casual';
export type Creativity = 'conservative' | 'balanced' | 'creative';
export type CoverLetterLength = 'brief' | 'standard' | 'detailed';
export type AuditStrictness = 'lenient' | 'standard' | 'strict';

export const ALL_SECTIONS = [
  'basics',
  'work',
  'education',
  'skills',
  'projects',
  'languages',
  'volunteer',
  'awards',
  'certificates',
  'publications',
  'interests',
  'references',
] as const;

export const SECTION_DISPLAY: Record<string, string> = {
  basics: 'Summary',
  work: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  languages: 'Languages',
  volunteer: 'Volunteer',
  awards: 'Awards',
  certificates: 'Certificates',
  publications: 'Publications',
  interests: 'Interests',
  references: 'References',
};

/* ── Store ────────────────────────────────────────────────── */

interface AutomationStore {
  tone: Tone;
  creativity: Creativity;
  language: string;
  coverLetterLength: CoverLetterLength;
  sectionsToTailor: string[];
  auditStrictness: AuditStrictness;

  setTone: (v: Tone) => void;
  setCreativity: (v: Creativity) => void;
  setLanguage: (v: string) => void;
  setCoverLetterLength: (v: CoverLetterLength) => void;
  toggleSection: (s: string) => void;
  setAuditStrictness: (v: AuditStrictness) => void;
  reset: () => void;
}

const DEFAULTS = {
  tone: 'professional' as Tone,
  creativity: 'balanced' as Creativity,
  language: 'English',
  coverLetterLength: 'standard' as CoverLetterLength,
  sectionsToTailor: [...ALL_SECTIONS] as string[],
  auditStrictness: 'standard' as AuditStrictness,
};

export const useAutomationStore = create<AutomationStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setTone: (tone) => set({ tone }),
      setCreativity: (creativity) => set({ creativity }),
      setLanguage: (language) => set({ language }),
      setCoverLetterLength: (coverLetterLength) => set({ coverLetterLength }),
      toggleSection: (s) =>
        set((state) => ({
          sectionsToTailor: state.sectionsToTailor.includes(s)
            ? state.sectionsToTailor.filter((x) => x !== s)
            : [...state.sectionsToTailor, s],
        })),
      setAuditStrictness: (auditStrictness) => set({ auditStrictness }),
      reset: () => set(DEFAULTS),
    }),
    { name: 'automation-settings' },
  ),
);

/* ── Prompt helpers ───────────────────────────────────────── */

/** Core directives (tone, creativity, language) — append to any system prompt. */
export function getPromptDirectives(): string {
  const { tone, creativity, language } = useAutomationStore.getState();
  const parts: string[] = [
    'CRITICAL: Never use placeholder text like [Company Name], [Your Name], [Position Title], [Hiring Manager], etc. If a detail is not provided in the job description or resume, use pronouns (your company, the team, this role) or omit the reference entirely. The output must be ready to send as-is with zero manual editing of placeholders.',
  ];

  if (tone === 'formal') parts.push('Use formal, business-appropriate language.');
  else if (tone === 'casual')
    parts.push('Use a friendly, conversational tone while remaining professional.');

  if (creativity === 'conservative')
    parts.push(
      'Make minimal, targeted changes. Preserve the original structure and wording as much as possible.',
    );
  else if (creativity === 'creative')
    parts.push('Suggest creative rewording and bold improvements where appropriate.');

  if (language !== 'English') parts.push(`Write all output in ${language}.`);

  return '\n' + parts.join(' ');
}

/** Section filter directive for tailoring tools. */
export function getSectionDirective(): string {
  const { sectionsToTailor } = useAutomationStore.getState();
  if (sectionsToTailor.length >= ALL_SECTIONS.length) return '';
  if (sectionsToTailor.length === 0) return '\nDo not modify any sections.';
  return `\nOnly modify these sections: ${sectionsToTailor.join(', ')}. Leave all other sections unchanged.`;
}

/** Cover letter length guide. */
export function getCoverLetterDirective(): string {
  const { coverLetterLength } = useAutomationStore.getState();
  if (coverLetterLength === 'brief') return '\nKeep the cover letter concise, around 150 words.';
  if (coverLetterLength === 'detailed') return '\nWrite a thorough cover letter, around 400 words.';
  return '\nAim for around 250 words.';
}

/** Audit strictness directive. */
export function getAuditDirective(): string {
  const { auditStrictness } = useAutomationStore.getState();
  if (auditStrictness === 'lenient')
    return '\nBe lenient — only flag significant issues that clearly impact ATS performance.';
  if (auditStrictness === 'strict')
    return '\nBe very strict — flag even minor issues and stylistic weaknesses.';
  return '';
}
