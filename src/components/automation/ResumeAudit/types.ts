export interface AuditIssue {
  id: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  fixable: boolean;
  section: string;
}

export interface AuditCategory {
  id: string;
  label: string;
  score: number;
  issues: AuditIssue[];
}

export interface AuditData {
  overallScore: number;
  categories: AuditCategory[];
}

export interface FixProposal {
  issueId: string;
  sectionKey: string;
  beforeValue: unknown;
  afterValue: unknown;
}

export const scoreColor = (s: number) =>
  s >= 75 ? 'var(--diff-add-text)' : s >= 50 ? 'var(--accent)' : 'var(--diff-rm-text)';
