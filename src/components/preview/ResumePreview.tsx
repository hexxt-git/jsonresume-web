import { useMemo, useRef, useCallback } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { getThemeById } from '../../themes';

export function ResumePreview() {
  const resume = useResumeStore((s) => s.resume);
  const themeId = useResumeStore((s) => s.selectedThemeId);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const html = useMemo(() => {
    const theme = getThemeById(themeId);
    return theme.render(resume);
  }, [resume, themeId]);

  const handlePrint = useCallback(() => {
    iframeRef.current?.contentWindow?.print();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</span>
        <button
          onClick={handlePrint}
          className="text-xs px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer"
        >
          Print / PDF
        </button>
      </div>
      <div className="flex-1 overflow-hidden bg-gray-100">
        <iframe
          ref={iframeRef}
          srcDoc={html}
          className="w-full h-full border-0"
          title="Resume Preview"
          sandbox="allow-same-origin allow-modals"
        />
      </div>
    </div>
  );
}
