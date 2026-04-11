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
- Current date: ${new Date().toISOString().split('T')[0]}`;
}

export default function AiChat() {
  const t = useT();
  const apiKeys = useAiStore((s) => s.apiKeys);
  const provider = useAiStore((s) => s.provider);
  const model = useAiStore((s) => s.model);
  const isStreaming = useAiStore((s) => s.isStreaming);
  const clearMessages = useAiStore((s) => s.clearMessages);
  const providerObj = getProvider(provider);
  const apiKey = apiKeys[provider] || '';
  const [showSettings, setShowSettings] = useState(false);

  const [input, setInput] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
  }, [input]);

  /**
   * Agent loop: send message → stream response → auto-execute tool calls →
   * feed results back → repeat until no more tool calls.
   */
  const handleSend = useCallback(
    async (text: string) => {
      const content = text.trim();
      // Guard: check store directly to prevent race conditions on double-send
      if (!content || useAiStore.getState().isStreaming) return;

      const store = useAiStore.getState();
      store.addUserMessage(content);
      store.addAssistantMessage('');
      store.setStreaming(true);
      store.setError(null);
      setInput('');

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const MAX_LOOPS = 10;

        for (let loop = 0; loop < MAX_LOOPS; loop++) {
          const resume = activeSlot(useResumeStore.getState()).resume;
          // Always exclude the trailing empty assistant placeholder from API messages
          const allMessages = useAiStore.getState().messages;
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
              useAiStore.getState().updateLastAssistantMessage(accumulated);
            } else if (event.type === 'tool_call') {
              toolCalls.push(event.call);
            }
          }

          if (controller.signal.aborted) break;
          if (toolCalls.length === 0) break;

          // Attach tool calls to the current assistant message
          useAiStore.getState().addToolCallsToLastAssistant(toolCalls);

          // Capture snapshot before AI mutations so undo reverts the whole batch
          captureBeforeDiscreteMutation();

          // Auto-execute each tool call
          for (const call of toolCalls) {
            const { success, message, path, before } = executeResumeTool(call);
            useAiStore.getState().addToolResult(call.name, message, success, path, before);
          }

          // Add a new assistant placeholder for the next agent loop turn
          useAiStore.getState().addAssistantMessage('');
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          useAiStore
            .getState()
            .setError(err instanceof Error ? err.message : 'Something went wrong');
        }
      } finally {
        // Clean up any trailing empty assistant placeholder
        const msgs = useAiStore.getState().messages;
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant' && !last.content && !last.toolCalls?.length) {
          useAiStore.getState().removeLastMessage();
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
        <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
          <span className="text-xs font-medium text-text">AI Settings</span>
          <button
            onClick={() => setShowSettings(false)}
            className="text-xs text-accent hover:underline cursor-pointer"
          >
            {apiKey ? 'Back to chat' : 'Back'}
          </button>
        </div>
        <AiProviderSettings />
      </div>
    );
  }

  const providerMeta = PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={clearMessages}
            className="text-xs text-text-muted hover:text-text transition-colors cursor-pointer"
          >
            {t('ai.clearChat')}
          </button>
          {/* Provider + model selector */}
          <select
            value={model}
            onChange={(e) => useAiStore.getState().setModel(e.target.value)}
            className="text-xs bg-bg-input border border-border-input rounded px-1.5 py-0.5 text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            {providerObj.models.map((m) => (
              <option key={m.id} value={m.id}>
                {providerMeta ? `${providerMeta.name} — ` : ''}
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <AiSettingsButton onClick={() => setShowSettings(true)} />
      </div>

      {/* Messages */}
      <AiMessageList />

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ai.placeholder')}
            rows={1}
            className="flex-1 px-3 py-1.5 text-sm border border-border-input bg-bg-input text-text rounded-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent resize-none overflow-y-auto"
            style={{ maxHeight: 96 }}
          />
          {isStreaming ? (
            <button
              onClick={handleStop}
              className="shrink-0 text-xs px-4 h-8 bg-danger text-white rounded-md hover:opacity-90 transition-colors cursor-pointer"
            >
              {t('ai.stop')}
            </button>
          ) : (
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
              className="shrink-0 text-xs px-4 h-8 bg-accent text-white rounded-md hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('ai.send')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
