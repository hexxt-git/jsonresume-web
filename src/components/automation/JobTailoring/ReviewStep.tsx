import { SectionDiffReview, type SectionChange } from '../shared/SectionDiffReview';

interface Props {
  changes: SectionChange[];
  onAccept: (sectionKey: string, afterValue: unknown) => void;
  onAcceptAll: () => void;
  onTryAnother: () => void;
}

export function ReviewStep({ changes, onAccept, onAcceptAll, onTryAnother }: Props) {
  if (changes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-text-muted">
          No changes needed — your resume already matches well.
        </p>
        <button
          onClick={onTryAnother}
          className="text-xs text-accent hover:underline cursor-pointer mt-2"
        >
          Try another JD
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionDiffReview
        changes={changes}
        onAccept={onAccept}
        onReject={() => {}}
        onAcceptAll={onAcceptAll}
        onRejectAll={() => {}}
      />
    </div>
  );
}
