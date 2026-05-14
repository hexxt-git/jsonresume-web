import { useState, useRef, useEffect, type ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { type CountryData, useCountries, flagUrl } from '@/hooks/useCountries';
import { useT } from '@/i18n';
import { Input } from '@/components/ui/Input';

interface Props {
  children: ReactNode;
  onSelect: (country: CountryData) => void;
  /** Show dial codes instead of ISO codes in the list */
  showDialCode?: boolean;
}

export function CountryPickerPopover({ children, onSelect, showDialCode }: Props) {
  const t = useT();
  const { countries, loading } = useCountries();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const q = search.toLowerCase();
  const filtered = q
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (showDialCode && c.dialCode.includes(search)),
      )
    : countries;

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearch('');
      }}
    >
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="bg-bg z-50 w-[320px] overflow-hidden rounded-2xl border"
          sideOffset={8}
          align="start"
        >
          <div className="border-border bg-bg-secondary/30 border-b p-3">
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('ui.searchCountries')}
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto p-2">
            {loading ? (
              <div className="text-text-muted px-3 py-6 text-center text-xs">{t('ui.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="text-text-muted px-3 py-6 text-center text-xs">
                {t('ui.noResults')}
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onSelect(c);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="hover:bg-bg-hover text-text-secondary flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-xs transition-colors"
                >
                  <img
                    src={flagUrl(c.code)}
                    alt=""
                    width={22}
                    height={16}
                    className="shrink-0 rounded-[3px]"
                    loading="lazy"
                  />
                  <span className="flex-1 truncate font-medium">{c.name}</span>
                  <span className="text-text-muted bg-bg-secondary shrink-0 rounded-full px-1.5 py-0.5 text-[10px]">
                    {showDialCode ? c.dialCode : c.code}
                  </span>
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
