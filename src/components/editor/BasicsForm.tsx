import { useMemo } from 'react';
import { useResumeStore, activeSlot } from '@/store/resumeStore';
import { useT } from '@/i18n';
import { FormField } from './FormField';
import { RepeatableSection } from './RepeatableSection';
import { CountryPickerPopover } from '@/components/ui/CountryPickerPopover';
import { useCountries, detectCountryByPhone, flagUrl } from '@/hooks/useCountries';
import { NetworkPickerButton } from './networkIcons';
import { UrlField } from './UrlField';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { ChevronDownIcon } from '@/assets/Icons';

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

  return (
    <div className="space-y-4">
      <h3 className="text-text flex items-center gap-2 text-lg font-medium tracking-tighter capitalize">
        {t('basics.title')}
      </h3>
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
        <div className="space-y-1.5">
          <label className="text-text-secondary ml-1 block text-xs font-medium">
            {t('basics.phone')}
          </label>
          <PhoneInput
            value={basics.phone || ''}
            onChange={(v) => updateBasics('phone', v)}
            placeholder={t('ph.phone')}
            countryControl={
              <CountryPickerPopover onSelect={handlePhoneCountrySelect} showDialCode>
                <Button
                  variant="outline"
                  className="bg-bg-secondary group-focus-within:border-accent flex shrink-0 cursor-pointer items-center gap-1.5 rounded-r-none border-r-0 px-3 text-sm"
                  rightIcon={<ChevronDownIcon className="text-text-muted" />}
                >
                  {phoneCountry ? (
                    <img
                      src={flagUrl(phoneCountry.code)}
                      alt=""
                      width={20}
                      height={15}
                      className="shrink-0 rounded-[3px]"
                    />
                  ) : (
                    <span className="text-xs">🌐</span>
                  )}
                  <span className="text-text-muted text-xs font-bold">
                    {phoneCountry?.dialCode || '+'}
                  </span>
                </Button>
              </CountryPickerPopover>
            }
          />
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
            className="text-text-muted hover:text-accent mt-1 ml-1 inline-block text-[10px] font-bold tracking-widest uppercase transition-colors"
          >
            {t('url.uploadImage')} &rarr;
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

      <h3 className="text-text flex items-center gap-2 text-lg font-medium tracking-tighter capitalize">
        {t('basics.location')}
      </h3>
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
        <div className="space-y-1.5">
          <label className="text-text-secondary ml-1 block text-xs font-medium">
            {t('basics.countryCode')}
          </label>
          <CountryPickerPopover onSelect={(c) => updateBasicsLocation('countryCode', c.code)}>
            <Button
              variant="outline"
              fullWidth
              className="flex items-center justify-start gap-3 text-left"
            >
              {selectedCountry ? (
                <>
                  <img
                    src={flagUrl(selectedCountry.code)}
                    alt=""
                    width={20}
                    height={15}
                    className="shrink-0 rounded-[3px]"
                  />
                  <span className="flex-1 truncate font-medium">{selectedCountry.name}</span>
                  <Badge variant="default" className="px-2 py-0.5">
                    {selectedCountry.code}
                  </Badge>
                </>
              ) : (
                <span className="text-text-muted">{t('ph.countryCode')}</span>
              )}
            </Button>
          </CountryPickerPopover>
        </div>
        <FormField
          label={t('basics.postalCode')}
          value={basics.location?.postalCode || ''}
          onChange={(v) => updateBasicsLocation('postalCode', v)}
          placeholder={t('ph.postalCode')}
        />
      </div>

      <div className="pt-2">
        <RepeatableSection
          title={t('basics.profiles')}
          items={profiles}
          onChange={(items) => updateBasics('profiles', items)}
          defaultItem={{ network: '', username: '', url: '' }}
          renderItem={(item, index, update) => (
            <div className="space-y-3">
              <div className="flex items-end gap-4">
                <div className="space-y-1.5">
                  <label className="text-text-secondary ml-1 block text-xs font-medium">
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
    </div>
  );
}
