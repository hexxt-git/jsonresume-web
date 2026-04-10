import { useResumeStore } from '../../store/resumeStore';
import { useT } from '../../i18n';
import { Slider } from '../ui/Slider';
import { ColorPicker } from '../ui/ColorPicker';
import { Select } from '../ui/Select';

const THEME_DEFAULT = '__default__';

const FONT_OPTIONS = [
  { value: THEME_DEFAULT, label: 'Theme Default' },
  { value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", label: 'System' },
  { value: "'Inter', system-ui, sans-serif", label: 'Inter' },
  { value: "'Helvetica Neue', Helvetica, Arial, sans-serif", label: 'Helvetica' },
  { value: "Georgia, 'Times New Roman', serif", label: 'Georgia' },
  { value: "'Palatino Linotype', Palatino, 'Book Antiqua', serif", label: 'Palatino' },
  { value: "'EB Garamond', Garamond, serif", label: 'Garamond' },
  { value: "'Charter', 'Bitstream Charter', serif", label: 'Charter' },
  { value: "'Verdana', Geneva, sans-serif", label: 'Verdana' },
  { value: "'Trebuchet MS', 'Lucida Sans', sans-serif", label: 'Trebuchet' },
  { value: "ui-monospace, 'SF Mono', Consolas, 'Liberation Mono', monospace", label: 'Monospace' },
];

export function ThemeCustomizer() {
  const t = useT();
  const custom = useResumeStore((s) => s.customization);
  const setCustom = useResumeStore((s) => s.setCustomization);
  const resetCustom = useResumeStore((s) => s.resetCustomization);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
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
        min={0.5}
        max={1.5}
        step={0.01}
        defaultValue={1}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />

      <Slider
        label={t('customize.lineHeight')}
        value={custom.lineHeightMultiplier}
        onChange={(v) => setCustom('lineHeightMultiplier', v)}
        min={0.5}
        max={1.5}
        step={0.01}
        defaultValue={1}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />

      <Slider
        label={t('customize.pagePadding')}
        value={custom.paddingMultiplier}
        onChange={(v) => setCustom('paddingMultiplier', v)}
        min={0.25}
        max={1.75}
        step={0.01}
        defaultValue={1}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />
    </div>
  );
}
