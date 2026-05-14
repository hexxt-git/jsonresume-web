import { useState, type ReactNode } from 'react';
import { useAiStore } from '../../store/aiStore';
import { getProvider } from '../../lib/ai';
import {
  MagicStar,
  Edit,
  Briefcase,
  TextalignJustifycenter,
  MessageSquare,
  Chart,
  CloseCircle,
} from 'iconsax-react';
import { useGoToAi } from '../editor/EditorContext';
import { useResumeStore, activeSlot } from '../../store/resumeStore';
import { InlineDiffView, ListDiffView, computeListDiff } from './DiffView';

type Tool = {
  id: string;
  label: string;
  icon: typeof Edit;
  prompt: string;
};

const TEXT_TOOLS: Tool[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    icon: Edit,
    prompt:
      'Summarize this text concisely, keeping all key points. Return only the result. you must make the content at least 30% shorter.',
  },
  {
    id: 'quantify',
    label: 'Quantify',
    icon: Chart,
    prompt:
      'Quantify the items. You can either add metrics to the items, or add more tangible details to the items.',
  },
  {
    id: 'professional',
    label: 'Professional',
    icon: Briefcase,
    prompt:
      'Rewrite this text in a professional, polished tone suitable for a resume. Return only the result.',
  },
  {
    id: 'bullets',
    label: 'Bullets',
    icon: TextalignJustifycenter,
    prompt:
      'Convert this text into concise bullet points, one per line starting with "- ". Return only the bullet points.',
  },
];

const LIST_TOOLS: Tool[] = [
  {
    id: 'professional',
    label: 'Professional Tone',
    icon: Briefcase,
    prompt:
      'Rewrite each item with a professional tone. Correct any spelling, capitalization, or grammar errors.',
  },
  {
    id: 'quantify',
    label: 'Quantify',
    icon: Chart,
    prompt:
      'Quantify the items. You can either add metrics to the items, or add more tangible details to the items.',
  },
  {
    id: 'expand',
    label: 'Expand',
    icon: Edit,
    prompt:
      'Expand each item with more detail and impact. Explain with relevant terminology. You can also add more items to the list.',
  },
  {
    id: 'concise',
    label: 'Make Concise',
    icon: TextalignJustifycenter,
    prompt:
      'Make each item shorter and more impactful. Remove filler words. You must make the content at least 30% shorter.',
  },
];

const SYSTEM_TEXT =
  'You are a resume writing assistant. This text is part of a professional resume. Use third person or implied first person (no "I" or "my" — use action verbs like "Led", "Built", "Managed"). Follow the instruction exactly. Return only the rewritten text, nothing else.';

const SYSTEM_LIST =
  'You are a resume writing assistant. This is a list of items from a professional resume (highlights, skills, courses, etc). Use action verbs, no "I" or "my". You MUST respond with ONLY a JSON array of strings — no markdown, no explanation. Example: ["Item one", "Item two"]';

/* ── Types ───────────────────────────────────────────── */

interface TextProps {
  mode: 'text';
  value: string;
  onChange: (v: string) => void;
  context?: string;
  children: ReactNode;
}

interface ListProps {
  mode: 'list';
  items: string[];
  onChange: (items: string[]) => void;
  context?: string;
  children: ReactNode;
}

type Props = TextProps | ListProps;

type State =
  | { phase: 'idle' }
  | { phase: 'processing' }
  | { phase: 'review'; oldValue: string; newValue: string }
  | { phase: 'review-list'; oldItems: string[]; newItems: string[] };

/* ── Component ───────────────────────────────────────── */

