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
      <label htmlFor={id} className="block text-xs font-medium text-text-secondary ml-1">
        {label}
      </label>
      <div className="flex group transition-all">
        {value || display ? (
          <span className="flex items-center px-4 py-2 text-xs text-text-muted border border-border-input border-r-0 bg-bg-secondary rounded-l-full select-none shrink-0 transition-colors group-focus-within:border-accent">
            https://
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          value={display}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder?.replace(/^https?:\/\//i, '') || 'example.com'}
          className={`flex-1 min-w-0 px-4 py-2 text-sm border border-border-input bg-bg-input text-text
            focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all
            ${value || display ? 'rounded-r-full' : 'rounded-full'}`}
        />
      </div>
    </div>
  );
}
