import { geminiProvider } from './provider-gemini';
import { openaiProvider } from './provider-openai';
import { anthropicProvider } from './provider-anthropic';
import type { AiProvider } from './types';

export type {
  ChatMessage,
  ToolResultMessage,
  AnyMessage,
  ToolCall,
  ToolDeclaration,
  StreamEvent,
  AiProvider,
} from './types';

/* ── Provider metadata (for settings UI) ─────────────── */

export interface ProviderMeta {
  id: string;
  name: string;
  keyPlaceholder: string;
  keyLink: string;
  keyLinkLabel: string;
  provider: AiProvider;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    keyPlaceholder: 'AIza...',
    keyLink: 'https://aistudio.google.com/apikey',
    keyLinkLabel: 'Google AI Studio',
    provider: geminiProvider,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    keyPlaceholder: 'sk-...',
    keyLink: 'https://platform.openai.com/api-keys',
    keyLinkLabel: 'OpenAI Dashboard',
    provider: openaiProvider,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    keyPlaceholder: 'sk-ant-...',
    keyLink: 'https://console.anthropic.com/settings/keys',
    keyLinkLabel: 'Anthropic Console',
    provider: anthropicProvider,
  },
];

const providerMap: Record<string, AiProvider> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p.provider]),
);

export function getProvider(name: string): AiProvider {
  const p = providerMap[name];
  if (!p) throw new Error(`Unknown AI provider: ${name}`);
  return p;
}

export function getProviderMeta(id: string): ProviderMeta | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
