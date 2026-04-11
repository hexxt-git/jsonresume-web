import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnyMessage, ToolCall } from '../lib/ai';

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

interface AiStore {
  /* persisted */
  apiKey: string;
  provider: string;
  model: string;

  /* session-only */
  messages: AnyMessage[];
  isStreaming: boolean;
  error: string | null;

  /* actions */
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  setModel: (model: string) => void;

  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  updateLastAssistantMessage: (content: string) => void;
  addToolCallsToLastAssistant: (calls: ToolCall[]) => void;
  addToolResult: (
    toolName: string,
    result: string,
    success: boolean,
    path: string[],
    before: unknown,
  ) => void;
  toggleToolUndo: (id: string, after: unknown) => void;
  removeLastMessage: () => void;
  removeToolResult: (id: string) => void;

  setMessages: (messages: AnyMessage[]) => void;
  setStreaming: (v: boolean) => void;
  setError: (e: string | null) => void;
  clearMessages: () => void;
}

export const useAiStore = create<AiStore>()(
  persist(
    (set) => ({
      apiKey: '',
      provider: 'gemini',
      model: 'gemini-2.5-flash',

      messages: [],
      isStreaming: false,
      error: null,

      setApiKey: (apiKey) => set({ apiKey }),
      clearApiKey: () => set({ apiKey: '' }),
      setModel: (model) => set({ model }),

      addUserMessage: (content) =>
        set((s) => ({
          messages: [
            ...s.messages,
            { id: makeId(), role: 'user' as const, content, timestamp: Date.now() },
          ],
        })),

      addAssistantMessage: (content) =>
        set((s) => ({
          messages: [
            ...s.messages,
            { id: makeId(), role: 'assistant' as const, content, timestamp: Date.now() },
          ],
        })),

      updateLastAssistantMessage: (content) =>
        set((s) => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant') {
            msgs[msgs.length - 1] = { ...last, content };
          }
          return { messages: msgs };
        }),

      addToolCallsToLastAssistant: (calls) =>
        set((s) => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant') {
            msgs[msgs.length - 1] = {
              ...last,
              toolCalls: [...(last.toolCalls || []), ...calls],
            };
          }
          return { messages: msgs };
        }),

      addToolResult: (toolName, result, success, path, before) =>
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id: makeId(),
              role: 'tool_result' as const,
              toolName,
              result,
              success,
              path,
              before,
              timestamp: Date.now(),
            },
          ],
        })),

      toggleToolUndo: (id, after) =>
        set((s) => ({
          messages: s.messages.map((m) => {
            if (m.id !== id || m.role !== 'tool_result') return m;
            if (m.undone) {
              // Redo: clear undone state
              return { ...m, undone: false };
            }
            // Undo: store current value as after
            return { ...m, after, undone: true };
          }),
        })),

      removeLastMessage: () => set((s) => ({ messages: s.messages.slice(0, -1) })),

      removeToolResult: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

      setMessages: (messages) => set({ messages }),
      setStreaming: (isStreaming) => set({ isStreaming }),
      setError: (error) => set({ error }),
      clearMessages: () => set({ messages: [], error: null }),
    }),
    {
      name: 'ai-store',
      partialize: (state) => ({
        apiKey: state.apiKey,
        provider: state.provider,
        model: state.model,
      }),
    },
  ),
);
