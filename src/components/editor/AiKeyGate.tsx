import { useState } from 'react';
import { useAiStore } from '../../store/aiStore';
import { PROVIDERS, getProvider } from '../../lib/ai';
import { useT } from '../../i18n';
import { Eye, EyeOff, Settings, ExternalLink } from 'lucide-react';

/* ── Provider settings ───────────────────────────────── */

export function AiProviderSettings() {
  const t = useT();
  const apiKeys = useAiStore((s) => s.apiKeys);
  const provider = useAiStore((s) => s.provider);
  const setProvider = useAiStore((s) => s.setProvider);
  const setModel = useAiStore((s) => s.setModel);
  const setApiKey = useAiStore((s) => s.setApiKey);
  const clearApiKey = useAiStore((s) => s.clearApiKey);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-text">{t('ai.providersTitle')}</h3>
          <p className="text-[11px] text-text-muted mt-0.5">{t('ai.providersDesc')}</p>
        </div>

        <div className="space-y-3">
          {PROVIDERS.map((p) => (
            <ProviderRow
              key={p.id}
              id={p.id}
              name={p.name}
              placeholder={p.keyPlaceholder}
              keyLink={p.keyLink}
              keyLinkLabel={p.keyLinkLabel}
              hasKey={!!apiKeys[p.id]}
              maskedKey={apiKeys[p.id] ? `${'•'.repeat(8)}${apiKeys[p.id].slice(-4)}` : ''}
              isActive={provider === p.id && !!apiKeys[p.id]}
              onSave={async (key) => {
                const ok = await getProvider(p.id).validateKey(key);
                if (!ok) return false;
                setApiKey(p.id, key);
                if (!apiKeys[provider]) {
                  setProvider(p.id);
                  setModel(p.provider.models[0].id);
                }
                return true;
              }}
              onRemove={() => clearApiKey(p.id)}
              onActivate={() => {
                setProvider(p.id);
                setModel(p.provider.models[0].id);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Single provider row ─────────────────────────────── */

function ProviderRow({
  id: _id,
  name,
  placeholder,
  keyLink,
  keyLinkLabel,
  hasKey,
  maskedKey,
  isActive,
  onSave,
  onRemove,
  onActivate,
}: {
  id: string;
  name: string;
  placeholder: string;
  keyLink: string;
  keyLinkLabel: string;
  hasKey: boolean;
  maskedKey: string;
  isActive: boolean;
  onSave: (key: string) => Promise<boolean>;
  onRemove: () => void;
  onActivate: () => void;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const key = input.trim();
    if (!key) return;
    setValidating(true);
    setError('');
    const ok = await onSave(key);
    setValidating(false);
    if (ok) {
      setEditing(false);
      setInput('');
    } else {
      setError(t('ai.keyInvalid'));
    }
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text">{name}</span>
          {isActive && (
            <span className="text-[10px] text-accent-text font-medium">{t('ai.active')}</span>
          )}
        </div>
        {hasKey && (
          <div className="flex items-center gap-2">
            {!isActive && (
              <button
                onClick={onActivate}
                className="text-[10px] text-accent hover:underline cursor-pointer"
              >
                {t('ai.use')}
              </button>
            )}
            <button
              onClick={onRemove}
              className="text-[10px] text-text-muted hover:text-danger cursor-pointer"
            >
              {t('ai.remove')}
            </button>
          </div>
        )}
      </div>

      {hasKey && !editing && (
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs font-mono text-text-muted bg-bg-secondary px-2.5 py-1.5 rounded">
            {maskedKey}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] text-text-muted hover:text-text-secondary cursor-pointer shrink-0"
          >
            {t('ai.change')}
          </button>
        </div>
      )}

      {(!hasKey || editing) && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={placeholder}
              autoFocus={!hasKey}
              className="w-full px-3 py-1.5 pr-8 text-sm border border-border-input bg-bg-input text-text rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary cursor-pointer"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex items-center justify-between">
            <a
              href={keyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-accent hover:underline"
            >
              {t('ai.getKey')} {keyLinkLabel} <ExternalLink size={9} />
            </a>
            <div className="flex gap-1.5">
              {editing && (
                <button
                  onClick={() => {
                    setEditing(false);
                    setInput('');
                    setError('');
                  }}
                  className="text-xs text-text-muted hover:text-text-secondary cursor-pointer"
                >
                  {t('ai.cancel')}
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={validating || !input.trim()}
                className="text-xs px-3 py-1 bg-accent text-white rounded-md hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validating ? t('ai.keyValidating') : t('ai.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Setup prompt (centered, reusable) ───────────────── */

export function AiSetupPrompt({ onSetup }: { onSetup: () => void }) {
  const t = useT();
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center space-y-3 max-w-sm">
        <Settings size={24} className="mx-auto text-text-faint" />
        <h3 className="text-sm font-semibold text-text">{t('ai.setupTitle')}</h3>
        <p className="text-xs text-text-muted leading-relaxed">
          {t('ai.setupDesc').split(t('ai.setupOpenSource'))[0]}
          <a
            href="https://github.com/hexxt-git/jsonresume-web/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {t('ai.setupOpenSource')}
          </a>
          {t('ai.setupDesc').split(t('ai.setupOpenSource'))[1]}
        </p>
        <button
          onClick={onSetup}
          className="text-xs px-4 py-2 bg-accent text-white rounded-md hover:opacity-90 cursor-pointer"
        >
          {t('ai.setupButton')}
        </button>
      </div>
    </div>
  );
}

/* ── Gate: wraps children, shows setup prompt if no key ── */

export function AiGate({ children, onSetup }: { children: React.ReactNode; onSetup: () => void }) {
  const apiKeys = useAiStore((s) => s.apiKeys);
  const provider = useAiStore((s) => s.provider);
  if (apiKeys[provider]) return <>{children}</>;
  return <AiSetupPrompt onSetup={onSetup} />;
}

/* ── Settings button for chat header ─────────────────── */

export function AiSettingsButton({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <button
      onClick={onClick}
      className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer p-1 rounded hover:bg-bg-hover"
      title={t('ai.settings')}
    >
      <Settings size={14} />
    </button>
  );
}
