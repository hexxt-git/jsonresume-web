import { useState, useEffect } from 'react';

const CDN_URL = 'https://cdn.jsdelivr.net/npm/countries-list@3.1.1/countries.min.json';

export interface CountryData {
  code: string;
  name: string;
  dialCode: string;
}

/** Flag image URL from flagcdn.com (w20 = 20px wide). */
export function flagUrl(code: string, width = 20): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}

let cached: CountryData[] | null = null;

export function useCountries() {
  const [countries, setCountries] = useState<CountryData[]>(cached || []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return;
    fetch(CDN_URL)
      .then((r) => r.json())
      .then((data: Record<string, { name: string; phone: number[] }>) => {
        const list: CountryData[] = Object.entries(data)
          .map(([code, info]) => ({
            code,
            name: info.name,
            dialCode: info.phone?.length ? `+${info.phone[0]}` : '',
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        cached = list;
        setCountries(list);
      })
      .finally(() => setLoading(false));
  }, []);

  return { countries, loading };
}

/** Find the country matching a phone number's dial code prefix (longest match wins). */
export function detectCountryByPhone(phone: string, countries: CountryData[]): CountryData | null {
  if (!phone.startsWith('+')) return null;
  const digits = '+' + phone.slice(1).replace(/\D/g, '');
  let best: CountryData | null = null;
  for (const c of countries) {
    if (!c.dialCode) continue;
    if (digits.startsWith(c.dialCode) && (!best || c.dialCode.length > best.dialCode.length)) {
      best = c;
    }
  }
  return best;
}
