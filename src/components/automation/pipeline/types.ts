export interface MatchData {
  overallScore: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  sections: Record<string, { score: number; analysis: string }>;
  recommendations: string[];
}

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

export interface CombinedAnalysis {
  relevant: boolean;
  relevanceReason?: string;
  match: MatchData;
  audit: {
    overallScore: number;
    categories: AuditCategory[];
  };
}

/** Text colour class for a 0-100 score. */
export const scoreTextCls = (s: number) =>
  s >= 75 ? 'text-diff-add' : s >= 50 ? 'text-accent' : 'text-diff-rm';

/** Background colour class for a 0-100 score badge. */
export const scoreBgCls = (s: number) =>
  s >= 75 ? 'bg-diff-add' : s >= 50 ? 'bg-accent' : 'bg-diff-rm';
