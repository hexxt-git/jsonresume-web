import { useState } from 'react';
import { useAiStore } from '../../store/aiStore';
import { PROVIDERS, getProvider } from '../../lib/ai';
import { useT } from '../../i18n';
import { Eye, EyeSlash, Setting, ExportSquare } from 'iconsax-react';

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
          <h3 className="text-text text-sm font-semibold">{t('ai.providersTitle')}</h3>
          <p className="text-text-muted mt-0.5 text-[11px]">{t('ai.providersDesc')}</p>
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
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-text text-xs font-medium">{name}</span>
          {isActive && (
            <span className="text-accent-text text-[10px] font-medium">{t('ai.active')}</span>
          )}
        </div>
        {hasKey && (
          <div className="flex items-center gap-2">
            {!isActive && (
              <button
                onClick={onActivate}
                className="text-accent cursor-pointer text-[10px] hover:underline"
              >
                {t('ai.use')}
              </button>
            )}
            <button
              onClick={onRemove}
              className="text-text-muted hover:text-danger cursor-pointer text-[10px]"
            >
              {t('ai.remove')}
            </button>
          </div>
        )}
      </div>

      {hasKey && !editing && (
        <div className="flex items-center gap-2">
          <span className="text-text-muted bg-bg-secondary flex-1 rounded px-2.5 py-1.5 font-mono text-xs">
            {maskedKey}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="text-text-muted hover:text-text-secondary shrink-0 cursor-pointer text-[10px]"
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
              className="border-border-input bg-bg-input text-text focus:ring-accent w-full rounded-full border px-3 py-1.5 pr-8 text-sm focus:ring-1 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-text-muted hover:text-text-secondary absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
            >
              {showKey ? (
                <EyeSlash size={14} variant="Bold" color="currentColor" />
              ) : (
                <Eye size={14} variant="Bold" color="currentColor" />
              )}
            </button>
          </div>
          {error && <p className="text-danger text-xs">{error}</p>}
          <div className="flex items-center justify-between">
            <a
              href={keyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent flex items-center gap-1 text-[10px] hover:underline"
            >
              {t('ai.getKey')} {keyLinkLabel}{' '}
              <ExportSquare size={9} variant="Bold" color="currentColor" />
            </a>
            <div className="flex gap-1.5">
              {editing && (
                <button
                  onClick={() => {
                    setEditing(false);
                    setInput('');
                    setError('');
                  }}
                  className="text-text-muted hover:text-text-secondary cursor-pointer text-xs"
                >
                  {t('ai.cancel')}
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={validating || !input.trim()}
                className="bg-accent cursor-pointer rounded-full px-3 py-1 text-xs text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-sm space-y-3 text-center">
        <Setting
          size={24}
          variant="Bold"
          color="currentColor"
          className="text-text-faint mx-auto"
        />
        <h3 className="text-text text-sm font-semibold">{t('ai.setupTitle')}</h3>
        <p className="text-text-muted text-xs leading-relaxed">
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
          className="bg-accent cursor-pointer rounded-full px-4 py-2 text-xs text-white hover:opacity-90"
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
      className="text-text-secondary hover:text-text bg-bg-secondary border-border/50 hover:bg-bg-hover flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold transition-all"
      title={t('ai.settings')}
    >
      <Setting size={14} variant="Bold" color="currentColor" />
      {t('ai.settings').toUpperCase()}
    </button>
  );
}
