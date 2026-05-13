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
        className="bg-bg rounded-3xl shadow-2xl w-full max-w-lg mx-4 p-6 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text tracking-tight">{t('import.title')}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-secondary text-text-muted hover:text-danger transition-all cursor-pointer text-xl"
          >
            &times;
          </button>
        </div>

        <div className="flex gap-2 mb-6 bg-bg-secondary p-1 rounded-full border border-border/50">
          <button
            onClick={() => setTab('file')}
            className={`flex-1 px-4 py-2 text-xs rounded-full cursor-pointer transition-all font-bold ${tab === 'file' ? 'bg-accent text-white shadow-md' : 'text-text-tertiary hover:bg-bg-hover hover:text-text'}`}
          >
            {t('import.uploadFile')}
          </button>
          <button
            onClick={() => setTab('json')}
            className={`flex-1 px-4 py-2 text-xs rounded-full cursor-pointer transition-all font-bold ${tab === 'json' ? 'bg-accent text-white shadow-md' : 'text-text-tertiary hover:bg-bg-hover hover:text-text'}`}
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
              className="w-full py-12 border-2 border-dashed border-border rounded-2xl text-text-tertiary hover:border-accent hover:bg-accent/5 hover:text-accent transition-all cursor-pointer disabled:opacity-50 font-medium"
            >
              {loading ? t('import.parsing') : t('import.dropzone')}
            </button>
            <p className="text-xs text-text-muted text-center italic">{t('import.dropzoneHint')}</p>
          </div>
        )}

        {tab === 'json' && (
          <div className="space-y-4">
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{"basics": {"name": "..."}}'
              rows={8}
              className="w-full px-4 py-3 text-sm border border-border bg-bg-input text-text rounded-2xl font-mono focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent resize-y transition-all"
            />
            <button
              onClick={handleJsonPaste}
              disabled={!jsonText.trim()}
              className="w-full py-3 bg-accent text-white text-sm rounded-full hover:opacity-90 disabled:opacity-50 cursor-pointer font-bold transition-all shadow-md"
            >
              {t('import.importJson')}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 text-xs text-danger text-center bg-danger/10 py-2 rounded-lg font-medium">
            {error}
          </p>
        )}

        <div className="mt-6 pt-5 border-t border-border flex justify-center">
          <button
            onClick={handleSample}
            className="text-xs font-bold text-accent hover:underline cursor-pointer transition-colors"
          >
            {t('import.loadSample')}
          </button>
        </div>
      </div>
    </div>
  );
}
