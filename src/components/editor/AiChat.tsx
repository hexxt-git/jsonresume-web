import { useState, useRef, useCallback, useEffect } from 'react';
import { useAiStore } from '../../store/aiStore';
import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { getProvider } from '../../lib/ai';
import type { ToolCall } from '../../lib/ai';
import { resumeToolDeclarations, executeResumeTool } from '../../lib/ai/resume-tools';
import { captureBeforeDiscreteMutation } from '../../hooks/useUndoRedo';
import { useT } from '../../i18n';
import { AiSetupPrompt, AiSettingsButton, AiProviderSettings } from './AiKeyGate';
import { AiMessageList } from './AiMessageList';
import { PROVIDERS } from '../../lib/ai';
import { LampOn, Send2, StopCircle, Trash } from 'iconsax-react';

/* ── Header buttons ──────────────────────────────────── */

function ClearChatButton() {
  const t = useT();
  const clearMessages = useResumeStore((s) => s.clearMessages);
  return (
    <button
      onClick={clearMessages}
      className="flex items-center gap-1 text-xs text-text-secondary hover:text-text transition-colors cursor-pointer p-1 rounded bg-bg-hover/30 hover:bg-bg-hover"
      title={t('ai.clearChat')}
    >
      <Trash size={14} variant="Bold" color="currentColor" />
      {t('ai.clearChat')}
    </button>
  );
}

