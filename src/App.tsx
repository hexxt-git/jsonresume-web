import { useState, useCallback, useRef, useMemo } from 'react';
import { ResumeEditor } from './components/editor/ResumeEditor';
import { ImportDialog } from './components/import-export/ImportDialog';
import { ExportDialog } from './components/import-export/ExportDialog';
import { useResumeStore } from './store/resumeStore';
import { getThemeById } from './themes';

function App() {
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const previewRef = useRef<HTMLIFrameElement>(null);

  const resume = useResumeStore((s) => s.resume);
  const themeId = useResumeStore((s) => s.selectedThemeId);
  const reset = useResumeStore((s) => s.reset);

  const handlePrint = useCallback(() => {
    previewRef.current?.contentWindow?.print();
  }, []);

  const html = useMemo(() => {
    return getThemeById(themeId).render(resume);
  }, [resume, themeId]);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-gray-800 tracking-tight">Resume Builder</h1>
          <span className="hidden sm:inline text-xs text-gray-400">JSON Resume</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer text-red-500"
          >
            Reset
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Import
          </button>
          <button
            onClick={() => setExportOpen(true)}
            className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Export
          </button>
        </div>
      </header>

      {/* Mobile tab bar */}
      <div className="sm:hidden flex border-b border-gray-200 shrink-0">
        <button
          onClick={() => setMobileView('editor')}
          className={`flex-1 py-2 text-xs font-medium text-center cursor-pointer ${mobileView === 'editor' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500'}`}
        >
          Editor
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-2 text-xs font-medium text-center cursor-pointer ${mobileView === 'preview' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500'}`}
        >
          Preview
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div
          className={`w-full sm:w-1/2 border-r border-gray-200 overflow-hidden ${mobileView === 'preview' ? 'hidden sm:block' : ''}`}
        >
          <ResumeEditor />
        </div>
        {/* Preview */}
        <div
          className={`w-full sm:w-1/2 overflow-hidden flex-col ${mobileView === 'editor' ? 'hidden sm:flex' : 'flex'}`}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Preview
            </span>
            <button
              onClick={handlePrint}
              className="text-xs px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Print / PDF
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-gray-100">
            <iframe
              ref={previewRef}
              srcDoc={html}
              className="w-full h-full border-0"
              title="Resume Preview"
              sandbox="allow-same-origin allow-modals"
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} onPrint={handlePrint} />
    </div>
  );
}

export default App;
