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
        <label className="text-xs font-medium text-text-secondary ml-1">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted tabular-nums px-2 py-0.5 bg-bg-secondary rounded-full">
            {isDefault ? 'default' : formatValue(value)}
          </span>
          {!isDefault && (
            <button
              onClick={() => onChange(defaultValue)}
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-text-muted hover:bg-bg-hover hover:text-text-secondary cursor-pointer transition-colors border border-border"
              title={t('ui.resetDefault')}
              aria-label={`Reset ${label} to default`}
            >
              &times;
            </button>
          )}
        </div>
      </div>
      <RadixSlider.Root
        className="relative flex items-center select-none touch-none w-full h-5 cursor-pointer"
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        aria-label={label}
      >
        <RadixSlider.Track className="relative grow rounded-full h-1.5 bg-border/50">
          <RadixSlider.Range
            className="absolute rounded-full h-full transition-all"
            style={{
              background: `color-mix(in srgb, var(--accent) ${Math.max(30, pct)}%, var(--border))`,
            }}
          />
        </RadixSlider.Track>
        <RadixSlider.Thumb className="block w-4.5 h-4.5 rounded-full bg-bg border-2 border-accent shadow-md outline-none focus-visible:ring-4 focus-visible:ring-accent/10 transition-all active:scale-95" />
      </RadixSlider.Root>
    </div>
  );
}
