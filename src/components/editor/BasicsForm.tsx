import { useResumeStore } from '../../store/resumeStore';
import { useT } from '../../i18n';
import { FormField } from './FormField';
import { RepeatableSection } from './RepeatableSection';

export function BasicsForm() {
  const t = useT();
  const basics = useResumeStore((s) => s.resume.basics) || {};
  const updateBasics = useResumeStore((s) => s.updateBasics);
  const updateBasicsLocation = useResumeStore((s) => s.updateBasicsLocation);
  const profiles = basics.profiles || [];

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
        <FormField
          label={t('basics.phone')}
          value={basics.phone || ''}
          onChange={(v) => updateBasics('phone', v)}
          type="tel"
          placeholder={t('ph.phone')}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label={t('basics.url')}
          value={basics.url || ''}
          onChange={(v) => updateBasics('url', v)}
          placeholder={t('ph.url')}
        />
        <FormField
          label={t('basics.image')}
          value={basics.image || ''}
          onChange={(v) => updateBasics('image', v)}
          placeholder={t('ph.imageUrl')}
        />
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
        <FormField
          label={t('basics.countryCode')}
          value={basics.location?.countryCode || ''}
          onChange={(v) => updateBasicsLocation('countryCode', v)}
          placeholder={t('ph.countryCode')}
        />
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
          <div className="grid grid-cols-3 gap-2">
            <FormField
              label={t('basics.network')}
              value={item.network || ''}
              onChange={(v) => update(index, { ...item, network: v })}
              placeholder={t('ph.network')}
            />
            <FormField
              label={t('basics.username')}
              value={item.username || ''}
              onChange={(v) => update(index, { ...item, username: v })}
              placeholder={t('ph.username')}
            />
            <FormField
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
