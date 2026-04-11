import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { useT } from '../../i18n';
import { FormField } from './FormField';
import { ChipInput } from './ChipInput';
import { RepeatableSection } from './RepeatableSection';
import { UrlField } from './UrlField';

export function ProjectsForm() {
  const t = useT();
  const projects = useResumeStore((s) => activeSlot(s).resume.projects) ?? [];
  const updateArraySection = useResumeStore((s) => s.updateArraySection);

  return (
    <RepeatableSection
      title={t('projects.title')}
      items={projects}
      onChange={(items) => updateArraySection('projects', items)}
      defaultItem={{ name: '', url: '', description: '', highlights: [], keywords: [] }}
      entryLabel={(item) => item.name || 'Project'}
      renderItem={(item, index, update) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label={t('projects.name')}
              value={item.name || ''}
              onChange={(v) => update(index, { ...item, name: v })}
              placeholder={t('ph.projectName')}
            />
            <UrlField
              label={t('projects.url')}
              value={item.url || ''}
              onChange={(v) => update(index, { ...item, url: v })}
              placeholder={t('ph.projectUrl')}
            />
          </div>
          <FormField
            label={t('projects.description')}
            value={item.description || ''}
            onChange={(v) => update(index, { ...item, description: v })}
            multiline
            placeholder={t('ph.projectDesc')}
          />
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label={t('projects.startDate')}
              value={item.startDate || ''}
              onChange={(v) => update(index, { ...item, startDate: v })}
              placeholder={t('ph.startDate')}
            />
            <FormField
              label={t('projects.endDate')}
              value={item.endDate || ''}
              onChange={(v) => update(index, { ...item, endDate: v })}
              placeholder={t('ph.endDate')}
            />
          </div>
          <ChipInput
            label={t('projects.highlights')}
            items={item.highlights || []}
            onChange={(v) => update(index, { ...item, highlights: v })}
            placeholder={t('ph.projectHighlight')}
          />
          <ChipInput
            label={t('projects.keywords')}
            items={item.keywords || []}
            onChange={(v) => update(index, { ...item, keywords: v })}
            placeholder={t('ph.projectKeyword')}
          />
        </div>
      )}
    />
  );
}
