import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { getThemeById } from '../../themes';
import { buildCustomCss } from '../../store/themeCustomStore';
import { useT } from '../../i18n';

const A4_HEIGHT = 1123; // 297mm at 96dpi
const A4_WIDTH = 794; // 210mm at 96dpi
const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 2];

export function ResumePreview() {
  const t = useT();
  const resume = useResumeStore((s) => s.resume);
  const themeId = useResumeStore((s) => s.selectedThemeId);
  const custom = useResumeStore((s) => s.customization);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState(1);

  const html = useMemo(() => {
    const base = getThemeById(themeId).render(resume);
    const overrides = buildCustomCss(custom);
    if (!overrides) return base;
    return base.replace('</head>', `${overrides}</head>`);
  }, [resume, themeId, custom]);

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
    onLoad();
    return () => iframe.removeEventListener('load', onLoad);
  }, [html]);

  const fitZoom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return 1;
    return Math.round(Math.min((container.clientWidth - 32) / A4_WIDTH, 1) * 100) / 100;
  }, []);

  // Auto-fit zoom to container width on mount and when container becomes visible (mobile tab switch)
  useEffect(() => {
    setZoom(fitZoom());

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    let timer: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => setZoom(fitZoom()), 300);
    });
    ro.observe(container);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [fitZoom]);

  const handlePrint = useCallback(() => {
    iframeRef.current?.contentWindow?.print();
  }, []);

  const zoomIn = () => {
    const next = ZOOM_STEPS.find((s) => s > zoom);
    if (next) setZoom(next);
  };

  const zoomOut = () => {
    const next = [...ZOOM_STEPS].reverse().find((s) => s < zoom);
    if (next) setZoom(next);
  };

  // Ctrl/Cmd + scroll to zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    };
    container.addEventListener('wheel', handler, { passive: false });
    return () => container.removeEventListener('wheel', handler);
  });

  const contentHeight = pageCount * A4_HEIGHT;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-bg-secondary shrink-0">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {t('app.preview')}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={zoom <= ZOOM_STEPS[0]}
            className="w-6 h-6 flex items-center justify-center text-xs text-text-muted hover:text-text-secondary hover:bg-bg-hover rounded cursor-pointer disabled:opacity-30 disabled:cursor-default"
            title="Zoom out"
          >
            &minus;
          </button>
          <button
            onClick={() => setZoom(fitZoom())}
            className="px-1.5 py-0.5 text-[10px] text-text-muted hover:text-text-secondary hover:bg-bg-hover rounded cursor-pointer tabular-nums min-w-[3rem] text-center"
            title="Fit to width"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom(1)}
            className={`px-1.5 py-0.5 text-[10px] rounded cursor-pointer ${zoom === 1 ? 'text-accent-text bg-bg-accent' : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'}`}
            title="Actual size"
          >
            1:1
          </button>
          <button
            onClick={zoomIn}
            disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            className="w-6 h-6 flex items-center justify-center text-xs text-text-muted hover:text-text-secondary hover:bg-bg-hover rounded cursor-pointer disabled:opacity-30 disabled:cursor-default"
            title="Zoom in"
          >
            +
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={handlePrint}
            className="text-xs px-3 py-1 bg-accent text-white rounded hover:opacity-90 transition-colors cursor-pointer"
          >
            {t('app.printPdf')}
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto bg-bg-tertiary">
        <div
          className="relative mx-auto"
          style={{
            width: A4_WIDTH * zoom,
            height: contentHeight * zoom,
            marginTop: 16,
            marginBottom: 16,
          }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={html}
            className="border-0 bg-white shadow-sm origin-top-left"
            style={{
              width: A4_WIDTH,
              height: contentHeight,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
            title="Resume Preview"
            sandbox="allow-same-origin allow-modals"
          />
          {Array.from({ length: pageCount - 1 }, (_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 pointer-events-none"
              style={{ top: (i + 1) * A4_HEIGHT * zoom + 15 }}
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
