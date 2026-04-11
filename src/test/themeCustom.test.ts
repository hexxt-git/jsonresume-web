import { describe, it, expect, beforeEach } from 'vitest';
import { useResumeStore, activeSlot } from '../store/resumeStore';
import { buildCustomCss, defaultCustomization } from '../store/themeCustomStore';

describe('theme customization in resume store', () => {
  beforeEach(() => {
    useResumeStore.getState().saveSlot('');
    useResumeStore.getState().resetCustomization();
  });

  it('starts with multiplier defaults (all 1.0)', () => {
    const { customization } = activeSlot(useResumeStore.getState());
    expect(customization.accentColor).toBe('');
    expect(customization.fontFamily).toBe('');
    expect(customization.fontSizeMultiplier).toBe(1);
    expect(customization.lineHeightMultiplier).toBe(1);
    expect(customization.paddingMultiplier).toBe(1);
  });

  it('setCustomization updates a single field', () => {
    useResumeStore.getState().setCustomization('accentColor', '#ff0000');
    expect(activeSlot(useResumeStore.getState()).customization.accentColor).toBe('#ff0000');
  });

  it('setCustomization preserves other fields', () => {
    useResumeStore.getState().setCustomization('fontSizeMultiplier', 1.2);
    useResumeStore.getState().setCustomization('lineHeightMultiplier', 0.9);
    expect(activeSlot(useResumeStore.getState()).customization.fontSizeMultiplier).toBe(1.2);
    expect(activeSlot(useResumeStore.getState()).customization.lineHeightMultiplier).toBe(0.9);
  });

  it('resetCustomization clears all fields to defaults', () => {
    useResumeStore.getState().setCustomization('accentColor', '#ff0000');
    useResumeStore.getState().setCustomization('fontSizeMultiplier', 1.5);
    useResumeStore.getState().resetCustomization();
    const { customization } = activeSlot(useResumeStore.getState());
    expect(customization.accentColor).toBe('');
    expect(customization.fontSizeMultiplier).toBe(1);
  });

  it('setFullCustomization replaces entire object', () => {
    useResumeStore.getState().setFullCustomization({
      accentColor: '#00ff00',
      fontFamily: 'Georgia',
      fontSizeMultiplier: 0.8,
      lineHeightMultiplier: 1.3,
      paddingMultiplier: 0.5,
      sectionSpacingMultiplier: 1,
      rtl: false,
    });
    const { customization } = activeSlot(useResumeStore.getState());
    expect(customization.accentColor).toBe('#00ff00');
    expect(customization.fontSizeMultiplier).toBe(0.8);
    expect(customization.paddingMultiplier).toBe(0.5);
  });

  it('reset clears customization along with resume', () => {
    useResumeStore.getState().setCustomization('accentColor', '#ff0000');
    useResumeStore.getState().reset();
    expect(activeSlot(useResumeStore.getState()).customization.accentColor).toBe('');
  });
});

describe('buildCustomCss', () => {
  it('returns empty string when all defaults', () => {
    expect(buildCustomCss(defaultCustomization)).toBe('');
  });

  it('generates font-size multiplier override', () => {
    const css = buildCustomCss({ ...defaultCustomization, fontSizeMultiplier: 1.2 });
    expect(css).toContain('--fs-mult');
    expect(css).toContain('1.2');
  });

  it('generates line-height multiplier override', () => {
    const css = buildCustomCss({ ...defaultCustomization, lineHeightMultiplier: 1.3 });
    expect(css).toContain('line-height');
    expect(css).toContain('1.3');
  });

  it('generates accent color overrides', () => {
    const css = buildCustomCss({ ...defaultCustomization, accentColor: '#e63946' });
    expect(css).toContain('h2{color:#e63946');
    expect(css).toContain('a{color:#e63946');
  });

  it('generates font-family override', () => {
    const css = buildCustomCss({ ...defaultCustomization, fontFamily: 'Georgia, serif' });
    expect(css).toContain('font-family:Georgia, serif');
  });

  it('generates padding multiplier override', () => {
    const css = buildCustomCss({ ...defaultCustomization, paddingMultiplier: 1.5 });
    expect(css).toContain('padding');
    expect(css).toContain('1.5');
  });

  it('does not generate overrides for default multiplier values', () => {
    const css = buildCustomCss({
      accentColor: '',
      fontFamily: '',
      fontSizeMultiplier: 1,
      lineHeightMultiplier: 1,
      paddingMultiplier: 1,
      sectionSpacingMultiplier: 1,
      rtl: false,
    });
    expect(css).toBe('');
  });
});
