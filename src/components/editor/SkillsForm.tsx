import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { useT } from '../../i18n';
import { FormField } from './FormField';
import { ChipInput } from './ChipInput';
import { RepeatableSection } from './RepeatableSection';
import { ComboField, SKILL_LEVEL_OPTIONS } from './ComboField';

export function SkillsForm() {
  const t = useT();
  const skills = useResumeStore((s) => activeSlot(s).resume.skills) ?? [];
  const updateArraySection = useResumeStore((s) => s.updateArraySection);

  return (
    <RepeatableSection
      title={t('skills.title')}
      items={skills}
      onChange={(items) => updateArraySection('skills', items)}
      defaultItem={{ name: '', level: '', keywords: [] }}
      entryLabel={(item) => item.name || 'Skill'}
      renderItem={(item, index, update) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label={t('skills.category')}
              value={item.name || ''}
              onChange={(v) => update(index, { ...item, name: v })}
              placeholder={t('ph.skillCategory')}
            />
            <ComboField
              label={t('skills.level')}
              value={item.level || ''}
              onChange={(v) => update(index, { ...item, level: v })}
              options={SKILL_LEVEL_OPTIONS}
              placeholder={t('ph.skillLevel')}
            />
          </div>
          <ChipInput
            label={t('skills.keywords')}
            items={item.keywords || []}
            onChange={(v) => update(index, { ...item, keywords: v })}
            placeholder={t('ph.skill')}
          />
        </div>
      )}
    />
  );
}
