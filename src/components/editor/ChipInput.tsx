import { useState, type KeyboardEvent } from 'react';
import { useT } from '../../i18n';
import { AiWritingTools } from './AiWritingTools';
import { useAiContext } from './AiContext';

interface ChipInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function ChipInput({ label, items, onChange, placeholder }: ChipInputProps) {
  const t = useT();
  const aiContext = useAiContext(label);
  const resolvedPlaceholder = placeholder || t('chip.placeholder');
  const [input, setInput] = useState('');

  const addItem = () => {
    const trimmed = input.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setInput('');
    }
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addItem();
    } else if (e.key === 'Backspace' && !input && items.length) {
      onChange(items.slice(0, -1));
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
      <AiWritingTools mode="list" items={items} onChange={onChange} context={aiContext}>
        <div className="flex flex-wrap gap-1.5 p-2 pr-8 border border-border-input bg-bg-input rounded-md focus-within:ring-1 focus-within:ring-accent focus-within:border-accent min-h-[36px]">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 bg-bg-tertiary text-text text-xs px-2 py-0.5 rounded"
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-text-muted hover:text-text-secondary cursor-pointer"
              >
                &times;
              </button>
            </span>
          ))}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onBlur={addItem}
            placeholder={items.length === 0 ? resolvedPlaceholder : ''}
            className="flex-1 min-w-[80px] text-sm outline-none bg-transparent text-text"
          />
        </div>
      </AiWritingTools>
    </div>
  );
}
