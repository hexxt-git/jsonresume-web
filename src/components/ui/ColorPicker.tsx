import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useT } from '@/i18n';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const PRESETS = [
  '#2563eb', // blue
  '#7c3aed', // violet
  '#db2777', // pink
  '#dc2626', // red
  '#ea580c', // orange
  '#d97706', // amber
  '#059669', // emerald
  '#0891b2', // cyan
  '#4b5563', // grey
  '#1f2937', // dark
];

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const t = useT();
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
    <div className="space-y-1.5 py-1">
      <label className="text-text-secondary ml-1 block text-xs font-medium">{label}</label>
      <div className="flex items-center gap-3">
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              className="focus-visible:ring-accent/10 h-10 w-10 shrink-0 cursor-pointer rounded-full border-2 transition-all outline-none hover:shadow-md focus-visible:ring-4"
              style={{ backgroundColor: value || 'var(--accent)' }}
              aria-label={`${label}: ${value || 'default'}`}
            />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="border-border bg-bg z-50 w-60 overflow-hidden rounded-2xl border p-4 shadow-2xl"
              sideOffset={8}
              align="start"
            >
              <div className="mb-4 grid grid-cols-4 gap-2">
                {PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => selectColor(c)}
                    className={`focus-visible:ring-accent/10 aspect-square w-full cursor-pointer rounded-full transition-all outline-none focus-visible:ring-4 ${
                      value === c ? 'ring-accent ring-offset-bg scale-110 ring-2 ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
              <div className="relative mb-1 h-10 w-full">
                <input
                  type="color"
                  value={value || '#2563eb'}
                  onChange={(e) => selectColor(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="border-border text-text-muted bg-bg-secondary pointer-events-none flex h-full w-full items-center justify-center rounded-xl border text-[10px] font-medium">
                  {t('ui.customColor' as any) || 'Custom Color'}
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
          placeholder={t('customize.themeDefault')}
          className="border-border-input bg-bg-input text-text focus:ring-accent flex-1 rounded-full border px-4 py-2 font-mono text-xs transition-all outline-none focus:ring-1"
          aria-label={`${label} hex value`}
        />

        {value && (
          <button
            onClick={() => {
              onChange('');
              setInputValue('');
            }}
            className="text-text-muted hover:bg-bg-hover hover:text-danger border-border flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border text-sm transition-all"
            title={t('ui.resetDefault')}
            aria-label={`Reset ${label}`}
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
