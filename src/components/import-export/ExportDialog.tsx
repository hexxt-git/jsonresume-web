import { useResumeStore } from '../../store/resumeStore';
import { getThemeById } from '../../themes';
import { saveAs } from 'file-saver';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onPrint: () => void;
}

export function ExportDialog({ open, onClose, onPrint }: ExportDialogProps) {
  const resume = useResumeStore((s) => s.resume);
  const themeId = useResumeStore((s) => s.selectedThemeId);

  if (!open) return null;

  const name = resume.basics?.name?.replace(/\s+/g, '_') || 'resume';

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' });
    saveAs(blob, `${name}.json`);
    onClose();
  };

  const exportHtml = () => {
    const theme = getThemeById(themeId);
    const html = theme.render(resume);
    const blob = new Blob([html], { type: 'text/html' });
    saveAs(blob, `${name}.html`);
    onClose();
  };

  const exportPdf = () => {
    onPrint();
    onClose();
  };

  const options = [
    { label: 'JSON', desc: 'Machine-readable JSON Resume format', action: exportJson },
    {
      label: 'HTML',
      desc: `Rendered with ${getThemeById(themeId).name} theme`,
      action: exportHtml,
    },
    { label: 'PDF', desc: 'Opens browser print dialog (Save as PDF)', action: exportPdf },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Export Resume</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer"
          >
            &times;
          </button>
        </div>
        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <div className="text-sm font-semibold text-gray-800">{opt.label}</div>
              <div className="text-xs text-gray-500">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
