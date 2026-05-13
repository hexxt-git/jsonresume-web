import { useState, useRef, useEffect, type ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ArrowDown2, TickCircle } from 'iconsax-react';
import { useT } from '../../i18n';

interface Option {
  value: string;
  label: string;
  /** Text/emoji icon */
  icon?: string;
  /** React node icon (takes precedence over icon string) */
  iconNode?: ReactNode;
}

interface ComboFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

function OptionIcon({ opt }: { opt: Option }) {
  if (opt.iconNode) return <>{opt.iconNode}</>;
  if (opt.icon) return <span className="text-sm shrink-0 leading-none">{opt.icon}</span>;
  return null;
}

/**
 * Text input with a dropdown of preset options.
 * User can pick a preset OR type any custom value.
 */
export function ComboField({ label, value, onChange, options, placeholder }: ComboFieldProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const q = filter.toLowerCase();
  const filtered = q
    ? options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
    : options;

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    } else {
      setFilter('');
    }
  }, [open]);

  const cls =
    'w-full px-4 py-2 text-sm border border-border-input bg-bg-input text-text rounded-full focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all';

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-text-secondary ml-1">{label}</label>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`${cls} flex items-center gap-2.5 text-left cursor-pointer hover:bg-bg-hover`}
          >
            {selectedOption && <OptionIcon opt={selectedOption} />}
            <span className={`flex-1 truncate ${value ? '' : 'text-text-muted'}`}>
              {selectedOption?.label || value || placeholder || 'Select...'}
            </span>
            <ArrowDown2
              size={14}
              className="text-text-muted shrink-0"
              variant="Bold"
              color="currentColor"
            />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-50 w-[var(--radix-popover-trigger-width)] rounded-2xl border border-border bg-bg shadow-xl overflow-hidden"
            sideOffset={8}
            align="start"
          >
            <div className="p-3 border-b border-border bg-bg-secondary/30">
              <input
                ref={inputRef}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filter.trim()) {
                    onChange(filter.trim());
                    setOpen(false);
                  }
                }}
                placeholder={t('combo.search')}
                className="w-full px-3 py-1.5 text-sm bg-bg-input border border-border-input rounded-full text-text
                  focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
            <div className="max-h-[240px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-xs text-text-muted text-center">
                  {filter.trim() ? (
                    <button
                      type="button"
                      onClick={() => {
                        onChange(filter.trim());
                        setOpen(false);
                      }}
                      className="text-accent hover:underline cursor-pointer font-medium"
                    >
                      {t('combo.use')} &ldquo;{filter.trim()}&rdquo;
                    </button>
                  ) : (
                    t('combo.noOptions')
                  )}
                </div>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-left cursor-pointer transition-colors
                      ${value === o.value ? 'bg-bg-accent text-accent-text font-medium' : 'hover:bg-bg-hover text-text-secondary'}`}
                  >
                    <OptionIcon opt={o} />
                    <span className="flex-1 truncate">{o.label}</span>
                    {value === o.value && (
                      <TickCircle
                        size={14}
                        variant="Bold"
                        color="currentColor"
                        className="text-accent shrink-0"
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

/* ── Preset option lists ─────────────────────────────── */

export const FLUENCY_OPTIONS: Option[] = [
  { value: 'Elementary', label: 'Elementary', icon: '○' },
  { value: 'Limited Working', label: 'Limited Working', icon: '◔' },
  { value: 'Professional Working', label: 'Professional Working', icon: '◑' },
  { value: 'Full Professional', label: 'Full Professional', icon: '◕' },
  { value: 'Native', label: 'Native / Bilingual', icon: '●' },
];

export const SKILL_LEVEL_OPTIONS: Option[] = [
  { value: 'Beginner', label: 'Beginner', icon: '○' },
  { value: 'Intermediate', label: 'Intermediate', icon: '◐' },
  { value: 'Advanced', label: 'Advanced', icon: '◑' },
  { value: 'Expert', label: 'Expert', icon: '●' },
];

export const DEGREE_OPTIONS: Option[] = [
  { value: 'High School', label: 'High School' },
  { value: 'Associate', label: 'Associate' },
  { value: "Bachelor's", label: "Bachelor's" },
  { value: "Master's", label: "Master's" },
  { value: 'MBA', label: 'MBA' },
  { value: 'PhD', label: 'PhD / Doctorate' },
  { value: 'Diploma', label: 'Diploma' },
  { value: 'Certificate', label: 'Certificate' },
];

// Network options are built from networkIcons.tsx — import separately
// to keep this file focused on the generic ComboField component.
export type { Option as ComboOption };
