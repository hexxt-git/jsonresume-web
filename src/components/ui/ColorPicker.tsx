import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const PRESETS = [
  '#2563eb',
  '#0d9488',
  '#6b7c5e',
  '#9333ea',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#64748b',
  '#0f172a',
  '#1e293b',
  '#404040',
  '#737373',
];

export function ColorPicker({
  label,
  value,
  onChange,
  placeholder = 'Theme default',
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = (v: string) => {
    setInputValue(v);
    if (v === '' || /^#[0-9a-fA-F]{6}$/.test(v)) {
      onChange(v);
    }
  };

  const handleInputBlur = () => {
    setInputValue(value);
  };

  const selectColor = (c: string) => {
    onChange(c);
    setInputValue(c);
  };

  // Keep input in sync when value changes externally
  if (value !== inputValue && document.activeElement?.tagName !== 'INPUT') {
    setInputValue(value);
  }

  return (
    <div>
      <label className="block text-xs text-text-secondary mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              className="w-8 h-8 rounded-lg border border-border cursor-pointer transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:ring-accent/30 outline-none shrink-0"
              style={{ backgroundColor: value || 'var(--accent)' }}
              aria-label={`${label}: ${value || 'default'}`}
            />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="z-50 rounded-xl border border-border bg-bg shadow-lg p-3 w-52"
              sideOffset={6}
              align="start"
            >
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => selectColor(c)}
                    className={`w-full aspect-square rounded-md cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
                      value === c
                        ? 'ring-2 ring-accent ring-offset-1 ring-offset-bg scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
              <input
                type="color"
                value={value || '#2563eb'}
                onChange={(e) => selectColor(e.target.value)}
                className="w-full h-8 rounded-md border border-border cursor-pointer"
              />
              <Popover.Arrow className="fill-border" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="flex-1 px-2 py-1.5 text-xs border border-border-input bg-bg-input text-text rounded-md font-mono outline-none focus:ring-1 focus:ring-accent transition-shadow"
          aria-label={`${label} hex value`}
        />

        {value && (
          <button
            onClick={() => {
              onChange('');
              setInputValue('');
            }}
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs text-text-muted hover:bg-bg-hover hover:text-text-secondary cursor-pointer transition-colors"
            title="Reset to theme default"
            aria-label={`Reset ${label}`}
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
