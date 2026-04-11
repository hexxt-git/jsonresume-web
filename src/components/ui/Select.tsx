import * as RadixSelect from '@radix-ui/react-select';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  size = 'md',
  className,
}: SelectProps) {
  const trigger = size === 'sm' ? 'text-xs px-2 py-1 gap-1' : 'text-xs px-3 py-1.5 gap-1.5';

  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger
        className={`inline-flex items-center justify-between rounded-md border border-border bg-bg
          text-text-secondary hover:bg-bg-hover outline-none cursor-pointer transition-colors
          data-placeholder:text-text-muted ${trigger} ${className}`}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className="text-text-muted">
          <ChevronDown />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className="z-50 overflow-hidden rounded-lg border border-border bg-bg shadow-lg"
          position="popper"
          sideOffset={4}
          align="start"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-text-secondary
                  outline-none cursor-pointer select-none
                  data-[highlighted]:bg-bg-hover data-[highlighted]:text-text
                  data-[state=checked]:text-accent-text data-[state=checked]:font-medium"
              >
                <RadixSelect.ItemIndicator className="w-3 text-accent">
                  <Check />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

function ChevronDown() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 4.5L6 7.5L9 4.5" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 5.5L4 7.5L8 3" />
    </svg>
  );
}
