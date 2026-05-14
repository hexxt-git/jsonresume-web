import { useState, useRef } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { useT } from '@/i18n';
import { Badge } from '@/components/ui/Badge';
import { parseResumeFile } from '@/parser';
import { Dialog, DialogHeader } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs } from '@/components/ui/Tabs';

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
    <Dialog open={open} onClose={onClose} className="p-6">
      <DialogHeader title={t('import.title')} onClose={onClose} />

      <Tabs
        value={tab}
        onChange={(v) => setTab(v as 'file' | 'json')}
        options={[
          { value: 'file', label: t('import.uploadFile') },
          { value: 'json', label: t('import.pasteJson') },
        ]}
        className="mb-6"
      />

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
          <Button
            variant="dashed"
            size="lg"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="w-full py-12"
          >
            {loading ? t('import.parsing') : t('import.dropzone')}
          </Button>
          <p className="text-text-muted text-center text-xs italic">{t('import.dropzoneHint')}</p>
        </div>
      )}

      {tab === 'json' && (
        <div className="space-y-4">
          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{"basics": {"name": "..."}}'
            rows={8}
            className="font-mono"
          />
          <Button onClick={handleJsonPaste} disabled={!jsonText.trim()} fullWidth>
            {t('import.importJson')}
          </Button>
        </div>
      )}

      {error && (
        <Badge variant="danger" className="mt-4 w-full justify-center rounded-2xl py-2 text-center">
          {error}
        </Badge>
      )}

      <div className="mt-6 flex justify-center border-t pt-5">
        <Button
          variant="ghost"
          size="xs"
          onClick={handleSample}
          className="text-accent hover:bg-transparent hover:underline"
        >
          {t('import.loadSample')}
        </Button>
      </div>
    </Dialog>
  );
}
