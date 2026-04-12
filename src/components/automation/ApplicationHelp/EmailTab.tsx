import { CopyableOutput } from '../shared/CopyableOutput';

const EMAIL_TYPES = ['Follow-up', 'Thank You', 'Inquiry', 'Negotiation'];

interface Props {
  emailType: string;
  emailContext: string;
  emailDraft: string;
  onTypeChange: (t: string) => void;
  onContextChange: (v: string) => void;
}

export function EmailTab({
  emailType,
  emailContext,
  emailDraft,
  onTypeChange,
  onContextChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {EMAIL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            className={`text-[10px] px-3 py-1 rounded-full cursor-pointer transition-colors ${
              emailType === t
                ? 'bg-accent text-white'
                : 'border border-border text-text-secondary hover:bg-bg-hover'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <textarea
        value={emailContext}
        onChange={(e) => onContextChange(e.target.value)}
        placeholder="Additional context (optional)..."
        rows={2}
        className="w-full px-3 py-2 text-xs border border-border-input bg-bg-input text-text rounded-lg focus:outline-none focus:ring-1 focus:ring-accent resize-y"
      />
      {emailDraft && <CopyableOutput content={emailDraft} label="Email Draft" />}
    </div>
  );
}
