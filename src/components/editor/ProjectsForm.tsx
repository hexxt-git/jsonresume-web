import { useResumeStore } from '../../store/resumeStore';
import { FormField } from './FormField';
import { ChipInput } from './ChipInput';
import { RepeatableSection } from './RepeatableSection';

export function ProjectsForm() {
  const projects = useResumeStore((s) => s.resume.projects) || [];
  const updateArraySection = useResumeStore((s) => s.updateArraySection);

  return (
    <RepeatableSection
      title="Projects"
      items={projects}
      onChange={(items) => updateArraySection('projects', items)}
      defaultItem={{ name: '', url: '', description: '', highlights: [], keywords: [] }}
      renderItem={(item, index, update) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label="Name"
              value={item.name || ''}
              onChange={(v) => update(index, { ...item, name: v })}
              placeholder="My Project"
            />
            <FormField
              label="URL"
              value={item.url || ''}
              onChange={(v) => update(index, { ...item, url: v })}
              placeholder="https://github.com/..."
            />
          </div>
          <FormField
            label="Description"
            value={item.description || ''}
            onChange={(v) => update(index, { ...item, description: v })}
            multiline
            placeholder="What the project does"
          />
          <div className="grid grid-cols-2 gap-2">
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
              placeholder="2024-06"
            />
          </div>
          <ChipInput
            label="Highlights"
            items={item.highlights || []}
            onChange={(v) => update(index, { ...item, highlights: v })}
            placeholder="Add a highlight"
          />
          <ChipInput
            label="Keywords"
            items={item.keywords || []}
            onChange={(v) => update(index, { ...item, keywords: v })}
            placeholder="Add a technology"
          />
        </div>
      )}
    />
  );
}
