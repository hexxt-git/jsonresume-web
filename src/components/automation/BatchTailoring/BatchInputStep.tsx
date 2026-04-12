import { JdInput } from '../shared/JdInput';

interface Props {
  rawInput: string;
  onChange: (v: string) => void;
  detectedCount: number;
}

export function BatchInputStep({ rawInput, onChange, detectedCount }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">
        Paste or upload multiple job descriptions separated by --- or blank lines. Each will be
        tailored as a separate resume.
      </p>
      <JdInput
        value={rawInput}
        onChange={onChange}
        rows={10}
        label="Job Descriptions"
        placeholder={
          'Paste multiple job descriptions.\nSeparate them with --- or === or blank lines.'
        }
        append
      />
      {detectedCount > 0 && (
        <p className="text-[10px] text-text-muted">
          <span className="text-accent font-medium">{detectedCount}</span> job description
          {detectedCount !== 1 ? 's' : ''} detected
        </p>
      )}
    </div>
  );
}
