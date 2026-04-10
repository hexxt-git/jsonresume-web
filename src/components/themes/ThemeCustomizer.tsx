import { useResumeStore } from '../../store/resumeStore';
import { useT } from '../../i18n';
import { Slider } from '../ui/Slider';
import { ColorPicker } from '../ui/ColorPicker';
import { Select } from '../ui/Select';

const THEME_DEFAULT = '__default__';

const FONT_OPTIONS = [
  { value: THEME_DEFAULT, label: 'Theme Default' },
  {
    value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    label: 'System Sans',
  },
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: "Georgia, 'Times New Roman', serif", label: 'Georgia' },
  { value: "'EB Garamond', Garamond, serif", label: 'Garamond' },
  {
    value: "ui-monospace, 'SF Mono', Consolas, monospace",
    label: 'Monospace',
  },
];

export function ThemeCustomizer() {
  const t = useT();
  const custom = useResumeStore((s) => s.customization);
  const setCustom = useResumeStore((s) => s.setCustomization);
  const resetCustom = useResumeStore((s) => s.resetCustomization);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-text uppercase tracking-wide">
          {t('customize.title')}
        </h3>
        <button
          onClick={resetCustom}
          className="text-xs text-text-muted hover:text-text-secondary cursor-pointer"
        >
          {t('customize.reset')}
        </button>
      </div>

      <ColorPicker
        label={t('customize.accentColor')}
        value={custom.accentColor}
        onChange={(v) => setCustom('accentColor', v)}
      />

      <div>
        <label className="block text-xs text-text-secondary mb-1.5">
          {t('customize.fontFamily')}
        </label>
        <Select
          className="w-full"
          value={custom.fontFamily || THEME_DEFAULT}
          onValueChange={(v) => setCustom('fontFamily', v === THEME_DEFAULT ? '' : v)}
          options={FONT_OPTIONS}
        />
      </div>

      <Slider
        label={t('customize.fontSize')}
        value={custom.fontSizeMultiplier}
        onChange={(v) => setCustom('fontSizeMultiplier', v)}
        min={0.7}
        max={1.5}
        step={0.01}
        defaultValue={1}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />

      <Slider
        label={t('customize.lineHeight')}
        value={custom.lineHeightMultiplier}
        onChange={(v) => setCustom('lineHeightMultiplier', v)}
        min={0.8}
        max={1.6}
        step={0.01}
        defaultValue={1}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />

      <Slider
        label={t('customize.pagePadding')}
        value={custom.paddingMultiplier}
        onChange={(v) => setCustom('paddingMultiplier', v)}
        min={0.25}
        max={2}
        step={0.01}
        defaultValue={1}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />
    </div>
  );
}
