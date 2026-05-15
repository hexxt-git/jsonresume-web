import { useState, useRef, useEffect, type ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ArrowDown2, TickCircle } from 'iconsax-react';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { cn } from '@/utils/cn';

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
  if (opt.icon) return <span className="shrink-0 text-sm leading-none">{opt.icon}</span>;
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

  return (
    <div className="space-y-1.5">
      <label className="text-text-secondary ml-1 block text-xs font-medium">{label}</label>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button
            variant="outline"
            className="bg-bg-input hover:bg-bg-hover flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm font-normal"
          >
            {selectedOption && <OptionIcon opt={selectedOption} />}
            <span className={cn('flex-1 truncate', !value && 'text-text-muted')}>
              {selectedOption?.label || value || placeholder || 'Select...'}
            </span>
            <ArrowDown2
              size={14}
              className="text-text-muted shrink-0"
              variant="Bold"
              color="currentColor"
            />
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="bg-bg animate-radix-content z-50 w-(--radix-popover-trigger-width) overflow-hidden rounded-2xl border shadow-xl"
            sideOffset={8}
            align="start"
          >
            <div className="border-border bg-bg-secondary/30 border-b p-3">
              <Input
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
                className="h-9 px-3 py-1.5 text-sm"
              />
            </div>
            <ScrollArea className="max-h-[240px]">
              <div className="p-2">
                {filtered.length === 0 ? (
                  <div className="text-text-muted px-3 py-4 text-center text-xs">
                    {filter.trim() ? (
                      <button
                        type="button"
                        onClick={() => {
                          onChange(filter.trim());
                          setOpen(false);
                        }}
                        className="text-accent cursor-pointer font-medium hover:underline"
                      >
                        {t('combo.use')} &ldquo;{filter.trim()}&rdquo;
                      </button>
                    ) : (
                      t('combo.noOptions')
                    )}
                  </div>
                ) : (
                  filtered.map((o) => (
                    <Button
                      key={o.value}
                      variant="ghost"
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-normal',
                        value === o.value
                          ? 'bg-bg-accent text-accent-text hover:bg-bg-accent font-medium'
                          : 'text-text-secondary',
                      )}
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
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
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
