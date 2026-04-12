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
  const cls =
    'w-full px-3 py-1.5 text-sm border border-border-input bg-bg-input text-text rounded-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent';
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-text-secondary mb-1">
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
            className={cls + ' resize-y pr-8'}
          />
        </AiWritingTools>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}
