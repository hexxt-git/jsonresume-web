import { useState } from 'react';
import type { CombinedAnalysis, AuditCategory } from './types';
import { scoreTextCls, scoreBgCls } from './types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

/* ── Small pieces ───────────────────────────────────────── */

const severityDotCls = (s: string) =>
  s === 'high' ? 'bg-diff-rm' : s === 'medium' ? 'bg-accent' : 'bg-text-muted';

function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <div className="bg-bg-secondary/30 border-border/50 flex items-center gap-3 rounded-2xl border p-2 pr-5">
      <div
        className={`text-bg flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold ${scoreBgCls(score)}`}
      >
        {score}
      </div>
      <span className="text-text-secondary text-[10px] leading-tight font-bold tracking-widest uppercase">
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
    <div className="bg-bg-secondary/10 overflow-hidden rounded-2xl border transition-all">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="hover:bg-bg-hover flex w-full cursor-pointer items-center justify-between px-5 py-4 transition-all"
      >
        <span className="text-text text-xs font-bold tracking-tight">{category.label}</span>
        <div className="flex items-center gap-3">
          {highCount > 0 && <Badge variant="danger">{highCount} CRITICAL</Badge>}
          <Badge variant="default">
            {category.issues.length} {category.issues.length !== 1 ? 'ISSUES' : 'ISSUE'}
          </Badge>
          <span className={`w-8 text-right text-sm font-bold ${scoreTextCls(category.score)}`}>
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
        <div className="divide-border/50 bg-bg divide-y px-2 pb-2">
          {category.issues.map((issue) => (
            <div
              key={issue.id}
              className="hover:bg-bg-secondary/50 flex items-start gap-3 rounded-xl px-4 py-3 transition-colors"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityDotCls(issue.severity)}`}
              />
              <div className="min-w-0">
                <span className="text-text-secondary text-xs font-bold">{issue.description}</span>
                <p className="text-text-muted mt-1 text-[11px] leading-relaxed">
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
    <div className="bg-bg space-y-8 p-4">
      {/* Scores */}
      <div className="flex flex-wrap items-center gap-6">
        <ScoreBadge label="Job Match" score={match.overallScore} />
        <ScoreBadge label="ATS Score" score={audit.overallScore} />
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={onEditJd} className="px-4 py-2">
          Edit JD
        </Button>
      </div>

      {/* Keywords */}
      <div className="bg-bg overflow-hidden rounded-2xl border">
        <div className="bg-bg-secondary/30 border-border/50 flex items-center justify-between border-b px-6 py-4">
          <span className="text-text text-xs font-bold tracking-widest uppercase">Keywords</span>
          <Badge
            variant="accent"
            className="bg-diff-add-line border-diff-add-word text-diff-add border px-2"
          >
            {match.matchingKeywords.length} MATCH
          </Badge>
          <Badge
            variant="danger"
            className="bg-diff-rm-line border-diff-rm-word text-diff-rm border px-2"
          >
            {match.missingKeywords.length} MISSING
          </Badge>
        </div>
        <div className="space-y-4 px-6 py-5">
          {match.matchingKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {match.matchingKeywords.map((k) => (
                <Badge
                  key={k}
                  variant="accent"
                  className="diff-word-add border-diff-add-word/30 px-3 py-1"
                >
                  {k}
                </Badge>
              ))}
            </div>
          )}
          {match.missingKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {match.missingKeywords.map((k) => (
                <Badge
                  key={k}
                  variant="danger"
                  className="diff-word-rm border-diff-rm-word/30 px-3 py-1"
                >
                  {k}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section scores */}
      <div className="bg-bg overflow-hidden rounded-2xl border">
        <div className="bg-bg-secondary/30 text-text border-border/50 border-b px-6 py-4 text-xs font-bold tracking-widest uppercase">
          Sections
        </div>
        <div className="divide-border/50 divide-y">
          {Object.entries(match.sections).map(([key, val]) => (
            <div
              key={key}
              className="hover:bg-bg-secondary/20 flex items-center gap-4 px-6 py-3.5 transition-colors"
            >
              <span className="text-text-secondary w-24 shrink-0 text-xs font-bold capitalize">
                {key}
              </span>
              <span className="text-text-muted flex-1 truncate text-[11px] font-medium italic">
                {val.analysis}
              </span>
              <span
                className={`w-8 shrink-0 text-right text-sm font-black ${scoreTextCls(val.score)}`}
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
            <span className="text-text text-xs font-bold tracking-widest uppercase">
              ATS Issues
            </span>
            <Badge variant="default" className="px-3 py-1">
              {audit.categories.reduce((n, c) => n + c.issues.length, 0)} TOTAL
            </Badge>
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
        <div className="bg-bg overflow-hidden rounded-2xl border">
          <div className="bg-bg-secondary/30 text-text border-border/50 border-b px-6 py-4 text-xs font-bold tracking-widest uppercase">
            Recommendations
          </div>
          <div className="bg-accent/5 space-y-3 px-6 py-5">
            {match.recommendations.map((r, i) => (
              <div
                key={i}
                className="text-text-secondary flex gap-4 text-xs leading-relaxed font-medium"
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
