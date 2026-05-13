import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useT } from '../../i18n';

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
      <label className="block text-xs font-medium text-text-secondary ml-1">{label}</label>
      <div className="flex items-center gap-3">
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              className="w-10 h-10 rounded-full border-2 border-border cursor-pointer transition-all hover:shadow-md focus-visible:ring-4 focus-visible:ring-accent/10 outline-none shrink-0"
              style={{ backgroundColor: value || 'var(--accent)' }}
              aria-label={`${label}: ${value || 'default'}`}
            />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="z-50 rounded-2xl border border-border bg-bg shadow-2xl p-4 w-60 overflow-hidden"
              sideOffset={8}
              align="start"
            >
              <div className="grid grid-cols-4 gap-2 mb-4">
                {PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => selectColor(c)}
                    className={`w-full aspect-square rounded-full cursor-pointer transition-all outline-none focus-visible:ring-4 focus-visible:ring-accent/10 ${
                      value === c ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
              <div className="relative h-10 w-full mb-1">
                <input
                  type="color"
                  value={value || '#2563eb'}
                  onChange={(e) => selectColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-full rounded-xl border border-border pointer-events-none flex items-center justify-center text-[10px] text-text-muted font-medium bg-bg-secondary">
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
          className="flex-1 px-4 py-2 text-xs border border-border-input bg-bg-input text-text rounded-full font-mono outline-none focus:ring-1 focus:ring-accent transition-all"
          aria-label={`${label} hex value`}
        />

        {value && (
          <button
            onClick={() => {
              onChange('');
              setInputValue('');
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-text-muted hover:bg-bg-hover hover:text-danger cursor-pointer transition-all border border-border"
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
