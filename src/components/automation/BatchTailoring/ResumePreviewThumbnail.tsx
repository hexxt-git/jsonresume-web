interface Props {
  html: string;
  title: string;
}

export function ResumePreviewThumbnail({ html, title }: Props) {
  return (
    <div className="relative flex h-48 w-full items-start justify-center overflow-hidden bg-white">
      <iframe
        srcDoc={html}
        title={title}
        className="pointer-events-none h-[700px] w-[794px] shrink-0 border-0"
        style={{ transform: 'scale(0.42)', transformOrigin: 'top center' }}
        tabIndex={-1}
      />
    </div>
  );
}
