import { useResumeStore, activeSlot } from '@/store/resumeStore';
import { useT } from '@/i18n';
import { Slider } from '@/components/ui/Slider';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';

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
  const custom = useResumeStore((s) => activeSlot(s).customization);
  const setCustom = useResumeStore((s) => s.setCustomization);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
        <div className="space-y-8">
          <ColorPicker
            label={t('customize.accentColor')}
            value={custom.accentColor}
            onChange={(v) => setCustom('accentColor', v)}
          />

          <div className="space-y-2">
            <label className="text-text-secondary ml-1 block text-[11px] font-bold tracking-wider uppercase">
              {t('customize.fontFamily')}
            </label>
            <Select
              className="w-full"
              value={custom.fontFamily || THEME_DEFAULT}
              onValueChange={(v) => setCustom('fontFamily', v === THEME_DEFAULT ? '' : v)}
              options={FONT_OPTIONS}
            />
          </div>

          <Toggle
            label={t('customize.rtl')}
            value={!!custom.rtl}
            onChange={(v) => setCustom('rtl', v ? 1 : 0)}
          />
        </div>

        <div className="border-border/40 space-y-8 pt-4 md:border-l md:pt-0 md:pl-10">
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

          <Slider
            label={t('customize.sectionSpacing')}
            value={custom.sectionSpacingMultiplier}
            onChange={(v) => setCustom('sectionSpacingMultiplier', v)}
            min={0.25}
            max={2}
            step={0.01}
            defaultValue={1}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
        </div>
      </div>
    </div>
  );
}
