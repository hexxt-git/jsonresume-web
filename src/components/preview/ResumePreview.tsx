import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { getThemeById } from '../../themes';
import { buildCustomCss } from '../../store/themeCustomStore';

const A4_HEIGHT = 1123; // 297mm at 96dpi

export function ResumePreview() {
  const resume = useResumeStore((s) => s.resume);
  const themeId = useResumeStore((s) => s.selectedThemeId);
  const custom = useResumeStore((s) => s.customization);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  const html = useMemo(() => {
    const base = getThemeById(themeId).render(resume);
    const overrides = buildCustomCss(custom);
    if (!overrides) return base;
    return base.replace('</head>', `${overrides}</head>`);
  }, [resume, themeId, custom]);

  // Measure iframe content height to determine page count
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      try {
        const h = iframe.contentDocument?.documentElement?.scrollHeight || A4_HEIGHT;
        setPageCount(Math.ceil(h / A4_HEIGHT));
      } catch {
        /* cross-origin */
      }
    };
    iframe.addEventListener('load', onLoad);
    // Also re-measure when html changes
    onLoad();
    return () => iframe.removeEventListener('load', onLoad);
  }, [html]);

  const handlePrint = useCallback(() => {
    iframeRef.current?.contentWindow?.print();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-bg-secondary shrink-0">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Preview</span>
        <button
          onClick={handlePrint}
          className="text-xs px-3 py-1 bg-accent text-white rounded hover:opacity-90 transition-colors cursor-pointer"
        >
          Print / PDF
        </button>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto bg-bg-tertiary relative">
        <div className="relative" style={{ height: pageCount * A4_HEIGHT }}>
          <iframe
            ref={iframeRef}
            srcDoc={html}
            className="w-full border-0 bg-white absolute inset-0"
            style={{ height: pageCount * A4_HEIGHT }}
            title="Resume Preview"
            sandbox="allow-same-origin allow-modals"
          />
          {/* Page break guides */}
          {Array.from({ length: pageCount - 1 }, (_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 pointer-events-none"
              style={{ top: (i + 1) * A4_HEIGHT }}
            >
              <div className="border-t border-dashed border-text-muted opacity-40" />
              <span className="absolute right-2 -top-4 text-[11px] text-text-muted opacity-40 select-none">
                page break
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
