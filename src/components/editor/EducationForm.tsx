import { useResumeStore } from '../../store/resumeStore';
import { FormField } from './FormField';
import { ChipInput } from './ChipInput';
import { RepeatableSection } from './RepeatableSection';

export function EducationForm() {
  const education = useResumeStore((s) => s.resume.education) || [];
  const updateArraySection = useResumeStore((s) => s.updateArraySection);

  return (
    <RepeatableSection
      title="Education"
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
            label="Institution"
            value={item.institution || ''}
            onChange={(v) => update(index, { ...item, institution: v })}
            placeholder="MIT"
          />
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label="Degree"
              value={item.studyType || ''}
              onChange={(v) => update(index, { ...item, studyType: v })}
              placeholder="Bachelor's"
            />
            <FormField
              label="Field of Study"
              value={item.area || ''}
              onChange={(v) => update(index, { ...item, area: v })}
              placeholder="Computer Science"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <FormField
              label="Start Date"
              value={item.startDate || ''}
              onChange={(v) => update(index, { ...item, startDate: v })}
              placeholder="2018-09"
            />
            <FormField
              label="End Date"
              value={item.endDate || ''}
              onChange={(v) => update(index, { ...item, endDate: v })}
              placeholder="2022-06"
            />
            <FormField
              label="Score/GPA"
              value={item.score || ''}
              onChange={(v) => update(index, { ...item, score: v })}
              placeholder="3.8/4.0"
            />
          </div>
          <ChipInput
            label="Courses"
            items={item.courses || []}
            onChange={(v) => update(index, { ...item, courses: v })}
            placeholder="Add a course"
          />
        </div>
      )}
    />
  );
}
