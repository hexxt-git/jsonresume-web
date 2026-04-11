import { useState } from 'react';
import { useAiStore } from '../../store/aiStore';
import { getProvider } from '../../lib/ai';
import { useT } from '../../i18n';

export function AiKeyGate() {
  const t = useT();
  const provider = useAiStore((s) => s.provider);
  const setApiKey = useAiStore((s) => s.setApiKey);
  const [input, setInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const key = input.trim();
    if (!key) return;
    setValidating(true);
    setError('');
    const ok = await getProvider(provider).validateKey(key);
    setValidating(false);
    if (ok) {
      setApiKey(key);
    } else {
      setError(t('ai.keyInvalid'));
    }
  };

  const inputCls =
    'w-full px-3 py-1.5 text-sm border border-border-input bg-bg-input text-text rounded-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent';

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-sm w-full text-center space-y-4">
        <h3 className="text-sm font-semibold text-text">{t('ai.keyTitle')}</h3>
        <p className="text-xs text-text-muted">{t('ai.keyDesc')}</p>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder={t('ai.keyPlaceholder')}
          className={inputCls}
          autoFocus
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <button
          onClick={handleSave}
          disabled={validating || !input.trim()}
          className="w-full text-xs px-4 py-2 bg-accent text-white rounded-md hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {validating ? t('ai.keyValidating') : t('ai.keySave')}
        </button>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-accent hover:underline"
        >
          {t('ai.keyLink')}
        </a>
      </div>
    </div>
  );
}
