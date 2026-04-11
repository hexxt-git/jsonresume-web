import { useState } from 'react';
import { ToolShell } from '../shared/ToolShell';
import { useAiStream } from '../shared/useAiStream';
import { BlockDiffView } from '../../editor/DiffView';
import { useResumeStore, activeSlot } from '../../../store/resumeStore';
import { captureBeforeDiscreteMutation } from '../../../hooks/useUndoRedo';
import { TickCircle, CloseCircle } from 'iconsax-react';
import type { ResumeSchema } from '../../../types/resume';
import { ArrowRight } from 'lucide-react';

interface AuditIssue {
  id: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  fixable: boolean;
  section: string;
}

interface AuditCategory {
  id: string;
  label: string;
  score: number;
  issues: AuditIssue[];
}

interface AuditData {
  overallScore: number;
  categories: AuditCategory[];
}

interface FixProposal {
  issueId: string;
  sectionKey: string;
  beforeValue: unknown;
  afterValue: unknown;
}

type Phase = 'idle' | 'auditing' | 'results';

const AUDIT_PROMPT = `You are an ATS expert and resume reviewer. Analyze this resume for ATS compatibility and quality.
Return ONLY valid JSON (no markdown fences) with this structure:
{
  "overallScore": <number 0-100>,
  "categories": [
    { "id": "keywords", "label": "Keyword Optimization", "score": <number>, "issues": [{ "id": "kw-1", "severity": "high|medium|low", "description": "...", "suggestion": "...", "fixable": true, "section": "skills" }] },
    { "id": "action-verbs", "label": "Action Verbs & Impact", "score": <number>, "issues": [...] },
    { "id": "quantification", "label": "Quantified Achievements", "score": <number>, "issues": [...] },
    { "id": "formatting", "label": "ATS Formatting", "score": <number>, "issues": [...] },
    { "id": "completeness", "label": "Section Completeness", "score": <number>, "issues": [...] }
  ]
}
Keep descriptions under 15 words. Keep suggestions under 20 words. Be specific.`;

