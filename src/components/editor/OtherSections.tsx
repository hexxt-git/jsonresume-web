import { useResumeStore } from '../../store/resumeStore';
import { FormField } from './FormField';
import { ChipInput } from './ChipInput';
import { RepeatableSection } from './RepeatableSection';

export function VolunteerForm() {
  const items = useResumeStore((s) => s.resume.volunteer) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title="Volunteer"
      items={items}
      onChange={(v) => update('volunteer', v)}
      defaultItem={{ organization: '', position: '', startDate: '', endDate: '', highlights: [] }}
      renderItem={(item, i, upd) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label="Organization"
              value={item.organization || ''}
              onChange={(v) => upd(i, { ...item, organization: v })}
              placeholder="Red Cross"
            />
            <FormField
              label="Position"
              value={item.position || ''}
              onChange={(v) => upd(i, { ...item, position: v })}
              placeholder="Volunteer"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label="Start Date"
              value={item.startDate || ''}
              onChange={(v) => upd(i, { ...item, startDate: v })}
              placeholder="2024-01"
            />
            <FormField
              label="End Date"
              value={item.endDate || ''}
              onChange={(v) => upd(i, { ...item, endDate: v })}
              placeholder="2024-06"
            />
          </div>
          <FormField
            label="URL"
            value={item.url || ''}
            onChange={(v) => upd(i, { ...item, url: v })}
            placeholder="https://org.com"
          />
          <FormField
            label="Summary"
            value={item.summary || ''}
            onChange={(v) => upd(i, { ...item, summary: v })}
            multiline
          />
          <ChipInput
            label="Highlights"
            items={item.highlights || []}
            onChange={(v) => upd(i, { ...item, highlights: v })}
          />
        </div>
      )}
    />
  );
}

export function AwardsForm() {
  const items = useResumeStore((s) => s.resume.awards) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title="Awards"
      items={items}
      onChange={(v) => update('awards', v)}
      defaultItem={{ title: '', awarder: '', date: '', summary: '' }}
      renderItem={(item, i, upd) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label="Title"
              value={item.title || ''}
              onChange={(v) => upd(i, { ...item, title: v })}
              placeholder="Best Paper Award"
            />
            <FormField
              label="Awarder"
              value={item.awarder || ''}
              onChange={(v) => upd(i, { ...item, awarder: v })}
              placeholder="IEEE"
            />
          </div>
          <FormField
            label="Date"
            value={item.date || ''}
            onChange={(v) => upd(i, { ...item, date: v })}
            placeholder="2024-06"
          />
          <FormField
            label="Summary"
            value={item.summary || ''}
            onChange={(v) => upd(i, { ...item, summary: v })}
            multiline
          />
        </div>
      )}
    />
  );
}

export function CertificatesForm() {
  const items = useResumeStore((s) => s.resume.certificates) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title="Certificates"
      items={items}
      onChange={(v) => update('certificates', v)}
      defaultItem={{ name: '', issuer: '', date: '', url: '' }}
      renderItem={(item, i, upd) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label="Name"
              value={item.name || ''}
              onChange={(v) => upd(i, { ...item, name: v })}
              placeholder="AWS Certified"
            />
            <FormField
              label="Issuer"
              value={item.issuer || ''}
              onChange={(v) => upd(i, { ...item, issuer: v })}
              placeholder="Amazon"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label="Date"
              value={item.date || ''}
              onChange={(v) => upd(i, { ...item, date: v })}
              placeholder="2024-03"
            />
            <FormField
              label="URL"
              value={item.url || ''}
              onChange={(v) => upd(i, { ...item, url: v })}
              placeholder="https://cert.url"
            />
          </div>
        </div>
      )}
    />
  );
}

export function PublicationsForm() {
  const items = useResumeStore((s) => s.resume.publications) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title="Publications"
      items={items}
      onChange={(v) => update('publications', v)}
      defaultItem={{ name: '', publisher: '', releaseDate: '', url: '', summary: '' }}
      renderItem={(item, i, upd) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label="Title"
              value={item.name || ''}
              onChange={(v) => upd(i, { ...item, name: v })}
              placeholder="Paper Title"
            />
            <FormField
              label="Publisher"
              value={item.publisher || ''}
              onChange={(v) => upd(i, { ...item, publisher: v })}
              placeholder="IEEE"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label="Release Date"
              value={item.releaseDate || ''}
              onChange={(v) => upd(i, { ...item, releaseDate: v })}
              placeholder="2024-06"
            />
            <FormField
              label="URL"
              value={item.url || ''}
              onChange={(v) => upd(i, { ...item, url: v })}
            />
          </div>
          <FormField
            label="Summary"
            value={item.summary || ''}
            onChange={(v) => upd(i, { ...item, summary: v })}
            multiline
          />
        </div>
      )}
    />
  );
}

export function LanguagesForm() {
  const items = useResumeStore((s) => s.resume.languages) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title="Languages"
      items={items}
      onChange={(v) => update('languages', v)}
      defaultItem={{ language: '', fluency: '' }}
      renderItem={(item, i, upd) => (
        <div className="grid grid-cols-2 gap-2">
          <FormField
            label="Language"
            value={item.language || ''}
            onChange={(v) => upd(i, { ...item, language: v })}
            placeholder="English"
          />
          <FormField
            label="Fluency"
            value={item.fluency || ''}
            onChange={(v) => upd(i, { ...item, fluency: v })}
            placeholder="Native"
          />
        </div>
      )}
    />
  );
}

export function InterestsForm() {
  const items = useResumeStore((s) => s.resume.interests) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title="Interests"
      items={items}
      onChange={(v) => update('interests', v)}
      defaultItem={{ name: '', keywords: [] }}
      renderItem={(item, i, upd) => (
        <div className="space-y-2">
          <FormField
            label="Name"
            value={item.name || ''}
            onChange={(v) => upd(i, { ...item, name: v })}
            placeholder="Open Source"
          />
          <ChipInput
            label="Keywords"
            items={item.keywords || []}
            onChange={(v) => upd(i, { ...item, keywords: v })}
          />
        </div>
      )}
    />
  );
}

export function ReferencesForm() {
  const items = useResumeStore((s) => s.resume.references) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title="References"
      items={items}
      onChange={(v) => update('references', v)}
      defaultItem={{ name: '', reference: '' }}
      renderItem={(item, i, upd) => (
        <div className="space-y-2">
          <FormField
            label="Name"
            value={item.name || ''}
            onChange={(v) => upd(i, { ...item, name: v })}
            placeholder="Jane Smith"
          />
          <FormField
            label="Reference"
            value={item.reference || ''}
            onChange={(v) => upd(i, { ...item, reference: v })}
            multiline
            placeholder="What they said about you"
          />
        </div>
      )}
    />
  );
}
