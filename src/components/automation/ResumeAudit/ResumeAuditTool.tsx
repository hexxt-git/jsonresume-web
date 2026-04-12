import { useState } from 'react';
import { ToolShell } from '../shared/ToolShell';
import { useAiStream } from '../shared/useAiStream';
import { useResumeStore, activeSlot } from '../../../store/resumeStore';
import { captureBeforeDiscreteMutation } from '../../../hooks/useUndoRedo';
import type { ResumeSchema } from '../../../types/resume';
import { getPromptDirectives, getAuditDirective } from '../../../store/automationStore';
import type { AuditData, AuditIssue, FixProposal } from './types';
import { AuditIdleState } from './AuditIdleState';
import { AutomationSettings } from '../shared/AutomationSettings';
import { AuditSpinner } from './AuditSpinner';
import { AuditScoreHeader } from './AuditScoreHeader';
import { AuditCategoryCard } from './AuditCategoryCard';

/* ── Prompts ──────────────────────────────────────────────── */

type Phase = 'idle' | 'auditing' | 'results';

const CURRENT_DATE = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const AUDIT_PROMPT = `You are an ATS expert and resume reviewer. Today is ${CURRENT_DATE} (${new Date().getFullYear()}). Analyze this resume for ATS compatibility and quality.
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

/* ── Component ────────────────────────────────────────────── */

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
        AUDIT_PROMPT +
          getAuditDirective() +
          getPromptDirectives() +
          `\n\nResume:\n\`\`\`json\n${getResumeContext()}\n\`\`\``,
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

  const handleFixAll = async () => {
    if (!audit) return;
    const fixableIssues = audit.categories
      .flatMap((c) => c.issues)
      .filter((i) => i.fixable && !fixedIds.has(i.id) && !fixProposals[i.id]);
    for (const issue of fixableIssues) {
      if (abortRef.current) break;
      await handleFix(issue);
    }
  };

  const handleAcceptAll = () => {
    captureBeforeDiscreteMutation();
    const store = useResumeStore.getState();
    for (const fix of Object.values(fixProposals)) {
      if (fix.sectionKey === 'basics.summary') store.updateBasics('summary', fix.afterValue);
      else if (fix.sectionKey.startsWith('basics.'))
        store.updateBasics(fix.sectionKey.split('.')[1], fix.afterValue);
      else store.updateArraySection(fix.sectionKey as keyof ResumeSchema, fix.afterValue as any);
      setFixedIds((s) => {
        const next = new Set(s);
        next.add(fix.issueId);
        return next;
      });
    }
    setFixProposals({});
  };

  const abortRef = { current: false };

  return (
    <ToolShell title="General ATS Audit" onBack={onBack} headerExtra={<AutomationSettings />}>
      <div className="p-4 space-y-4">
        {error && (
          <div className="text-xs text-danger bg-danger/10 rounded-md px-3 py-2">{error}</div>
        )}

        {phase === 'idle' && <AuditIdleState onStart={handleAudit} />}
        {phase === 'auditing' && <AuditSpinner onCancel={abort} />}

        {phase === 'results' && audit && (
          <>
            <AuditScoreHeader
              audit={audit}
              isRunning={isRunning}
              fixableRemaining={
                audit.categories
                  .flatMap((c) => c.issues)
                  .filter((i) => i.fixable && !fixedIds.has(i.id) && !fixProposals[i.id]).length
              }
              pendingFixes={Object.keys(fixProposals).length}
              onRerun={handleAudit}
              onFixAll={handleFixAll}
              onAcceptAll={handleAcceptAll}
            />
            {audit.categories.map((cat) => (
              <AuditCategoryCard
                key={cat.id}
                category={cat}
                fixProposals={fixProposals}
                fixedIds={fixedIds}
                expandedIssue={expandedIssue}
                fixingId={fixingId}
                isRunning={isRunning}
                onToggleExpand={(id) => setExpandedIssue(expandedIssue === id ? null : id)}
                onFix={handleFix}
                onAccept={acceptFix}
                onReject={rejectFix}
              />
            ))}
          </>
        )}
      </div>
    </ToolShell>
  );
}
