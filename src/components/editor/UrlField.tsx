interface UrlFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * URL input that shows an https:// prefix chip.
 * Strips the prefix for display and re-adds on change if missing.
 */
export function UrlField({ label, value, onChange, placeholder }: UrlFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  const hasProtocol = /^https?:\/\//i.test(value);
  const display = hasProtocol ? value.replace(/^https?:\/\//i, '') : value;

  const handleChange = (raw: string) => {
    // If user cleared the field, clear the value
    if (!raw.trim()) {
      onChange('');
      return;
    }
    // If it already has a protocol, keep as-is
    if (/^https?:\/\//i.test(raw)) {
      onChange(raw);
      return;
    }
    // Auto-prefix https://
    onChange(`https://${raw}`);
  };

  const handleBlur = () => {
    // Clean up on blur: if user typed just a protocol, clear it
    if (value === 'https://' || value === 'http://') {
      onChange('');
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-text-secondary mb-1">
        {label}
      </label>
      <div className="flex">
        {value || display ? (
          <span className="flex items-center px-2 py-1.5 text-xs text-text-muted border border-border-input border-r-0 bg-bg-secondary rounded-l-md select-none shrink-0">
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
          className={`flex-1 min-w-0 px-3 py-1.5 text-sm border border-border-input bg-bg-input text-text
            focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
            ${value || display ? 'rounded-r-md' : 'rounded-md'}`}
        />
      </div>
    </div>
  );
}
