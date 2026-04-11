import { useMemo } from 'react';
import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { useT } from '../../i18n';
import { FormField } from './FormField';
import { RepeatableSection } from './RepeatableSection';
import { CountryPickerPopover } from '../ui/CountryPickerPopover';
import { useCountries, detectCountryByPhone, flagUrl } from '../../hooks/useCountries';
import { NetworkPickerButton } from './networkIcons';
import { UrlField } from './UrlField';

export function BasicsForm() {
  const t = useT();
  const basics = useResumeStore((s) => activeSlot(s).resume.basics) ?? {};
  const updateBasics = useResumeStore((s) => s.updateBasics);
  const updateBasicsLocation = useResumeStore((s) => s.updateBasicsLocation);
  const profiles = basics.profiles || [];

  const { countries } = useCountries();
  const selectedCountry = useMemo(
    () => countries.find((c) => c.code === (basics.location?.countryCode || '').toUpperCase()),
    [countries, basics.location?.countryCode],
  );
  const phoneCountry = useMemo(
    () => detectCountryByPhone(basics.phone || '', countries),
    [countries, basics.phone],
  );

  const handlePhoneCountrySelect = (country: { dialCode: string }) => {
    const current = basics.phone || '';
    // Replace existing dial code prefix or prepend
    const local = phoneCountry
      ? current.slice(phoneCountry.dialCode.length).trimStart()
      : current.replace(/^\+[\d\s-]+/, '').trimStart();
    updateBasics('phone', local ? `${country.dialCode} ${local}` : country.dialCode);
  };

  const inputCls =
    'w-full px-3 py-1.5 text-sm border border-border-input bg-bg-input text-text rounded-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent';

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text">{t('basics.title')}</h3>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label={t('basics.name')}
          value={basics.name || ''}
          onChange={(v) => updateBasics('name', v)}
          placeholder={t('ph.name')}
        />
        <FormField
          label={t('basics.label')}
          value={basics.label || ''}
          onChange={(v) => updateBasics('label', v)}
          placeholder={t('ph.label')}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label={t('basics.email')}
          value={basics.email || ''}
          onChange={(v) => updateBasics('email', v)}
          type="email"
          placeholder={t('ph.email')}
        />
        {/* Phone with dial code picker */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            {t('basics.phone')}
          </label>
          <div className="flex">
            <CountryPickerPopover onSelect={handlePhoneCountrySelect} showDialCode>
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1.5 text-sm border border-border-input border-r-0
                  bg-bg-input rounded-l-md hover:bg-bg-hover shrink-0 cursor-pointer"
              >
                {phoneCountry ? (
                  <img
                    src={flagUrl(phoneCountry.code)}
                    alt=""
                    width={20}
                    height={15}
                    className="shrink-0 rounded-[2px]"
                  />
                ) : (
                  <span className="text-xs">🌐</span>
                )}
                <span className="text-xs text-text-muted">{phoneCountry?.dialCode || '+'}</span>
                <ChevronDown />
              </button>
            </CountryPickerPopover>
            <input
              type="tel"
              value={basics.phone || ''}
              onChange={(e) => updateBasics('phone', e.target.value)}
              placeholder={t('ph.phone')}
              className={`flex-1 min-w-0 px-3 py-1.5 text-sm border border-border-input bg-bg-input text-text
                rounded-r-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent`}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <UrlField
          label={t('basics.url')}
          value={basics.url || ''}
          onChange={(v) => updateBasics('url', v)}
          placeholder={t('ph.url')}
        />
        <div>
          <UrlField
            label={t('basics.image')}
            value={basics.image || ''}
            onChange={(v) => updateBasics('image', v)}
            placeholder={t('ph.imageUrl')}
          />
          <a
            href="https://imgbb.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1 text-[10px] text-text-muted hover:text-accent-text"
          >
            Upload at imgbb.com &rarr;
          </a>
        </div>
      </div>
      <FormField
        label={t('basics.summary')}
        value={basics.summary || ''}
        onChange={(v) => updateBasics('summary', v)}
        multiline
        placeholder={t('ph.summary')}
      />

      <h3 className="text-sm font-semibold text-text pt-2">{t('basics.location')}</h3>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label={t('basics.city')}
          value={basics.location?.city || ''}
          onChange={(v) => updateBasicsLocation('city', v)}
          placeholder={t('ph.city')}
        />
        <FormField
          label={t('basics.region')}
          value={basics.location?.region || ''}
          onChange={(v) => updateBasicsLocation('region', v)}
          placeholder={t('ph.region')}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Country select with flag picker */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            {t('basics.countryCode')}
          </label>
          <CountryPickerPopover onSelect={(c) => updateBasicsLocation('countryCode', c.code)}>
            <button
              type="button"
              className={`${inputCls} flex items-center gap-2 text-left cursor-pointer`}
            >
              {selectedCountry ? (
                <>
                  <img
                    src={flagUrl(selectedCountry.code)}
                    alt=""
                    width={20}
                    height={15}
                    className="shrink-0 rounded-[2px]"
                  />
                  <span className="flex-1 truncate">{selectedCountry.name}</span>
                  <span className="text-text-muted text-xs">{selectedCountry.code}</span>
                </>
              ) : (
                <span className="text-text-muted">{t('ph.countryCode')}</span>
              )}
            </button>
          </CountryPickerPopover>
        </div>
        <FormField
          label={t('basics.postalCode')}
          value={basics.location?.postalCode || ''}
          onChange={(v) => updateBasicsLocation('postalCode', v)}
          placeholder={t('ph.postalCode')}
        />
      </div>

      <RepeatableSection
        title={t('basics.profiles')}
        items={profiles}
        onChange={(items) => updateBasics('profiles', items)}
        defaultItem={{ network: '', username: '', url: '' }}
        renderItem={(item, index, update) => (
          <div className="space-y-2">
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {t('basics.network')}
                </label>
                <NetworkPickerButton
                  value={item.network || ''}
                  onChange={(v) => update(index, { ...item, network: v })}
                />
              </div>
              <div className="flex-1">
                <FormField
                  label={t('basics.username')}
                  value={item.username || ''}
                  onChange={(v) => update(index, { ...item, username: v })}
                  placeholder={t('ph.username')}
                />
              </div>
            </div>
            <UrlField
              label="URL"
              value={item.url || ''}
              onChange={(v) => update(index, { ...item, url: v })}
              placeholder={t('ph.profileUrl')}
            />
          </div>
        )}
      />
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-text-muted"
    >
      <path d="M3 4.5L6 7.5L9 4.5" />
    </svg>
  );
}
