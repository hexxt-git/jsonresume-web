import { useResumeStore } from '../../store/resumeStore';
import { useT } from '../../i18n';
import { FormField } from './FormField';
import { ChipInput } from './ChipInput';
import { RepeatableSection } from './RepeatableSection';

export function WorkForm() {
  const t = useT();
  const work = useResumeStore((s) => s.resume.work) || [];
  const updateArraySection = useResumeStore((s) => s.updateArraySection);

  return (
    <RepeatableSection
      title={t('work.title')}
      items={work}
      onChange={(items) => updateArraySection('work', items)}
      defaultItem={{
        name: '',
        position: '',
        startDate: '',
        endDate: '',
        location: '',
        highlights: [],
      }}
      renderItem={(item, index, update) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label={t('work.position')}
              value={item.position || ''}
              onChange={(v) => update(index, { ...item, position: v })}
              placeholder={t('ph.position')}
            />
            <FormField
              label={t('work.company')}
              value={item.name || ''}
              onChange={(v) => update(index, { ...item, name: v })}
              placeholder={t('ph.company')}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <FormField
              label={t('work.startDate')}
              value={item.startDate || ''}
              onChange={(v) => update(index, { ...item, startDate: v })}
              placeholder={t('ph.startDate')}
            />
            <FormField
              label={t('work.endDate')}
              value={item.endDate || ''}
              onChange={(v) => update(index, { ...item, endDate: v })}
              placeholder={t('ph.endDateHint')}
            />
            <FormField
              label={t('work.location')}
              value={item.location || ''}
              onChange={(v) => update(index, { ...item, location: v })}
              placeholder={t('ph.location')}
            />
          </div>
          <FormField
            label={t('work.url')}
            value={item.url || ''}
            onChange={(v) => update(index, { ...item, url: v })}
            placeholder={t('ph.companyUrl')}
          />
          <FormField
            label={t('work.summary')}
            value={item.summary || ''}
            onChange={(v) => update(index, { ...item, summary: v })}
            multiline
            placeholder={t('ph.roleSummary')}
          />
          <ChipInput
            label={t('work.highlights')}
            items={item.highlights || []}
            onChange={(v) => update(index, { ...item, highlights: v })}
            placeholder={t('ph.highlight')}
          />
        </div>
      )}
    />
  );
}
