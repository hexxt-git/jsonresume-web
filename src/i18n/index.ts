import en from './en';
import fr from './fr';
import ar from './ar';
import { useSettingsStore } from '../store/settingsStore';

export type Locale = 'en' | 'fr' | 'ar';
type TranslationKey = keyof typeof en;
type Translations = Record<string, string>;

const translations: Record<Locale, Translations> = { en, fr, ar };

export const locales: { id: Locale; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Francais' },
  { id: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' },
];

export function useT() {
  const locale = useSettingsStore((s) => s.locale);
  return (key: TranslationKey, fallback?: string): string => {
    return translations[locale]?.[key] || translations.en[key] || fallback || key;
  };
}
