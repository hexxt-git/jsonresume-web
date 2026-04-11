export interface ThemeCustomization {
  accentColor: string;
  fontFamily: string;
  fontSizeMultiplier: number; // 1.0 = theme default
  lineHeightMultiplier: number; // 1.0 = theme default
  paddingMultiplier: number; // 1.0 = theme default
  rtl: boolean;
}

export const defaultCustomization: ThemeCustomization = {
  accentColor: '',
  fontFamily: '',
  fontSizeMultiplier: 1,
  lineHeightMultiplier: 1,
  paddingMultiplier: 1,
  rtl: false,
};

/** Generate a CSS override block from customization values. Injected into theme HTML. */
export function buildCustomCss(c: ThemeCustomization): string {
  const rules: string[] = [];
  if (c.fontFamily) rules.push(`font-family:${c.fontFamily}`);
  if (c.fontSizeMultiplier !== 1) rules.push(`font-size:calc(1em * ${c.fontSizeMultiplier})`);
  if (c.lineHeightMultiplier !== 1) rules.push(`line-height:calc(1.6 * ${c.lineHeightMultiplier})`);
  if (c.paddingMultiplier !== 1) rules.push(`padding:calc(40px * ${c.paddingMultiplier})`);
  const bodyRules = rules.length ? `body{${rules.join(';')} !important}` : '';

  const accentRules = c.accentColor
    ? `h2{color:${c.accentColor} !important;border-bottom-color:${c.accentColor} !important}a{color:${c.accentColor} !important}li::marker{color:${c.accentColor} !important}`
    : '';

  const rtlRules = c.rtl
    ? 'html{direction:rtl}body{direction:rtl;text-align:right !important}'
    : '';

  if (!bodyRules && !accentRules && !rtlRules) return '';
  return `<style>${bodyRules}${accentRules}${rtlRules}</style>`;
}
