import { useResumeStore, activeSlot } from '../../../store/resumeStore';
import type { AnalysisData } from './types';
import { scoreColor } from './types';

interface Props {
  analysis: AnalysisData;
  onEditJd: () => void;
}

export function MatchAnalysis({ analysis, onEditJd }: Props) {
  return (
    <div className="space-y-4">
      {/* Score badge + info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: scoreColor(analysis.overallMatchScore), color: 'var(--bg)' }}
          >
            {analysis.overallMatchScore}
          </div>
          <div>
            <div className="text-xs font-medium text-text">Match Score</div>
            <div className="text-[10px] text-text-muted">
              {analysis.matchingKeywords.length} matching · {analysis.missingKeywords.length}{' '}
              missing keywords
              {(() => {
                const resume = activeSlot(useResumeStore.getState()).resume;
                const warnings: string[] = [];
                if (!resume.work?.length) warnings.push('no work experience');
                else if (resume.work.length < 2) warnings.push('limited work experience');
                if (!resume.education?.length) warnings.push('no education');
                if (!resume.skills?.length) warnings.push('no skills listed');
                if (!resume.basics?.summary) warnings.push('no summary');
                return warnings.length ? (
                  <span style={{ color: 'var(--diff-rm-text)' }}> · {warnings.join(', ')}</span>
                ) : null;
              })()}
            </div>
          </div>
        </div>
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
            <span style={{ color: 'var(--diff-add-text)' }}>
              {analysis.matchingKeywords.length} matching
            </span>
            {' · '}
            <span style={{ color: 'var(--diff-rm-text)' }}>
              {analysis.missingKeywords.length} missing
            </span>
          </span>
        </div>
        <div className="px-3 py-2 space-y-2">
          {analysis.matchingKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {analysis.matchingKeywords.map((k) => (
                <span key={k} className="text-[10px] px-2 py-0.5 rounded diff-word-add">
                  {k}
                </span>
              ))}
            </div>
          )}
          {analysis.missingKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {analysis.missingKeywords.map((k) => (
                <span key={k} className="text-[10px] px-2 py-0.5 rounded diff-word-rm">
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-bg-secondary text-xs font-medium text-text">Sections</div>
        <div className="divide-y divide-border">
          {Object.entries(analysis.sections).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 px-3 py-1.5">
              <span className="text-xs text-text-secondary capitalize flex-1">{key}</span>
              <span className="text-[10px] text-text-muted flex-1 truncate">{val.analysis}</span>
              <span
                className="text-xs font-medium shrink-0"
                style={{ color: scoreColor(val.score) }}
              >
                {val.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-bg-secondary text-xs font-medium text-text">
            Recommendations
          </div>
          <div className="px-3 py-2 space-y-1">
            {analysis.recommendations.map((r, i) => (
              <div key={i} className="flex gap-2 text-xs text-text-secondary">
                <span className="text-accent shrink-0">•</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
