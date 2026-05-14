import * as RadixSlider from '@radix-ui/react-slider';
import { useT } from '../../i18n';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  formatValue?: (v: number) => string;
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  defaultValue,
  formatValue = (v) => v.toFixed(2),
}: SliderProps) {
  const t = useT();
  const isDefault = value === defaultValue;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2.5 py-1">
      <div className="flex items-center justify-between">
        <label className="text-text-secondary ml-1 text-xs font-medium">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-text-muted bg-bg-secondary rounded-full px-2 py-0.5 text-xs tabular-nums">
            {isDefault ? 'default' : formatValue(value)}
          </span>
          {!isDefault && (
            <button
              onClick={() => onChange(defaultValue)}
              className="text-text-muted hover:bg-bg-hover hover:text-text-secondary flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border text-xs transition-colors"
              title={t('ui.resetDefault')}
              aria-label={`Reset ${label} to default`}
            >
              &times;
            </button>
          )}
        </div>
      </div>
      <RadixSlider.Root
        className="relative flex h-5 w-full cursor-pointer touch-none items-center select-none"
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        aria-label={label}
      >
        <RadixSlider.Track className="bg-border/50 relative h-1.5 grow rounded-full">
          <RadixSlider.Range
            className="absolute h-full rounded-full transition-all"
            style={{
              background: `color-mix(in srgb, var(--accent) ${Math.max(30, pct)}%, var(--border))`,
            }}
          />
        </RadixSlider.Track>
        <RadixSlider.Thumb className="bg-bg border-accent focus-visible:ring-accent/10 block h-4.5 w-4.5 rounded-full border-2 shadow-md transition-all outline-none focus-visible:ring-4 active:scale-95" />
      </RadixSlider.Root>
    </div>
  );
}
