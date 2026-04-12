import { JdInput } from '../shared/JdInput';

export function JdInputStep({ jd, onChange }: { jd: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">
        Paste or upload a job description. We'll analyze how well your resume matches and generate
        tailored improvements.
      </p>
      <JdInput value={jd} onChange={onChange} rows={10} />
    </div>
  );
}
