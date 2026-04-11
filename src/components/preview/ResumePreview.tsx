import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { getThemeById } from '../../themes';
import { buildCustomCss } from '../../store/themeCustomStore';
import { useT } from '../../i18n';
import { Printer } from 'iconsax-react';

const A4_HEIGHT = 1123; // 297mm at 96dpi
const A4_WIDTH = 794; // 210mm at 96dpi
const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 2];

export function ResumePreview() {
  const t = useT();
  const resume = useResumeStore((s) => activeSlot(s).resume);
  const themeId = useResumeStore((s) => activeSlot(s).themeId);
  const custom = useResumeStore((s) => activeSlot(s).customization);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT);
  const [zoom, setZoom] = useState(1);

  const html = useMemo(
    () => getThemeById(themeId).render(resume, buildCustomCss(custom)),
    [resume, themeId, custom],
  );

  // Continuously measure iframe content height via MutationObserver + ResizeObserver
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let mo: MutationObserver | null = null;
    let ro: ResizeObserver | null = null;
    let raf = 0;

    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try {
          const doc = iframe.contentDocument;
          if (!doc) return;
          const h = doc.documentElement.scrollHeight;
          if (h > 0) setContentHeight(h);
        } catch {
          /* cross-origin */
        }
      });
    };

    const setup = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc?.body) return;

        // Initial measurement
        measure();

        // Watch for DOM mutations (content changes, font loads, image loads)
        mo = new MutationObserver(measure);
        mo.observe(doc.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });

        // Watch for size changes on the body
        if (typeof ResizeObserver !== 'undefined') {
          ro = new ResizeObserver(measure);
          ro.observe(doc.body);
        }

        // Also measure after fonts finish loading
        doc.fonts?.ready?.then(measure);
      } catch {
        /* cross-origin */
      }
    };

    iframe.addEventListener('load', setup);
    // If already loaded (srcDoc)
    setup();

    return () => {
      iframe.removeEventListener('load', setup);
      cancelAnimationFrame(raf);
      mo?.disconnect();
      ro?.disconnect();
    };
  }, [html]);

  const pageCount = Math.max(1, Math.ceil(contentHeight / A4_HEIGHT));

  const fitZoom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return 1;
    return Math.round(Math.min((container.clientWidth - 32) / A4_WIDTH, 1) * 100) / 100;
  }, []);

  // Auto-fit zoom to container width on mount and resize
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
            title={t('preview.zoomOut')}
          >
            &minus;
          </button>
          <button
            onClick={() => setZoom(fitZoom())}
            className="px-1.5 py-0.5 text-[10px] text-text-muted hover:text-text-secondary hover:bg-bg-hover rounded cursor-pointer tabular-nums min-w-[3rem] text-center"
            title={t('preview.fitWidth')}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom(1)}
            className={`px-1.5 py-0.5 text-[10px] rounded cursor-pointer ${zoom === 1 ? 'text-accent-text bg-bg-accent' : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'}`}
            title={t('preview.actualSize')}
          >
            1:1
          </button>
          <button
            onClick={zoomIn}
            disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            className="w-6 h-6 flex items-center justify-center text-xs text-text-muted hover:text-text-secondary hover:bg-bg-hover rounded cursor-pointer disabled:opacity-30 disabled:cursor-default"
            title={t('preview.zoomIn')}
          >
            +
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={handlePrint}
            className="w-7 h-7 flex items-center justify-center bg-accent text-white rounded hover:opacity-90 transition-colors cursor-pointer"
            title={t('preview.print')}
          >
            <Printer size={14} variant="Bold" color="currentColor" />
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
              style={{ top: (i + 1) * A4_HEIGHT * zoom }}
            >
              <div className="border-t border-dashed border-text-muted opacity-60" />
              <span className="absolute right-2 -top-5 text-[12px] text-text-muted opacity-60 select-none">
                {t('preview.pageBreak')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
