import { useResumeStore } from '../../store/resumeStore';
import { FormField } from './FormField';
import { ChipInput } from './ChipInput';
import { RepeatableSection } from './RepeatableSection';

export function WorkForm() {
  const work = useResumeStore((s) => s.resume.work) || [];
  const updateArraySection = useResumeStore((s) => s.updateArraySection);

  return (
    <RepeatableSection
      title="Work Experience"
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
              label="Position"
              value={item.position || ''}
              onChange={(v) => update(index, { ...item, position: v })}
              placeholder="Software Engineer"
            />
            <FormField
              label="Company"
              value={item.name || ''}
              onChange={(v) => update(index, { ...item, name: v })}
              placeholder="Acme Corp"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <FormField
              label="Start Date"
              value={item.startDate || ''}
              onChange={(v) => update(index, { ...item, startDate: v })}
              placeholder="2024-01"
            />
            <FormField
              label="End Date"
              value={item.endDate || ''}
              onChange={(v) => update(index, { ...item, endDate: v })}
              placeholder="2025-06 or empty for Present"
            />
            <FormField
              label="Location"
              value={item.location || ''}
              onChange={(v) => update(index, { ...item, location: v })}
              placeholder="San Francisco, CA"
            />
          </div>
          <FormField
            label="URL"
            value={item.url || ''}
            onChange={(v) => update(index, { ...item, url: v })}
            placeholder="https://company.com"
          />
          <FormField
            label="Summary"
            value={item.summary || ''}
            onChange={(v) => update(index, { ...item, summary: v })}
            multiline
            placeholder="Brief description of role"
          />
          <ChipInput
            label="Highlights"
            items={item.highlights || []}
            onChange={(v) => update(index, { ...item, highlights: v })}
            placeholder="Add an accomplishment"
          />
        </div>
      )}
    />
  );
}
