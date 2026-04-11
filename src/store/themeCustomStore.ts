export interface ThemeCustomization {
  accentColor: string;
  fontFamily: string;
  fontSizeMultiplier: number; // 1.0 = theme default
  lineHeightMultiplier: number; // 1.0 = theme default
  paddingMultiplier: number; // 1.0 = theme default
  sectionSpacingMultiplier: number; // 1.0 = theme default
  rtl: boolean;
}

export const defaultCustomization: ThemeCustomization = {
  accentColor: '',
  fontFamily: '',
  fontSizeMultiplier: 1,
  lineHeightMultiplier: 1,
  paddingMultiplier: 1,
  sectionSpacingMultiplier: 1,
  rtl: false,
};

/** Generate a CSS override block from customization values. Injected into theme HTML. */
export function buildCustomCss(c: ThemeCustomization): string {
  const parts: string[] = [];

  // Body-level overrides
  const bodyRules: string[] = [];
  if (c.fontFamily) bodyRules.push(`font-family:${c.fontFamily}`);
  if (c.paddingMultiplier !== 1) bodyRules.push(`padding:calc(40px * ${c.paddingMultiplier})`);
  if (bodyRules.length) parts.push(`body{${bodyRules.join(';')} !important}`);

  // Font size — set CSS custom property that all theme font-size declarations reference
  if (c.fontSizeMultiplier !== 1) {
    parts.push(`:root{--fs-mult:${c.fontSizeMultiplier}}`);
  }

  // Line height — apply to all text containers
  if (c.lineHeightMultiplier !== 1) {
    const lh = c.lineHeightMultiplier;
    parts.push(
      `body,p,li,.summary,.entry-org,.label,.entry-meta,h1,h2,h3{line-height:calc(1.6 * ${lh}) !important}`,
    );
  }

  // Section spacing — scale margins on sections and entries
  if (c.sectionSpacingMultiplier !== 1) {
    const m = c.sectionSpacingMultiplier;
    parts.push(
      `.section{margin-bottom:calc(24px * ${m}) !important}` +
        `.entry{margin-bottom:calc(16px * ${m}) !important}` +
        `h2{margin-bottom:calc(12px * ${m}) !important;padding-bottom:calc(6px * ${m}) !important}` +
        `h1{margin-bottom:calc(4px * ${m}) !important}` +
        `.divider{margin:calc(16px * ${m}) 0 !important}`,
    );
  }

  // Accent color
  if (c.accentColor) {
    parts.push(
      `h2{color:${c.accentColor} !important;border-bottom-color:${c.accentColor} !important}` +
        `a{color:${c.accentColor} !important}li::marker{color:${c.accentColor} !important}`,
    );
  }

  // RTL
  if (c.rtl) {
    parts.push('html{direction:rtl}body{direction:rtl;text-align:right !important}');
  }

  if (!parts.length) return '';
  return `<style>${parts.join('')}</style>`;
}
