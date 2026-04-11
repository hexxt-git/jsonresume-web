interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-text-secondary">{label}</label>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-8 h-4.5 rounded-full transition-colors cursor-pointer ${
          value ? 'bg-accent' : 'bg-border-input'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${
            value ? 'translate-x-3.5' : ''
          }`}
        />
      </button>
    </div>
  );
}
