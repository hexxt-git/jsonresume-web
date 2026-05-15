import { useState } from 'react';
import { useAiStore } from '@/store/aiStore';
import { PROVIDERS, getProvider } from '@/lib/ai';
import { useT } from '@/i18n';
import { Eye, EyeSlash, Setting, ExportSquare } from 'iconsax-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollArea } from '@/components/ui/ScrollArea';

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
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
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
    </ScrollArea>
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
              <Button
                variant="ghost"
                size="xs"
                onClick={onActivate}
                className="text-accent px-0 hover:bg-transparent hover:underline"
              >
                {t('ai.use')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="xs"
              onClick={onRemove}
              className="text-text-muted hover:text-danger px-0 hover:bg-transparent"
            >
              {t('ai.remove')}
            </Button>
          </div>
        )}
      </div>

      {hasKey && !editing && (
        <div className="flex items-center gap-2">
          <span className="text-text-muted bg-bg-secondary flex-1 rounded px-2.5 py-1.5 font-mono text-xs">
            {maskedKey}
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setEditing(true)}
            className="text-text-muted hover:text-text-secondary shrink-0 px-0 hover:bg-transparent"
          >
            {t('ai.change')}
          </Button>
        </div>
      )}

      {(!hasKey || editing) && (
        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={placeholder}
              autoFocus={!hasKey}
              className="pr-8"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowKey(!showKey)}
              className="text-text-muted hover:text-text-secondary absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2"
            >
              {showKey ? (
                <EyeSlash size={14} variant="Bold" color="currentColor" />
              ) : (
                <Eye size={14} variant="Bold" color="currentColor" />
              )}
            </Button>
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
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setEditing(false);
                    setInput('');
                    setError('');
                  }}
                  className="text-text-muted hover:text-text-secondary px-0 hover:bg-transparent"
                >
                  {t('ai.cancel')}
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={validating || !input.trim()}>
                {validating ? t('ai.keyValidating') : t('ai.save')}
              </Button>
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
        <Button onClick={onSetup} size="sm">
          {t('ai.setupButton')}
        </Button>
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
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      leftIcon={<Setting size={14} variant="Bold" color="currentColor" />}
      className="hover:text-text border-border/50 hover:bg-bg-hover border px-3 text-[10px] font-bold"
      title={t('ai.settings')}
    >
      {t('ai.settings')}
    </Button>
  );
}
