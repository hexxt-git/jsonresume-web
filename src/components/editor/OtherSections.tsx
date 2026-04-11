import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { useT } from '../../i18n';
import { FormField } from './FormField';
import { ChipInput } from './ChipInput';
import { RepeatableSection } from './RepeatableSection';

export function VolunteerForm() {
  const t = useT();
  const items = useResumeStore((s) => activeSlot(s).resume.volunteer) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title={t('volunteer.title')}
      items={items}
      onChange={(v) => update('volunteer', v)}
      defaultItem={{ organization: '', position: '', startDate: '', endDate: '', highlights: [] }}
      renderItem={(item, i, upd) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label={t('volunteer.organization')}
              value={item.organization || ''}
              onChange={(v) => upd(i, { ...item, organization: v })}
              placeholder={t('ph.organization')}
            />
            <FormField
              label={t('volunteer.position')}
              value={item.position || ''}
              onChange={(v) => upd(i, { ...item, position: v })}
              placeholder={t('ph.volunteer')}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label={t('work.startDate')}
              value={item.startDate || ''}
              onChange={(v) => upd(i, { ...item, startDate: v })}
              placeholder={t('ph.startDate')}
            />
            <FormField
              label={t('work.endDate')}
              value={item.endDate || ''}
              onChange={(v) => upd(i, { ...item, endDate: v })}
              placeholder={t('ph.endDate')}
            />
          </div>
          <FormField
            label={t('work.url')}
            value={item.url || ''}
            onChange={(v) => upd(i, { ...item, url: v })}
            placeholder={t('ph.url')}
          />
          <FormField
            label={t('work.summary')}
            value={item.summary || ''}
            onChange={(v) => upd(i, { ...item, summary: v })}
            multiline
          />
          <ChipInput
            label={t('work.highlights')}
            items={item.highlights || []}
            onChange={(v) => upd(i, { ...item, highlights: v })}
          />
        </div>
      )}
    />
  );
}

export function AwardsForm() {
  const t = useT();
  const items = useResumeStore((s) => activeSlot(s).resume.awards) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title={t('awards.title')}
      items={items}
      onChange={(v) => update('awards', v)}
      defaultItem={{ title: '', awarder: '', date: '', summary: '' }}
      renderItem={(item, i, upd) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label={t('awards.name')}
              value={item.title || ''}
              onChange={(v) => upd(i, { ...item, title: v })}
              placeholder={t('ph.awardTitle')}
            />
            <FormField
              label={t('awards.awarder')}
              value={item.awarder || ''}
              onChange={(v) => upd(i, { ...item, awarder: v })}
              placeholder={t('ph.awarder')}
            />
          </div>
          <FormField
            label={t('awards.date')}
            value={item.date || ''}
            onChange={(v) => upd(i, { ...item, date: v })}
            placeholder={t('ph.date')}
          />
          <FormField
            label={t('awards.summary')}
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
  const t = useT();
  const items = useResumeStore((s) => activeSlot(s).resume.certificates) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title={t('certs.title')}
      items={items}
      onChange={(v) => update('certificates', v)}
      defaultItem={{ name: '', issuer: '', date: '', url: '' }}
      renderItem={(item, i, upd) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label={t('certs.name')}
              value={item.name || ''}
              onChange={(v) => upd(i, { ...item, name: v })}
              placeholder={t('ph.certName')}
            />
            <FormField
              label={t('certs.issuer')}
              value={item.issuer || ''}
              onChange={(v) => upd(i, { ...item, issuer: v })}
              placeholder={t('ph.certIssuer')}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label={t('certs.date')}
              value={item.date || ''}
              onChange={(v) => upd(i, { ...item, date: v })}
              placeholder={t('ph.date')}
            />
            <FormField
              label={t('certs.url')}
              value={item.url || ''}
              onChange={(v) => upd(i, { ...item, url: v })}
              placeholder={t('ph.certUrl')}
            />
          </div>
        </div>
      )}
    />
  );
}

export function PublicationsForm() {
  const t = useT();
  const items = useResumeStore((s) => activeSlot(s).resume.publications) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title={t('pubs.title')}
      items={items}
      onChange={(v) => update('publications', v)}
      defaultItem={{ name: '', publisher: '', releaseDate: '', url: '', summary: '' }}
      renderItem={(item, i, upd) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label={t('pubs.name')}
              value={item.name || ''}
              onChange={(v) => upd(i, { ...item, name: v })}
              placeholder={t('ph.pubTitle')}
            />
            <FormField
              label={t('pubs.publisher')}
              value={item.publisher || ''}
              onChange={(v) => upd(i, { ...item, publisher: v })}
              placeholder={t('ph.publisher')}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label={t('pubs.releaseDate')}
              value={item.releaseDate || ''}
              onChange={(v) => upd(i, { ...item, releaseDate: v })}
              placeholder={t('ph.date')}
            />
            <FormField
              label={t('pubs.url')}
              value={item.url || ''}
              onChange={(v) => upd(i, { ...item, url: v })}
            />
          </div>
          <FormField
            label={t('pubs.summary')}
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
  const t = useT();
  const items = useResumeStore((s) => activeSlot(s).resume.languages) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title={t('langs.title')}
      items={items}
      onChange={(v) => update('languages', v)}
      defaultItem={{ language: '', fluency: '' }}
      renderItem={(item, i, upd) => (
        <div className="grid grid-cols-2 gap-2">
          <FormField
            label={t('langs.language')}
            value={item.language || ''}
            onChange={(v) => upd(i, { ...item, language: v })}
            placeholder={t('ph.language')}
          />
          <FormField
            label={t('langs.fluency')}
            value={item.fluency || ''}
            onChange={(v) => upd(i, { ...item, fluency: v })}
            placeholder={t('ph.fluency')}
          />
        </div>
      )}
    />
  );
}

export function InterestsForm() {
  const t = useT();
  const items = useResumeStore((s) => activeSlot(s).resume.interests) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title={t('interests.title')}
      items={items}
      onChange={(v) => update('interests', v)}
      defaultItem={{ name: '', keywords: [] }}
      renderItem={(item, i, upd) => (
        <div className="space-y-2">
          <FormField
            label={t('interests.name')}
            value={item.name || ''}
            onChange={(v) => upd(i, { ...item, name: v })}
            placeholder={t('ph.interestName')}
          />
          <ChipInput
            label={t('interests.keywords')}
            items={item.keywords || []}
            onChange={(v) => upd(i, { ...item, keywords: v })}
          />
        </div>
      )}
    />
  );
}

export function ReferencesForm() {
  const t = useT();
  const items = useResumeStore((s) => activeSlot(s).resume.references) || [];
  const update = useResumeStore((s) => s.updateArraySection);
  return (
    <RepeatableSection
      title={t('refs.title')}
      items={items}
      onChange={(v) => update('references', v)}
      defaultItem={{ name: '', reference: '' }}
      renderItem={(item, i, upd) => (
        <div className="space-y-2">
          <FormField
            label={t('refs.name')}
            value={item.name || ''}
            onChange={(v) => upd(i, { ...item, name: v })}
            placeholder={t('ph.refName')}
          />
          <FormField
            label={t('refs.reference')}
            value={item.reference || ''}
            onChange={(v) => upd(i, { ...item, reference: v })}
            multiline
            placeholder={t('ph.refText')}
          />
        </div>
      )}
    />
  );
}
