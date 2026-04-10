import { useState, useRef } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { parseResumeFile } from '../../parser';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ImportDialog({ open, onClose }: ImportDialogProps) {
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
      setError('Invalid JSON');
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
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Import Resume</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('file')}
            className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${tab === 'file' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Upload File
          </button>
          <button
            onClick={() => setTab('json')}
            className={`px-3 py-1.5 text-sm rounded-md cursor-pointer ${tab === 'json' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Paste JSON
          </button>
        </div>

        {tab === 'file' && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Parsing...' : 'Click to upload PDF, DOCX, or JSON'}
            </button>
            <p className="text-xs text-gray-400 mt-2">
              PDF and DOCX files will be parsed with best-effort heuristics. JSON Resume files are
              imported directly.
            </p>
          </div>
        )}

        {tab === 'json' && (
          <div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{"basics": {"name": "..."}}'
              rows={8}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
            />
            <button
              onClick={handleJsonPaste}
              disabled={!jsonText.trim()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer disabled:cursor-default"
            >
              Import JSON
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleSample}
            className="text-xs text-gray-500 hover:text-blue-500 cursor-pointer"
          >
            Or load sample resume
          </button>
        </div>
      </div>
    </div>
  );
}