export function AiWritingTools(props: Props) {
  const apiKeys = useAiStore((s) => s.apiKeys);
  const provider = useAiStore((s) => s.provider);
  const model = useAiStore((s) => s.model);
  const hasKey = !!apiKeys[provider];
  const goToAi = useGoToAi();

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ phase: 'idle' });

  const isEmpty = props.mode === 'text' ? !props.value.trim() : props.items.length === 0;
  const tools = props.mode === 'text' ? TEXT_TOOLS : LIST_TOOLS;
  const isProcessing = state.phase === 'processing';
  const isReview = state.phase === 'review' || state.phase === 'review-list';

  const disabledReason = !hasKey
    ? 'Set up an AI provider first'
    : isEmpty
      ? 'Write something first'
      : null;

  /* ── Run AI tool ────────────────────────────────────── */

  const run = async (prompt: string) => {
    if (isEmpty || isProcessing) return;
    setOpen(false);
    setState({ phase: 'processing' });
    try {
      const providerObj = getProvider(provider);
      const key = apiKeys[provider];

      const isList = props.mode === 'list';
      const inputText = isList ? JSON.stringify(props.items) : props.value;

      const basics = activeSlot(useResumeStore.getState()).resume.basics;
      const who = [basics?.name, basics?.label].filter(Boolean).join(', ');
      const where = props.context || '';
      const ctx = [who && `Resume of: ${who}`, where && `Editing: ${where}`]
        .filter(Boolean)
        .join('. ');

      const system = (isList ? SYSTEM_LIST : SYSTEM_TEXT) + (ctx ? `\n${ctx}.` : '');

      let result = '';
      const stream = providerObj.streamChat(
        key,
        [
          {
            id: '1',
            role: 'user',
            content: `${prompt}\n\nInput:\n${inputText}`,
            timestamp: Date.now(),
          },
        ],
        system,
        undefined,
        model,
      );
      for await (const event of stream) {
        if (event.type === 'text') result += event.content;
      }

      const trimmed = result.trim();
      if (!trimmed) {
        setState({ phase: 'idle' });
        return;
      }

      if (isList) {
        const cleaned = trimmed.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
        let newItems: string[];
        try {
          const arr = JSON.parse(cleaned);
          newItems = Array.isArray(arr)
            ? arr.map((s: unknown) => String(s).trim()).filter(Boolean)
            : [];
        } catch {
          newItems = trimmed
            .split('\n')
            .map((l) =>
              l
                .replace(/^[-•*]\s*/, '')
                .replace(/^"\s*|\s*",?\s*$/g, '')
                .trim(),
            )
            .filter(Boolean);
        }
        if (newItems.length) {
          setState({ phase: 'review-list', oldItems: props.items, newItems });
        } else {
          setState({ phase: 'idle' });
        }
      } else {
        setState({ phase: 'review', oldValue: props.value, newValue: trimmed });
      }
    } catch {
      setState({ phase: 'idle' });
    }
  };

  const accept = () => {
    if (state.phase === 'review') {
      (props as TextProps).onChange(state.newValue);
    } else if (state.phase === 'review-list') {
      (props as ListProps).onChange(state.newItems);
    }
    setState({ phase: 'idle' });
  };

  const reject = () => {
    setState({ phase: 'idle' });
  };

  /* ── Trigger button (absolute, top-right of field) ──── */

  let triggerButton: ReactNode = null;

  if (disabledReason && !isReview && !isProcessing) {
    const clickable = !hasKey;
    triggerButton = (
      <div className="group absolute top-1 right-1 z-10 p-1">
        <button
          type="button"
          onClick={clickable ? goToAi : undefined}
          disabled={!clickable}
          className={`bg-bg-secondary text-text-faint flex h-7 w-7 items-center justify-center rounded-full border opacity-40 transition-all ${clickable ? 'cursor-pointer hover:opacity-70' : 'cursor-not-allowed'}`}
        >
          <MagicStar size={12} variant="Bold" color="currentColor" />
        </button>
        <div className="bg-bg-tertiary absolute top-full right-0 z-50 mt-1 hidden rounded-full border px-3 py-1.5 whitespace-nowrap shadow-xl group-hover:block">
          {clickable ? (
            <button
              type="button"
              onClick={goToAi}
              className="text-accent cursor-pointer text-[10px] font-bold tracking-wider uppercase"
            >
              {disabledReason} &rarr;
            </button>
          ) : (
            <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase">
              {disabledReason}
            </span>
          )}
        </div>
      </div>
    );
  } else if (isProcessing) {
    triggerButton = (
      <div className="absolute top-1 right-1 z-10 p-1">
        <button
          type="button"
          disabled
          className="bg-accent/10 border-accent/20 text-accent flex h-7 w-7 animate-pulse cursor-wait items-center justify-center rounded-full border"
        >
          <MagicStar size={12} variant="Bold" color="currentColor" />
        </button>
      </div>
    );
  } else if (!isReview) {
    triggerButton = (
      <div className="absolute top-1 right-1 z-10 p-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="bg-bg-secondary text-text-muted hover:text-accent hover:bg-bg-hover flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-all"
          title="AI writing tools"
        >
          <MagicStar size={12} variant="Bold" color="currentColor" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setOpen(false)} />
            <div className="bg-bg absolute top-9 right-0 z-50 w-56 space-y-3 rounded-2xl border p-3 shadow-2xl">
              <h3 className="text-text-muted px-2 text-center text-[10px] font-bold tracking-widest uppercase">
                AI Writing Tools
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => run(tool.prompt)}
                      className="text-text-secondary bg-bg-secondary/50 hover:bg-bg-hover hover:text-accent border-border/40 flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-all"
                    >
                      <Icon size={20} variant="Bold" color="currentColor" />
                      <span className="text-center text-[10px] leading-tight font-bold">
                        {tool.label.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    goToAi();
                  }}
                  className="text-accent bg-accent/5 hover:bg-accent/10 border-accent/20 col-span-full flex cursor-pointer items-center justify-center gap-2 rounded-full border px-3 py-2.5 transition-all"
                >
                  <MessageSquare size={14} variant="Bold" color="currentColor" />
                  <span className="text-center text-[10px] font-bold tracking-widest uppercase">
                    Open AI Chat
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────── */

  return (
    <div>
      {/* Field container with overlays */}
      <div className="relative">
        {props.children}
        {triggerButton}

        {/* Processing shimmer */}
        {isProcessing && (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl">
            <div className="ai-shimmer absolute inset-0" />
          </div>
        )}

        {/* Review diff overlay */}
        {isReview && (
          <div className="bg-bg border-accent/30 absolute inset-0 z-10 overflow-auto rounded-2xl border p-4 shadow-inner">
            {state.phase === 'review' ? (
              <InlineDiffView oldText={state.oldValue} newText={state.newValue} />
            ) : state.phase === 'review-list' ? (
              <ListDiffView items={computeListDiff(state.oldItems, state.newItems)} />
            ) : null}
          </div>
        )}
      </div>

      {/* Accept/reject below the field, in normal flow */}
      {isReview && (
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={reject}
            className="text-text-muted hover:text-danger border-border/50 hover:bg-danger/5 flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase transition-all"
          >
            <CloseCircle size={14} variant="Bold" color="currentColor" />
            Reject
          </button>
          <button
            type="button"
            onClick={accept}
            className="text-accent border-accent/20 bg-accent/5 flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase transition-all hover:opacity-80"
          >
            <MagicStar size={14} variant="Bold" color="currentColor" />
            Accept
          </button>
        </div>
      )}
    </div>
  );
}
