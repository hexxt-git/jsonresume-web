interface Props {
  html: string;
  title: string;
}

export function ResumePreviewThumbnail({ html, title }: Props) {
  return (
    <div className="relative w-full h-48 overflow-hidden bg-white flex items-start justify-center">
      <iframe
        srcDoc={html}
        title={title}
        className="w-[794px] h-[700px] border-0 pointer-events-none shrink-0"
        style={{ transform: 'scale(0.42)', transformOrigin: 'top center' }}
        tabIndex={-1}
      />
    </div>
  );
}
