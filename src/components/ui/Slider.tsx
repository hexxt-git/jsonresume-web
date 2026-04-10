import * as RadixSlider from '@radix-ui/react-slider';

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
  const isDefault = value === defaultValue;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-text-secondary">{label}</label>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted tabular-nums">
            {isDefault ? 'default' : formatValue(value)}
          </span>
          {!isDefault && (
            <button
              onClick={() => onChange(defaultValue)}
              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-text-muted hover:bg-bg-hover hover:text-text-secondary cursor-pointer transition-colors"
              title="Reset to default"
              aria-label={`Reset ${label} to default`}
            >
              &times;
            </button>
          )}
        </div>
      </div>
      <RadixSlider.Root
        className="relative flex items-center select-none touch-none w-full h-4 cursor-pointer"
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        aria-label={label}
      >
        <RadixSlider.Track className="relative grow rounded-full h-1 bg-border">
          <RadixSlider.Range
            className="absolute rounded-full h-full transition-all"
            style={{
              background: `color-mix(in srgb, var(--accent) ${Math.max(30, pct)}%, var(--border))`,
            }}
          />
        </RadixSlider.Track>
        <RadixSlider.Thumb className="block w-3.5 h-3.5 rounded-full bg-bg border-2 border-accent shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/30 transition-shadow hover:shadow-md" />
      </RadixSlider.Root>
    </div>
  );
}