export default function ResumeAuditTool({ onBack }: { onBack: () => void }) {
  const { run, runWithTools, isRunning, error, setError, abort, getResumeContext } = useAiStream();
  const [phase, setPhase] = useState<Phase>('idle');
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [fixProposals, setFixProposals] = useState<Record<string, FixProposal>>({});
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set());
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const handleAudit = async () => {
    setPhase('auditing');
    setError(null);
    setFixProposals({});
    setFixedIds(new Set());
    try {
      const result = await run(
        AUDIT_PROMPT + `\n\nResume:\n\`\`\`json\n${getResumeContext()}\n\`\`\``,
        'Audit this resume.',
      );
      const cleaned = result.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
      setAudit(JSON.parse(cleaned) as AuditData);
      setPhase('results');
    } catch {
      setError('Failed to audit. Try again.');
      setPhase('idle');
    }
  };

  const handleFix = async (issue: AuditIssue) => {
    setFixingId(issue.id);
    setExpandedIssue(issue.id);
    setError(null);
    try {
      const resume = activeSlot(useResumeStore.getState()).resume;
      const { toolCalls } = await runWithTools(
        `Fix ONLY this issue: "${issue.description}". Suggestion: "${issue.suggestion}". Only modify ${issue.section}.\n\nResume:\n\`\`\`json\n${getResumeContext()}\n\`\`\``,
        `Fix this issue in ${issue.section}.`,
        { execute: false },
      );

      for (const { call } of toolCalls) {
        let sectionKey = issue.section;
        let beforeValue: unknown = resume[issue.section as keyof ResumeSchema] || [];
        let afterValue: unknown = null;

        if (call.name === 'update_summary') {
          sectionKey = 'basics.summary';
          beforeValue = resume.basics?.summary || '';
          afterValue = call.args.summary;
        } else if (call.name === 'replace_section') {
          sectionKey = call.args.section as string;
          beforeValue = resume[sectionKey as keyof ResumeSchema] || [];
          afterValue = call.args.data;
        } else if (call.name === 'update_basics_field') {
          const f = call.args.field as string;
          sectionKey = `basics.${f}`;
          beforeValue = (resume.basics as any)?.[f] || '';
          afterValue = call.args.value;
        }

        if (afterValue != null) {
          setFixProposals((p) => ({
            ...p,
            [issue.id]: { issueId: issue.id, sectionKey, beforeValue, afterValue },
          }));
        }
      }
    } catch {
      setError('Failed to generate fix.');
    } finally {
      setFixingId(null);
    }
  };

  const acceptFix = (issueId: string) => {
    const fix = fixProposals[issueId];
    if (!fix) return;
    captureBeforeDiscreteMutation();
    const store = useResumeStore.getState();
    if (fix.sectionKey === 'basics.summary') store.updateBasics('summary', fix.afterValue);
    else if (fix.sectionKey.startsWith('basics.'))
      store.updateBasics(fix.sectionKey.split('.')[1], fix.afterValue);
    else store.updateArraySection(fix.sectionKey as keyof ResumeSchema, fix.afterValue as any);
    setFixedIds((s) => new Set(s).add(issueId));
    setFixProposals((p) => {
      const next = { ...p };
      delete next[issueId];
      return next;
    });
  };

  const rejectFix = (issueId: string) => {
    setFixProposals((p) => {
      const next = { ...p };
      delete next[issueId];
      return next;
    });
  };

  const scoreColor = (s: number) =>
    s >= 75 ? 'var(--diff-add-text)' : s >= 50 ? 'var(--accent)' : 'var(--diff-rm-text)';

  const stringify = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v, null, 2));

  const totalIssues = audit?.categories.reduce((n, c) => n + c.issues.length, 0) || 0;
  const highCount =
    audit?.categories.reduce(
      (n, c) => n + c.issues.filter((i) => i.severity === 'high').length,
      0,
    ) || 0;

  return (
    <ToolShell title="General ATS Audit" onBack={onBack}>
      <div className="p-4 space-y-4">
        {error && (
          <div className="text-xs text-danger bg-danger/10 rounded-md px-3 py-2">{error}</div>
        )}

        {phase === 'idle' && (
          <div className="py-8 space-y-3 text-center">
            <p className="text-xs text-text-secondary">
              Scan for ATS issues, weak verbs, missing keywords, and more.
            </p>
            <button
              onClick={handleAudit}
              className="text-xs px-6 py-2 bg-accent text-white rounded-lg hover:opacity-90 cursor-pointer"
            >
              Run Audit
            </button>
          </div>
        )}

        {phase === 'auditing' && (
          <div className="text-center py-8">
            <div className="inline-block w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs text-text-muted">Analyzing...</p>
            <button
              onClick={abort}
              className="text-[10px] text-text-muted hover:text-danger cursor-pointer mt-1"
            >
              Cancel
            </button>
          </div>
        )}

        {phase === 'results' && audit && (
          <>
            {/* Score + summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: scoreColor(audit.overallScore), color: 'var(--bg)' }}
                >
                  {audit.overallScore}
                </div>
                <div>
                  <div className="text-xs font-medium text-text">
                    {totalIssues} issue{totalIssues !== 1 ? 's' : ''} found
                  </div>
                  {highCount > 0 && (
                    <div className="text-[10px]" style={{ color: 'var(--diff-rm-text)' }}>
                      {highCount} high priority
                    </div>
                  )}
                  <div className="text-[11px] font-medium text-text-muted">
                    use auto fix to fix issues{' '}
                    <ArrowRight size={12} color="currentColor" className="inline-block" />
                  </div>
                </div>
              </div>
              <button
                onClick={handleAudit}
                disabled={isRunning}
                className="text-xs px-3 py-1.5 border border-border rounded-md text-text-secondary hover:bg-bg-hover cursor-pointer disabled:opacity-50"
              >
                Audit Again
              </button>
            </div>

            {/* Category cards */}
            {audit.categories.map((cat) => {
              if (!cat.issues.length) return null;
              return (
                <div key={cat.id} className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-bg-secondary">
                    <span className="text-xs font-medium text-text">{cat.label}</span>
                    <span className="text-xs font-medium" style={{ color: scoreColor(cat.score) }}>
                      {cat.score}
                    </span>
                  </div>

                  <div className="divide-y divide-border">
                    {cat.issues.map((issue) => {
                      const fix = fixProposals[issue.id];
                      const isFixed = fixedIds.has(issue.id);
                      const isExpanded = expandedIssue === issue.id;

                      return (
                        <div key={issue.id} className="px-3 py-2">
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                          >
                            <span
                              className="shrink-0 w-1.5 h-1.5 rounded-full"
                              style={{
                                background:
                                  issue.severity === 'high'
                                    ? 'var(--diff-rm-text)'
                                    : issue.severity === 'medium'
                                      ? 'var(--accent)'
                                      : 'var(--text-muted)',
                              }}
                            />
                            <span
                              className={`flex-1 text-xs ${isFixed ? 'text-text-muted line-through' : 'text-text-secondary'}`}
                            >
                              {issue.description}
                            </span>
                            {!isFixed && !fix && (
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedIssue(isExpanded ? null : issue.id);
                                  }}
                                  className="text-[10px] px-2 py-0.5 rounded bg-bg-tertiary text-text-muted hover:text-text-secondary cursor-pointer"
                                >
                                  {isExpanded ? 'Hide' : 'Details'}
                                </button>
                                {issue.fixable && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFix(issue);
                                    }}
                                    disabled={isRunning}
                                    className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer disabled:opacity-50"
                                  >
                                    {fixingId === issue.id ? '...' : 'Fix'}
                                  </button>
                                )}
                              </div>
                            )}
                            {isFixed && (
                              <span
                                className="shrink-0 text-[10px]"
                                style={{ color: 'var(--diff-add-text)' }}
                              >
                                Fixed
                              </span>
                            )}
                          </div>

                          {/* Expanded: suggestion + fix diff */}
                          {isExpanded && !fix && !isFixed && (
                            <p className="text-[10px] text-text-muted mt-1 ml-3.5">
                              {issue.suggestion}
                            </p>
                          )}

                          {fix && (
                            <div className="mt-2 space-y-1.5">
                              <BlockDiffView
                                oldText={stringify(fix.beforeValue)}
                                newText={stringify(fix.afterValue)}
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => rejectFix(issue.id)}
                                  className="flex items-center gap-1 text-[10px] text-text-muted hover:text-danger cursor-pointer"
                                >
                                  <CloseCircle size={12} variant="Bold" color="currentColor" />{' '}
                                  Reject
                                </button>
                                <button
                                  onClick={() => acceptFix(issue.id)}
                                  className="flex items-center gap-1 text-[10px] text-accent hover:opacity-80 cursor-pointer"
                                >
                                  <TickCircle size={12} variant="Bold" color="currentColor" />{' '}
                                  Accept
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </ToolShell>
  );
}
