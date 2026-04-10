import { useResumeStore } from '../../store/resumeStore';
import { FormField } from './FormField';
import { ChipInput } from './ChipInput';
import { RepeatableSection } from './RepeatableSection';

export function SkillsForm() {
  const skills = useResumeStore((s) => s.resume.skills) || [];
  const updateArraySection = useResumeStore((s) => s.updateArraySection);

  return (
    <RepeatableSection
      title="Skills"
      items={skills}
      onChange={(items) => updateArraySection('skills', items)}
      defaultItem={{ name: '', level: '', keywords: [] }}
      renderItem={(item, index, update) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label="Category"
              value={item.name || ''}
              onChange={(v) => update(index, { ...item, name: v })}
              placeholder="Frontend"
            />
            <FormField
              label="Level"
              value={item.level || ''}
              onChange={(v) => update(index, { ...item, level: v })}
              placeholder="Advanced"
            />
          </div>
          <ChipInput
            label="Keywords"
            items={item.keywords || []}
            onChange={(v) => update(index, { ...item, keywords: v })}
            placeholder="Add a skill"
          />
        </div>
      )}
    />
  );
}
