import type { ResumeSchema } from '../../../types/resume';

export interface BatchJob {
  id: string;
  jdText: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  result?: { jobTitle: string; tailoredResume: ResumeSchema };
  coverLetter?: string;
  error?: string;
}

export const SECTION_LABELS: Record<string, string> = {
  basics: 'Summary',
  work: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  languages: 'Languages',
  volunteer: 'Volunteer',
  awards: 'Awards',
  certificates: 'Certs',
  publications: 'Publications',
  interests: 'Interests',
  references: 'References',
};
