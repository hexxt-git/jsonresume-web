import { useState } from 'react';
import type { CombinedAnalysis, AuditCategory } from './types';
import { scoreTextCls, scoreBgCls } from './types';

/* ── Small pieces ───────────────────────────────────────── */

const severityDotCls = (s: string) =>
  s === 'high' ? 'bg-diff-rm' : s === 'medium' ? 'bg-accent' : 'bg-text-muted';

function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3 bg-bg-secondary/30 p-2 pr-5 rounded-2xl border border-border/50">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold shrink-0 text-bg shadow-md ${scoreBgCls(score)}`}
      >
        {score}
      </div>
      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-tight">
        {label}
      </span>
    </div>
  );
}

function AuditCategoryRow({ category }: { category: AuditCategory }) {
  const [open, setOpen] = useState(false);
  if (!category.issues.length) return null;

  const highCount = category.issues.filter((i) => i.severity === 'high').length;

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-bg-secondary/10 transition-all shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-bg-hover transition-all"
      >
        <span className="text-xs font-bold text-text tracking-tight">{category.label}</span>
        <div className="flex items-center gap-3">
          {highCount > 0 && (
            <span className="text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
              {highCount} CRITICAL
            </span>
          )}
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            {category.issues.length} {category.issues.length !== 1 ? 'ISSUES' : 'ISSUE'}
          </span>
          <span className={`text-sm font-bold w-8 text-right ${scoreTextCls(category.score)}`}>
            {category.score}
          </span>
          <span
            className="text-text-muted transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          >
            &#9662;
          </span>
        </div>
      </button>
      {open && (
        <div className="divide-y divide-border/50 bg-bg px-2 pb-2">
          {category.issues.map((issue) => (
            <div
              key={issue.id}
              className="px-4 py-3 flex items-start gap-3 rounded-xl hover:bg-bg-secondary/50 transition-colors"
            >
              <span
                className={`shrink-0 w-2 h-2 rounded-full mt-1.5 shadow-sm ${severityDotCls(issue.severity)}`}
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-text-secondary">{issue.description}</span>
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                  {issue.suggestion}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main view ──────────────────────────────────────────── */

interface Props {
  analysis: CombinedAnalysis;
  onEditJd: () => void;
}

export function AnalyzeView({ analysis, onEditJd }: Props) {
  const { match, audit } = analysis;

  return (
    <div className="space-y-8 bg-bg p-4">
      {/* Scores */}
      <div className="flex items-center gap-6 flex-wrap">
        <ScoreBadge label="Job Match" score={match.overallScore} />
        <ScoreBadge label="ATS Score" score={audit.overallScore} />
        <div className="flex-1" />
        <button
          onClick={onEditJd}
          className="text-[10px] font-bold text-text-muted hover:text-accent cursor-pointer uppercase tracking-widest px-4 py-2 rounded-full border border-border transition-all"
        >
          Edit JD
        </button>
      </div>

      {/* Keywords */}
      <div className="border border-border rounded-2xl overflow-hidden bg-bg shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 bg-bg-secondary/30 border-b border-border/50">
          <span className="text-xs font-bold text-text uppercase tracking-widest">Keywords</span>
          <span className="text-[10px] font-bold text-text-muted space-x-3 uppercase tracking-tighter">
            <span className="text-diff-add bg-diff-add-line px-2 py-0.5 rounded-full border border-diff-add-word">
              {match.matchingKeywords.length} MATCH
            </span>
            <span className="text-diff-rm bg-diff-rm-line px-2 py-0.5 rounded-full border border-diff-rm-word">
              {match.missingKeywords.length} MISSING
            </span>
          </span>
        </div>
        <div className="px-6 py-5 space-y-4">
          {match.matchingKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {match.matchingKeywords.map((k) => (
                <span
                  key={k}
                  className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-tight diff-word-add shadow-sm border border-diff-add-word/30"
                >
                  {k}
                </span>
              ))}
            </div>
          )}
          {match.missingKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {match.missingKeywords.map((k) => (
                <span
                  key={k}
                  className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-tight diff-word-rm shadow-sm border border-diff-rm-word/30"
                >
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section scores */}
      <div className="border border-border rounded-2xl overflow-hidden bg-bg shadow-sm">
        <div className="px-6 py-4 bg-bg-secondary/30 text-xs font-bold text-text uppercase tracking-widest border-b border-border/50">
          Sections
        </div>
        <div className="divide-y divide-border/50">
          {Object.entries(match.sections).map(([key, val]) => (
            <div
              key={key}
              className="flex items-center gap-4 px-6 py-3.5 hover:bg-bg-secondary/20 transition-colors"
            >
              <span className="text-xs font-bold text-text-secondary capitalize w-24 shrink-0">
                {key}
              </span>
              <span className="text-[11px] text-text-muted flex-1 truncate font-medium italic">
                {val.analysis}
              </span>
              <span
                className={`text-sm font-black shrink-0 w-8 text-right ${scoreTextCls(val.score)}`}
              >
                {val.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ATS Issues */}
      {audit.categories.some((c) => c.issues.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-text uppercase tracking-widest">
              ATS Issues
            </span>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-bg-secondary px-3 py-1 rounded-full">
              {audit.categories.reduce((n, c) => n + c.issues.length, 0)} TOTAL
            </span>
          </div>
          <div className="space-y-3">
            {audit.categories.map((cat) => (
              <AuditCategoryRow key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {match.recommendations.length > 0 && (
        <div className="border border-border rounded-2xl overflow-hidden bg-bg shadow-sm">
          <div className="px-6 py-4 bg-bg-secondary/30 text-xs font-bold text-text uppercase tracking-widest border-b border-border/50">
            Recommendations
          </div>
          <div className="px-6 py-5 space-y-3 bg-accent/5">
            {match.recommendations.map((r, i) => (
              <div
                key={i}
                className="flex gap-4 text-xs text-text-secondary font-medium leading-relaxed"
              >
                <span className="text-accent shrink-0 text-lg leading-none">&bull;</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