function ModelPickerButton() {
  const t = useT();
  const provider = useAiStore((s) => s.provider);
  const model = useAiStore((s) => s.model);
  const providerObj = getProvider(provider);
  const providerMeta = PROVIDERS.find((p) => p.id === provider);
  const [open, setOpen] = useState(false);
  const currentLabel = providerObj.models.find((m) => m.id === model)?.label || model;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-text-secondary hover:text-text transition-colors cursor-pointer p-1 rounded bg-bg-hover/30 hover:bg-bg-hover"
        title={t('ai.changeModel')}
      >
        <LampOn size={14} variant="Bold" color="currentColor" />
        {currentLabel}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 w-52 bg-bg border border-border rounded-lg shadow-lg overflow-hidden">
            {providerMeta && (
              <div className="px-3 py-1.5 border-b border-border">
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
                  {providerMeta.name}
                </span>
              </div>
            )}
            <div className="max-h-[240px] overflow-y-auto p-1">
              {providerObj.models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    useAiStore.getState().setModel(m.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                    m.id === model
                      ? 'bg-bg-accent text-accent-text font-medium'
                      : 'text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────── */

function buildSystemPrompt(resume: unknown): string {
  return `You are an advanced AI resume assistant. You are a full LLM — you can generate, rewrite, translate, and transform any text yourself. You also have tools to directly write changes into the user's resume.

## Your capabilities
You can do ANYTHING a language model can do: rewrite content, translate to any language, change tone, generate new text, restructure sections, etc. When the user asks you to do something, YOU do the work — generate the new content yourself, then use your tools to apply it. Never ask the user to provide text that you can produce yourself.

## Current Resume
\`\`\`json
${JSON.stringify(resume, null, 2)}
\`\`\`

## Rules
- USE YOUR TOOLS to apply changes directly — don't just suggest text.
- After tool calls, give a 1-2 sentence summary of what changed. No long explanations.
- Keep ALL responses short. Use bullet points, not paragraphs.
- For replace_section: include ALL existing entries, not just changed ones, or you'll delete the rest.
- Prefer add_section_entry over replace_section when adding one item.
- When a task affects multiple sections, handle ALL of them in one go — do not stop partway and wait for the user to say "continue".
- Never fabricate experience. Preserve the user's voice.
- Respond in the user's language.
- Tool results include \`previous_value\` — this is what the field contained BEFORE your tool call modified it. The "Current Resume" above reflects the LATEST state. Use \`previous_value\` to understand what changed.
- To REVERT a change, use the tool again with the \`previous_value\` from the original tool result. Do NOT claim nothing changed when \`previous_value\` differs from the current state.
- Current date: ${new Date().toISOString().split('T')[0]}
- The Year is ${new Date().getFullYear()}
`;
}

export default function AiChat() {
  const t = useT();
  const apiKeys = useAiStore((s) => s.apiKeys);
  const provider = useAiStore((s) => s.provider);
  const model = useAiStore((s) => s.model);
  const isStreaming = useAiStore((s) => s.isStreaming);
  const providerObj = getProvider(provider);
  const apiKey = apiKeys[provider] || '';
  const [showSettings, setShowSettings] = useState(false);

  const [input, setInput] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount (tab switch)
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
  }, [input]);

  const handleSend = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || useAiStore.getState().isStreaming) return;

      const rs = useResumeStore.getState();
      rs.addUserMessage(content);
      rs.addAssistantMessage('');
      useAiStore.getState().setStreaming(true);
      useAiStore.getState().setError(null);
      setInput('');

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const MAX_LOOPS = 10;

        for (let loop = 0; loop < MAX_LOOPS; loop++) {
          const slot = activeSlot(useResumeStore.getState());
          const resume = slot.resume;
          const allMessages = slot.chatHistory;
          const apiMessages = allMessages.slice(0, -1);

          let accumulated = '';
          const toolCalls: ToolCall[] = [];

          const stream = providerObj.streamChat(
            apiKey,
            apiMessages,
            buildSystemPrompt(resume),
            resumeToolDeclarations,
            model,
            controller.signal,
          );

          for await (const event of stream) {
            if (controller.signal.aborted) break;
            if (event.type === 'text') {
              accumulated += event.content;
              useResumeStore.getState().updateLastAssistantMessage(accumulated);
            } else if (event.type === 'tool_call') {
              toolCalls.push(event.call);
            }
          }

          if (controller.signal.aborted) break;
          if (toolCalls.length === 0) break;

          useResumeStore.getState().addToolCallsToLastAssistant(toolCalls);

          captureBeforeDiscreteMutation();

          for (const call of toolCalls) {
            const { success, message, path, before } = executeResumeTool(call);
            useResumeStore.getState().addToolResult(call.name, message, success, path, before);
          }

          useResumeStore.getState().addAssistantMessage('');
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          useAiStore
            .getState()
            .setError(err instanceof Error ? err.message : 'Something went wrong');
        }
      } finally {
        const msgs = activeSlot(useResumeStore.getState()).chatHistory;
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant' && !last.content && !last.toolCalls?.length) {
          useResumeStore.getState().removeLastMessage();
        }
        useAiStore.getState().setStreaming(false);
        abortRef.current = null;
      }
    },
    [apiKey, model, providerObj],
  );

  const handleStop = () => abortRef.current?.abort();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  if (!apiKey && !showSettings) return <AiSetupPrompt onSetup={() => setShowSettings(true)} />;

  if (showSettings) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-2 shrink-0">
          <span className="font-medium text-text">{t('ai.settings')}</span>
          <button
            onClick={() => setShowSettings(false)}
            className="text-xs text-accent hover:underline cursor-pointer"
          >
            {apiKey ? t('ai.backToChat') : t('ai.back')}
          </button>
        </div>
        <AiProviderSettings />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-2 shrink-0">
        <ClearChatButton />
        <ModelPickerButton />
        <div className="flex-1" />
        <AiSettingsButton onClick={() => setShowSettings(true)} />
      </div>

      <AiMessageList onSend={handleSend} />

      {/* Input */}
      <div className="px-3 lg:px-12 lg:pb-8 pb-3 pt-1 lg:pt-2 shrink-0">
        <div className="flex items-end gap-1.5 border border-border-input bg-bg-input rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-accent focus-within:border-accent">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ai.placeholder')}
            rows={1}
            className="flex-1 text-sm bg-transparent text-text resize-none overflow-y-auto outline-none py-1"
            style={{ maxHeight: 96 }}
          />
          {isStreaming ? (
            <button
              onClick={handleStop}
              className="shrink-0 p-1 text-danger hover:opacity-80 cursor-pointer transition-colors"
              title={t('ai.stop')}
            >
              <StopCircle size={18} variant="Bold" color="currentColor" />
            </button>
          ) : (
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
              className="shrink-0 p-1 text-accent hover:opacity-80 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={t('ai.send')}
            >
              <Send2 size={18} variant="Bold" color="currentColor" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
