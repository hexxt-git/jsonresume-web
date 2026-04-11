import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { useT } from '../../i18n';
import { FormField } from './FormField';
import { ChipInput } from './ChipInput';
import { RepeatableSection } from './RepeatableSection';

export function EducationForm() {
  const t = useT();
  const education = useResumeStore((s) => activeSlot(s).resume.education) ?? [];
  const updateArraySection = useResumeStore((s) => s.updateArraySection);

  return (
    <RepeatableSection
      title={t('edu.title')}
      items={education}
      onChange={(items) => updateArraySection('education', items)}
      defaultItem={{
        institution: '',
        studyType: '',
        area: '',
        startDate: '',
        endDate: '',
        score: '',
        courses: [],
      }}
      renderItem={(item, index, update) => (
        <div className="space-y-2">
          <FormField
            label={t('edu.institution')}
            value={item.institution || ''}
            onChange={(v) => update(index, { ...item, institution: v })}
            placeholder={t('ph.institution')}
          />
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label={t('edu.degree')}
              value={item.studyType || ''}
              onChange={(v) => update(index, { ...item, studyType: v })}
              placeholder={t('ph.degree')}
            />
            <FormField
              label={t('edu.area')}
              value={item.area || ''}
              onChange={(v) => update(index, { ...item, area: v })}
              placeholder={t('ph.area')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <FormField
              label={t('edu.startDate')}
              value={item.startDate || ''}
              onChange={(v) => update(index, { ...item, startDate: v })}
              placeholder={t('ph.startDate')}
            />
            <FormField
              label={t('edu.endDate')}
              value={item.endDate || ''}
              onChange={(v) => update(index, { ...item, endDate: v })}
              placeholder={t('ph.endDate')}
            />
            <FormField
              label={t('edu.score')}
              value={item.score || ''}
              onChange={(v) => update(index, { ...item, score: v })}
              placeholder={t('ph.score')}
            />
          </div>
          <ChipInput
            label={t('edu.courses')}
            items={item.courses || []}
            onChange={(v) => update(index, { ...item, courses: v })}
            placeholder={t('ph.course')}
          />
        </div>
      )}
    />
  );
}
