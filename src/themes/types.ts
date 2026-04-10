import type { ResumeSchema } from '../types/resume';

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  render: (resume: ResumeSchema) => string;
}
