import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { buildCustomCss } from '../../store/themeCustomStore';
import { useT } from '../../i18n';
import { getThemeById } from '../../themes';
import { saveAs } from 'file-saver';
import YAML from 'yaml';
import { filterVisible } from '../../utils/resume';

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

  const renderHtml = () =>
    getThemeById(themeId).render(filterVisible(resume), buildCustomCss(custom));

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
      <div className="fixed inset-0 z-40 bg-black/5" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-bg border border-border rounded-2xl shadow-2xl overflow-hidden p-2 space-y-1">
        {options.map((opt) => (
          <button
            key={opt.ext}
            onClick={opt.action}
            className="w-full flex items-center gap-4 px-3 py-3 text-left hover:bg-bg-hover rounded-xl transition-all cursor-pointer group"
          >
            <span className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-[10px] font-bold text-text-tertiary shrink-0 group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
              {EXT_ICONS[opt.ext]}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-text group-hover:text-accent transition-colors">
                {opt.label}
              </div>
              <div className="text-[10px] font-medium text-text-muted truncate mt-0.5">
                {opt.sub}
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
