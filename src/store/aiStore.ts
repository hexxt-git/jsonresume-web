import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AiStore {
  /* persisted */
  apiKeys: Record<string, string>;
  provider: string;
  model: string;

  /* session-only */
  isStreaming: boolean;
  error: string | null;

  /* actions — keys */
  setApiKey: (providerId: string, key: string) => void;
  clearApiKey: (providerId: string) => void;
  getApiKey: (providerId: string) => string;

  /* actions — provider/model */
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;

  /* actions — session */
  setStreaming: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useAiStore = create<AiStore>()(
  persist(
    (set, get) => ({
      apiKeys: {},
      provider: 'gemini',
      model: 'gemini-2.5-flash',

      isStreaming: false,
      error: null,

      setApiKey: (providerId, key) =>
        set((s) => ({ apiKeys: { ...s.apiKeys, [providerId]: key } })),
      clearApiKey: (providerId) =>
        set((s) => {
          const { [providerId]: _, ...rest } = s.apiKeys;
          return { apiKeys: rest };
        }),
      getApiKey: (providerId) => get().apiKeys[providerId] || '',

      setProvider: (provider) => set({ provider }),
      setModel: (model) => set({ model }),

      setStreaming: (isStreaming) => set({ isStreaming }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'ai-store',
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        provider: state.provider,
        model: state.model,
      }),
    },
  ),
);
