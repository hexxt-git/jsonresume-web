import { useState, type KeyboardEvent } from 'react';

interface ChipInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function ChipInput({
  label,
  items,
  onChange,
  placeholder = 'Type and press Enter',
}: ChipInputProps) {
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
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 min-h-[36px]">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
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
          placeholder={items.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] text-sm outline-none bg-transparent"
        />
      </div>
    </div>
  );
}
