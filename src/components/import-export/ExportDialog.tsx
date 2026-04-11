import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { buildCustomCss } from '../../store/themeCustomStore';
import { useT } from '../../i18n';
import { getThemeById } from '../../themes';
import { saveAs } from 'file-saver';
import YAML from 'yaml';

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

  if (!open) return null;

  const fname = resume.basics?.name?.replace(/\s+/g, '_') || 'resume';

  const renderHtml = () => getThemeById(themeId).render(resume, buildCustomCss(custom));

  const handlePrint = () => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Resume Preview"]');
    iframe?.contentWindow?.print();
    onClose();
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
      sub: t('export.pdfDesc'),
      action: handlePrint,
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-bg border border-border rounded-lg shadow-lg overflow-hidden">
        {options.map((opt, i) => (
          <button
            key={opt.ext}
            onClick={opt.action}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-bg-hover transition-colors cursor-pointer ${
              i > 0 ? 'border-t border-border' : ''
            }`}
          >
            <span className="w-8 h-8 rounded bg-bg-tertiary flex items-center justify-center text-xs font-mono text-text-tertiary shrink-0">
              {EXT_ICONS[opt.ext]}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-text">{opt.label}</div>
              <div className="text-xs text-text-muted truncate">{opt.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
