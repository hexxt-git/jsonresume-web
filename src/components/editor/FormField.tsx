import { AiWritingTools } from '../ai/AiWritingTools';
import { useAiContext } from '../ai/AiContext';

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
}

export function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  multiline,
}: FormFieldProps) {
  const aiContext = useAiContext(label);
  const id = label.toLowerCase().replace(/\s+/g, '-');
  const baseCls =
    'w-full px-4 py-2 text-sm border border-border-input bg-bg-input text-text focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all';
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-text-secondary ml-1 block text-xs font-medium">
        {label}
      </label>
      {multiline ? (
        <AiWritingTools mode="text" value={value} onChange={onChange} context={aiContext}>
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className={`${baseCls} resize-y rounded-2xl pr-8`}
          />
        </AiWritingTools>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${baseCls} rounded-full`}
        />
      )}
    </div>
  );
}
