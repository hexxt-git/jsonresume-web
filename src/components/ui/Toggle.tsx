import { cn } from '@/utils/cn';

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <label className="text-text-secondary ml-1 text-xs font-medium">{label}</label>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative h-5.5 w-10 cursor-pointer rounded-full transition-all duration-150',
          value ? 'bg-accent shadow-sm' : 'bg-border-input',
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-150',
            value && 'translate-x-4.5',
          )}
        />
      </button>
    </div>
  );
}
