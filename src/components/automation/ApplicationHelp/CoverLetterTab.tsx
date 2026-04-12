import { CopyableOutput } from '../shared/CopyableOutput';

export function CoverLetterTab({ content }: { content: string }) {
  if (!content) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-text-tertiary">
          A cover letter introduces you to the employer, highlights your fit for the role, and shows
          personality beyond your resume. Click generate below to create one tailored to the job.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CopyableOutput content={content} label="Cover Letter" />
    </div>
  );
}
