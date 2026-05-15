import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { useResumeStore, activeSlot } from '@/store/resumeStore';
import { getThemeById } from '@/themes';
import { buildCustomCss } from '@/store/themeCustomStore';
import { useT } from '@/i18n';
import { Printer } from 'iconsax-react';
import { filterVisible } from '@/utils/resume';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { PlusIcon, MinusIcon } from '@/assets/Icons';

const A4_HEIGHT = 1123; // 297mm at 96dpi
const A4_WIDTH = 794; // 210mm at 96dpi
const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 2];

export function ResumePreview({ onBack }: { onBack?: () => void }) {
  const t = useT();
  const resume = useResumeStore((s) => activeSlot(s).resume);
  const themeId = useResumeStore((s) => activeSlot(s).themeId);
  const custom = useResumeStore((s) => activeSlot(s).customization);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT);
  const [zoom, setZoom] = useState(1);

  const html = useMemo(
    () => getThemeById(themeId).render(filterVisible(resume), buildCustomCss(custom)),
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
    return Math.round(Math.min((container.clientWidth - 32 - 36) / A4_WIDTH, 1) * 100) / 100;
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
    <div className="bg-bg flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="bg-bg-secondary/30 flex shrink-0 items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="text-accent-text border-accent/20 hover:bg-bg-accent shrink-0 cursor-pointer rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition-all sm:hidden"
            >
              &larr; {t('app.editor')}
            </button>
          )}
          <span
            className={cn(
              'text-text-muted text-[10px] font-bold tracking-widest uppercase',
              onBack && 'hidden sm:inline',
            )}
          >
            {t('app.preview')}
          </span>
        </div>
        <div className="bg-bg border-border/50 flex items-center gap-2 rounded-full border p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            disabled={zoom <= ZOOM_STEPS[0]}
            className="text-text-muted h-8 w-8"
            title={t('preview.zoomOut')}
            leftIcon={<MinusIcon />}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(fitZoom())}
            className="text-text-secondary hover:text-accent hover:bg-bg-hover h-8 min-w-14 px-3 py-1 text-[10px] font-bold tabular-nums"
            title={t('preview.fitWidth')}
          >
            {Math.round(zoom * 100)}%
          </Button>
          <Button
            variant={zoom === 1 ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setZoom(1)}
            className={cn(
              'h-8 px-3 py-1 text-[10px] font-bold',
              zoom !== 1 && 'text-text-muted hover:text-text-secondary hover:bg-bg-hover',
            )}
            title={t('preview.actualSize')}
          >
            1:1
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomIn}
            disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            className="text-text-muted h-8 w-8"
            title={t('preview.zoomIn')}
            leftIcon={<PlusIcon />}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            size="sm"
            leftIcon={<Printer size={16} variant="Bold" color="currentColor" />}
            title={t('preview.print')}
          >
            <span className="hidden lg:inline">{t('preview.print')}</span>
          </Button>
        </div>
      </div>
      <div ref={containerRef} className="bg-bg-tertiary/50 min-h-0 flex-1 overflow-auto p-8">
        <div
          className="relative mx-auto transition-all duration-300"
          style={{
            width: A4_WIDTH * zoom,
            height: contentHeight * zoom,
          }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={html}
            className="origin-top-left rounded-sm border-0 bg-white"
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
              className="pointer-events-none absolute right-0 left-0"
              style={{ top: (i + 1) * A4_HEIGHT * zoom }}
            >
              <div className="border-text-muted border-t border-dashed opacity-60" />
              <span className="text-text-muted absolute -top-5 right-2 text-[12px] opacity-60 select-none">
                {t('preview.pageBreak')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
