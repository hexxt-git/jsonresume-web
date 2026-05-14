import { useState, useRef, useCallback, useEffect } from 'react';
import { useAiStore } from '@/store/aiStore';
import { useResumeStore, activeSlot } from '@/store/resumeStore';
import { getProvider } from '@/lib/ai';
import type { ToolCall } from '@/lib/ai';
import { resumeToolDeclarations, executeResumeTool } from '@/lib/ai/resume-tools';
import { captureBeforeDiscreteMutation } from '@/hooks/useUndoRedo';
import { useT } from '@/i18n';
import { AiSetupPrompt, AiSettingsButton, AiProviderSettings } from './AiKeyGate';
import { AiMessageList } from './AiMessageList';
import { PROVIDERS } from '@/lib/ai';
import { Eye, EyeSlash, LampOn, Send2, StopCircle, Trash } from 'iconsax-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

/* ── Header buttons ──────────────────────────────────── */

function ClearChatButton() {
  const t = useT();
  const clearMessages = useResumeStore((s) => s.clearMessages);
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={clearMessages}
      leftIcon={<Trash size={12} variant="Bold" color="currentColor" />}
      className="hover:text-danger hover:bg-danger/5 border-border/50 border px-3 text-[10px] font-bold"
      title={t('ai.clearChat')}
    >
      {t('ai.clearChat')}
    </Button>
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
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(!open)}
        className="hover:text-accent border-border/50 hover:bg-accent/5 border px-3 text-[10px] font-bold"
        title={t('ai.changeModel')}
      >
        <LampOn size={12} variant="Bold" color="currentColor" />
        {currentLabel}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setOpen(false)} />
          <div className="bg-bg absolute top-full left-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border p-2">
            {providerMeta && (
              <div className="mb-1 border-b px-4 py-2">
                <span className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
                  {providerMeta.name}
                </span>
              </div>
            )}
            <div className="max-h-[320px] space-y-1 overflow-y-auto">
              {providerObj.models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    useAiStore.getState().setModel(m.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full cursor-pointer rounded-xl px-4 py-2.5 text-left text-xs transition-all',
                    m.id === model
                      ? 'bg-bg-accent text-accent-text font-bold'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text',
                  )}
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
  return `You are an advanced AI resume assistant built into JSONResume Web — a client-side resume builder that uses the JSON Resume schema, offers 10+ themes with live preview, a form editor, AI chat (you), and an Automation tab with specialized tools. Everything runs in the browser; resumes are stored locally.

## Your capabilities
You can do ANYTHING a language model can do: rewrite content, translate to any language, change tone, generate new text, restructure sections, etc. When the user asks you to do something, YOU do the work — generate the new content yourself, then use your tools to apply it. Never ask the user to provide text that you can produce yourself.

## Automation tab tools (recommend these instead of chat when appropriate)
The app has an **Automation** tab with dedicated tools that are much better than chat for these workflows:
- **Job Tailoring** — paste a job description, get a match score with keyword analysis, then auto-tailor the resume with section-by-section diff review. *Recommend when the user wants to tailor/optimize for a specific job.*
- **Batch Tailoring** — process multiple job descriptions at once, generating a tailored resume variant for each. *Recommend when the user mentions multiple jobs or batch processing.*
- **Application Help** — generate cover letters, answer application questions, draft follow-up/thank-you emails. *Recommend when the user asks for cover letters, application questions, or professional emails.*
- **Resume Audit** — ATS compatibility scan with issue-by-issue auto-fix (keywords, action verbs, quantification, formatting, completeness). *Recommend when the user wants an ATS check, resume review, or audit.*

When the user's request matches one of these tools, briefly mention the tool exists in the Automation tab and that it provides a better experience for that task (with previews, diffs, structured output). Still answer their immediate question if it's simple, but nudge them toward the dedicated tool for the full workflow.

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
- IMPORTANT: Only modify what the user explicitly asked you to change. Do not make unsolicited changes to other sections or fields. If the user asks you to improve their summary, do not also change their work entries, skills, or personal information unless asked.
- Respond in the user's language.
- CRITICAL: Never use placeholder text like [Company Name], [Your Name], etc. If a detail is unknown, use pronouns or omit it.
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
  const [hideDiffs, setHideDiffs] = useState(false);

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
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between px-4 py-2">
          <span className="text-text font-medium">{t('ai.settings')}</span>
          <Button
            variant="ghost"
            onClick={() => setShowSettings(false)}
            className="text-accent px-0 py-0 text-xs hover:bg-transparent hover:underline"
          >
            {apiKey ? t('ai.backToChat') : t('ai.back')}
          </Button>
        </div>
        <AiProviderSettings />
      </div>
    );
  }

  return (
    <div className="bg-bg flex h-full flex-col">
      {/* Header */}
      <div className="bg-bg-secondary/20 flex shrink-0 items-center gap-2 px-4 py-3">
        <ClearChatButton />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setHideDiffs((h) => !h)}
          leftIcon={
            hideDiffs ? (
              <EyeSlash size={12} variant="Bold" color="currentColor" />
            ) : (
              <Eye size={12} variant="Bold" color="currentColor" />
            )
          }
          className={cn(
            'border px-3 text-[10px] font-bold',
            hideDiffs
              ? 'bg-bg-hover/20 text-text-muted hover:bg-bg-hover/30 hover:text-text-muted border-transparent'
              : 'border-border/50',
          )}
          title={hideDiffs ? 'Enable diffs' : 'Disable diffs'}
        >
          DIFFS
        </Button>
        <ModelPickerButton />
        <div className="flex-1" />
        <AiSettingsButton onClick={() => setShowSettings(true)} />
      </div>

      <AiMessageList onSend={handleSend} hideDiffs={hideDiffs} />

      {/* Input */}
      <div className="shrink-0 px-4 pt-2 pb-4 lg:px-16 lg:pb-10">
        <div className="bg-bg focus-within:border-accent focus-within:ring-accent/30 flex items-end gap-3 rounded-3xl border px-4 py-2 transition-all focus-within:ring-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ai.placeholder')}
            rows={1}
            className="text-text flex-1 resize-none overflow-y-auto bg-transparent py-2 text-sm outline-none"
            style={{ maxHeight: 120 }}
          />
          <div className="pb-1">
            {isStreaming ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStop}
                className="text-danger hover:bg-danger/10"
                title={t('ai.stop')}
              >
                <StopCircle size={22} variant="Bold" color="currentColor" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSend(input)}
                disabled={!input.trim()}
                className="text-accent hover:bg-accent/10"
                title={t('ai.send')}
              >
                <Send2 size={22} variant="Bold" color="currentColor" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
