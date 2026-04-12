import { useState } from 'react';
import type { CombinedAnalysis, AuditCategory } from './types';
import { scoreTextCls, scoreBgCls } from './types';

/* ── Small pieces ───────────────────────────────────────── */

const severityDotCls = (s: string) =>
  s === 'high' ? 'bg-diff-rm' : s === 'medium' ? 'bg-accent' : 'bg-text-muted';

function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 text-bg ${scoreBgCls(score)}`}
      >
        {score}
      </div>
      <span className="text-xs font-medium text-text">{label}</span>
    </div>
  );
}

function AuditCategoryRow({ category }: { category: AuditCategory }) {
  const [open, setOpen] = useState(false);
  if (!category.issues.length) return null;

  const highCount = category.issues.filter((i) => i.severity === 'high').length;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-bg-secondary cursor-pointer hover:bg-bg-hover transition-colors"
      >
        <span className="text-xs font-medium text-text">{category.label}</span>
        <div className="flex items-center gap-2">
          {highCount > 0 && <span className="text-[10px] text-diff-rm">{highCount} critical</span>}
          <span className="text-[10px] text-text-muted">
            {category.issues.length} issue{category.issues.length !== 1 ? 's' : ''}
          </span>
          <span className={`text-xs font-medium ${scoreTextCls(category.score)}`}>
            {category.score}
          </span>
          <span className="text-[10px] text-text-faint">{open ? '\u25B4' : '\u25BE'}</span>
        </div>
      </button>
      {open && (
        <div className="divide-y divide-border">
          {category.issues.map((issue) => (
            <div key={issue.id} className="px-3 py-2 flex items-start gap-2">
              <span
                className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${severityDotCls(issue.severity)}`}
              />
              <div className="min-w-0">
                <span className="text-xs text-text-secondary">{issue.description}</span>
                <p className="text-[10px] text-text-muted mt-0.5">{issue.suggestion}</p>
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
    <div className="space-y-4">
      {/* Scores */}
      <div className="flex items-center gap-4 flex-wrap">
        <ScoreBadge label="Job Match" score={match.overallScore} />
        <ScoreBadge label="ATS Score" score={audit.overallScore} />
        <div className="flex-1" />
        <button
          onClick={onEditJd}
          className="text-[10px] text-text-muted hover:text-text-secondary cursor-pointer"
        >
          Edit JD
        </button>
      </div>

      {/* Keywords */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-bg-secondary">
          <span className="text-xs font-medium text-text">Keywords</span>
          <span className="text-[10px] text-text-muted">
            <span className="text-diff-add">{match.matchingKeywords.length} match</span>
            {' \u00B7 '}
            <span className="text-diff-rm">{match.missingKeywords.length} missing</span>
          </span>
        </div>
        <div className="px-3 py-2 space-y-2">
          {match.matchingKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {match.matchingKeywords.map((k) => (
                <span key={k} className="text-[10px] px-2 py-0.5 rounded diff-word-add">
                  {k}
                </span>
              ))}
            </div>
          )}
          {match.missingKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {match.missingKeywords.map((k) => (
                <span key={k} className="text-[10px] px-2 py-0.5 rounded diff-word-rm">
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section scores */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-bg-secondary text-xs font-medium text-text">Sections</div>
        <div className="divide-y divide-border">
          {Object.entries(match.sections).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 px-3 py-1.5">
              <span className="text-xs text-text-secondary capitalize flex-1">{key}</span>
              <span className="text-[10px] text-text-muted flex-1 truncate">{val.analysis}</span>
              <span className={`text-xs font-medium shrink-0 ${scoreTextCls(val.score)}`}>
                {val.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ATS Issues */}
      {audit.categories.some((c) => c.issues.length > 0) && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text">ATS Issues</span>
            <span className="text-[10px] text-text-muted">
              {audit.categories.reduce((n, c) => n + c.issues.length, 0)} total
            </span>
          </div>
          {audit.categories.map((cat) => (
            <AuditCategoryRow key={cat.id} category={cat} />
          ))}
        </>
      )}

      {/* Recommendations */}
      {match.recommendations.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-bg-secondary text-xs font-medium text-text">
            Recommendations
          </div>
          <div className="px-3 py-2 space-y-1">
            {match.recommendations.map((r, i) => (
              <div key={i} className="flex gap-2 text-xs text-text-secondary">
                <span className="text-accent shrink-0">&bull;</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
