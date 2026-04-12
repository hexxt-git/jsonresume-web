export interface AnalysisData {
  relevant: boolean;
  relevanceReason?: string;
  overallMatchScore: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  sections: Record<string, { score: number; analysis: string }>;
  recommendations: string[];
}

export const scoreColor = (s: number) =>
  s >= 75 ? 'var(--diff-add-text)' : s >= 50 ? 'var(--accent)' : 'var(--diff-rm-text)';

export const SECTION_LABELS: Record<string, string> = {
  work: 'Work Experience',
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
