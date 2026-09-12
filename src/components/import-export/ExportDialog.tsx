import { useState } from 'react';
import { useResumeStore, activeSlot } from '@/store/resumeStore';
import { buildCustomCss, pdfMargin } from '@/store/themeCustomStore';
import { useT } from '@/i18n';
import { getThemeById } from '@/themes';
import { saveAs } from 'file-saver';
import YAML from 'yaml';
import { filterVisible } from '@/utils/resume';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

const EXT_ICONS: Record<string, string> = {
  JSON: '{ }',
  YAML: '---',
  HTML: '</>',
  PDF: 'pdf',
};

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const t = useT();
  const resume = useResumeStore((s) => activeSlot(s).resume);
  const themeId = useResumeStore((s) => activeSlot(s).themeId);
  const custom = useResumeStore((s) => activeSlot(s).customization);
  const [pdfState, setPdfState] = useState<'idle' | 'generating' | 'error'>('idle');

  if (!open) return null;

  const fname = resume.basics?.name?.replace(/\s+/g, '_') || 'resume';

  const renderHtml = () =>
    getThemeById(themeId).render(filterVisible(resume), buildCustomCss(custom));

  const handleExportPdf = async () => {
    setPdfState('generating');
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: renderHtml(), margin: pdfMargin(custom) }),
      });
      if (!res.ok) throw new Error(await res.text());
      saveAs(await res.blob(), `${fname}.pdf`);
      setPdfState('idle');
      onClose();
    } catch (err) {
      console.error('PDF export failed:', err);
      setPdfState('error');
    }
  };

  const options = [
    {
      ext: 'JSON',
      label: t('export.json'),
      sub: t('export.jsonDesc'),
      action: () => {
        saveAs(
          new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' }),
          `${fname}.json`,
        );
        onClose();
      },
    },
    {
      ext: 'YAML',
      label: t('export.yaml'),
      sub: t('export.yamlDesc'),
      action: () => {
        saveAs(new Blob([YAML.stringify(resume)], { type: 'text/yaml' }), `${fname}.yaml`);
        onClose();
      },
    },
    {
      ext: 'HTML',
      label: t('export.html'),
      sub: `.html - ${getThemeById(themeId).name}`,
      action: () => {
        saveAs(new Blob([renderHtml()], { type: 'text/html' }), `${fname}.html`);
        onClose();
      },
    },
    {
      ext: 'PDF',
      label: t('export.pdf'),
      sub:
        pdfState === 'generating'
          ? t('export.pdfGenerating')
          : pdfState === 'error'
            ? t('export.pdfError')
            : t('export.pdfDesc'),
      action: handleExportPdf,
      disabled: pdfState === 'generating',
    },
  ];

  return (
    <>
      <div className="animate-in fade-in fixed inset-0 z-40 bg-black/5" onClick={onClose} />
      <div className="bg-bg animate-dropdown absolute top-full right-0 z-50 mt-2 w-64 space-y-1 overflow-hidden rounded-2xl border p-2 shadow-xl">
        {options.map((opt) => (
          <button
            key={opt.ext}
            onClick={opt.action}
            disabled={opt.disabled}
            className="hover:bg-bg-hover group flex w-full cursor-pointer items-center gap-4 rounded-xl px-3 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="bg-bg-secondary text-text-tertiary group-hover:bg-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all group-hover:text-white">
              {EXT_ICONS[opt.ext]}
            </span>
            <div className="min-w-0">
              <div className="text-text group-hover:text-accent text-sm font-bold transition-colors">
                {opt.label}
              </div>
              <div className="text-text-muted mt-0.5 truncate text-[10px] font-medium">
                {opt.sub}
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
