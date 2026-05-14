import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';

interface UrlFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * URL input that shows an https:// prefix chip.
 * Strips the prefix for display and re-adds on change.
 */
export function UrlField({ label, value, onChange, placeholder }: UrlFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  const hasProtocol = /^https?:\/\//i.test(value);
  const display = hasProtocol ? value.replace(/^https?:\/\//i, '') : value;

  const handleChange = (raw: string) => {
    if (!raw.trim()) {
      onChange('');
      return;
    }
    if (/^https?:\/\//i.test(raw)) {
      onChange(raw);
      return;
    }
    onChange(`https://${raw}`);
  };

  const handleBlur = () => {
    if (value === 'https://' || value === 'http://') {
      onChange('');
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-text-secondary ml-1 block text-xs font-medium">
        {label}
      </label>
      <div className="group flex transition-all">
        {(value || display) && (
          <span className="text-text-muted border-border-input bg-bg-secondary group-focus-within:border-accent flex shrink-0 items-center rounded-l-full border border-r-0 px-4 py-2 text-xs transition-colors select-none">
            https://
          </span>
        )}
        <Input
          id={id}
          type="text"
          value={display}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder?.replace(/^https?:\/\//i, '') || 'example.com'}
          className={cn('min-w-0 flex-1', value || display ? 'rounded-l-none' : 'rounded-full')}
        />
      </div>
    </div>
  );
}
