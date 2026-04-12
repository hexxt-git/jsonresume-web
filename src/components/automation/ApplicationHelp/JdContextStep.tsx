import { JdInput } from '../shared/JdInput';

export function JdContextStep({ jd, onChange }: { jd: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">
        Provide the job description for the position you're applying to. This helps generate more
        relevant and targeted content.
      </p>
      <JdInput value={jd} onChange={onChange} rows={10} />
    </div>
  );
}
