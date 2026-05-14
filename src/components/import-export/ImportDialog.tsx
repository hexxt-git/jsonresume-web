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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg border-border mx-4 w-full max-w-lg rounded-3xl border p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-text text-xl font-bold tracking-tight">{t('import.title')}</h2>
          <button
            onClick={onClose}
            className="bg-bg-secondary text-text-muted hover:text-danger flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xl transition-all"
          >
            &times;
          </button>
        </div>

        <div className="bg-bg-secondary border-border/50 mb-6 flex gap-2 rounded-full border p-1">
          <button
            onClick={() => setTab('file')}
            className={`flex-1 cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition-all ${tab === 'file' ? 'bg-accent text-white shadow-md' : 'text-text-tertiary hover:bg-bg-hover hover:text-text'}`}
          >
            {t('import.uploadFile')}
          </button>
          <button
            onClick={() => setTab('json')}
            className={`flex-1 cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition-all ${tab === 'json' ? 'bg-accent text-white shadow-md' : 'text-text-tertiary hover:bg-bg-hover hover:text-text'}`}
          >
            {t('import.pasteJson')}
          </button>
        </div>

        {tab === 'file' && (
          <div className="space-y-4">
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
              className="border-border text-text-tertiary hover:border-accent hover:bg-accent/5 hover:text-accent w-full cursor-pointer rounded-2xl border-2 border-dashed py-12 font-medium transition-all disabled:opacity-50"
            >
              {loading ? t('import.parsing') : t('import.dropzone')}
            </button>
            <p className="text-text-muted text-center text-xs italic">{t('import.dropzoneHint')}</p>
          </div>
        )}

        {tab === 'json' && (
          <div className="space-y-4">
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{"basics": {"name": "..."}}'
              rows={8}
              className="border-border bg-bg-input text-text focus:ring-accent/10 focus:border-accent w-full resize-y rounded-2xl border px-4 py-3 font-mono text-sm transition-all focus:ring-4 focus:outline-none"
            />
            <button
              onClick={handleJsonPaste}
              disabled={!jsonText.trim()}
              className="bg-accent w-full cursor-pointer rounded-full py-3 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
            >
              {t('import.importJson')}
            </button>
          </div>
        )}

        {error && (
          <p className="text-danger bg-danger/10 mt-4 rounded-lg py-2 text-center text-xs font-medium">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-center border-t pt-5">
          <button
            onClick={handleSample}
            className="text-accent cursor-pointer text-xs font-bold transition-colors hover:underline"
          >
            {t('import.loadSample')}
          </button>
        </div>
      </div>
    </div>
  );
}
