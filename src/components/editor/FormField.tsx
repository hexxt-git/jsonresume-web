import { AiWritingTools } from '@/components/ai/AiWritingTools';
import { useAiContext } from '@/components/ai/AiContext';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

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

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-text-secondary ml-1 block text-xs font-medium">
        {label}
      </label>
      {multiline ? (
        <AiWritingTools mode="text" value={value} onChange={onChange} context={aiContext}>
          <div className="relative">
            <Textarea
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="pr-8"
            />
          </div>
        </AiWritingTools>
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
