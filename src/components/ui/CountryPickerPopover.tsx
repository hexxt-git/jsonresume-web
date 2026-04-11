import { useState, useRef, useEffect, type ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { type CountryData, useCountries, flagUrl } from '../../hooks/useCountries';

interface Props {
  children: ReactNode;
  onSelect: (country: CountryData) => void;
  /** Show dial codes instead of ISO codes in the list */
  showDialCode?: boolean;
}

export function CountryPickerPopover({ children, onSelect, showDialCode }: Props) {
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
          className="z-50 w-[280px] rounded-lg border border-border bg-bg shadow-lg"
          sideOffset={4}
          align="start"
        >
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              className="w-full px-2 py-1 text-sm bg-bg-input border border-border-input rounded-md text-text
                focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            {loading ? (
              <div className="px-2 py-4 text-xs text-text-muted text-center">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="px-2 py-4 text-xs text-text-muted text-center">No results</div>
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
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md
                    hover:bg-bg-hover text-text-secondary text-left cursor-pointer"
                >
                  <img
                    src={flagUrl(c.code)}
                    alt=""
                    width={20}
                    height={15}
                    className="shrink-0 rounded-[2px]"
                    loading="lazy"
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-text-muted shrink-0">
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
