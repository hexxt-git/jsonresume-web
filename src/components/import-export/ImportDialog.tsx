import { useState, useRef } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { useT } from '../../i18n';
import { parseResumeFile } from '../../parser';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const t = useT();
  const setResume = useResumeStore((s) => s.setResume);
  const loadSample = useResumeStore((s) => s.loadSample);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'file' | 'json'>('file');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = async (file: File) => {
    setError('');
    setLoading(true);
    try {
      const resume = await parseResumeFile(file);
      setResume(resume);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  };

  const handleJsonPaste = () => {
    setError('');
    try {
      const parsed = JSON.parse(jsonText);
      setResume(parsed);
      onClose();
    } catch {
      setError(t('import.invalidJson'));
    }
  };

  const handleSample = () => {
    loadSample();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-bg rounded-xl shadow-xl w-full max-w-lg mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">{t('import.title')}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-secondary text-xl cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('file')}
            className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${tab === 'file' ? 'bg-bg-accent text-accent-text font-medium' : 'text-text-tertiary hover:bg-bg-secondary'}`}
          >
            {t('import.uploadFile')}
          </button>
          <button
            onClick={() => setTab('json')}
            className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${tab === 'json' ? 'bg-bg-accent text-accent-text font-medium' : 'text-text-tertiary hover:bg-bg-secondary'}`}
          >
            {t('import.pasteJson')}
          </button>
        </div>

        {tab === 'file' && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.yaml,.yml,.pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="w-full py-8 border-2 border-dashed border-border-input rounded-lg text-text-tertiary hover:border-accent hover:text-accent-text transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? t('import.parsing') : t('import.dropzone')}
            </button>
            <p className="text-xs text-text-muted mt-2">{t('import.dropzoneHint')}</p>
          </div>
        )}

        {tab === 'json' && (
          <div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{"basics": {"name": "..."}}'
              rows={8}
              className="w-full px-3 py-2 text-sm border border-border-input bg-bg-input text-text rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-accent resize-y"
            />
            <button
              onClick={handleJsonPaste}
              disabled={!jsonText.trim()}
              className="mt-2 px-4 py-2 bg-accent text-white text-sm rounded-md hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-default"
            >
              {t('import.importJson')}
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={handleSample}
            className="text-xs text-text-tertiary hover:text-accent-text cursor-pointer"
          >
            {t('import.loadSample')}
          </button>
        </div>
      </div>
    </div>
  );
}
