import { geminiProvider } from './provider-gemini';
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

const providers: Record<string, AiProvider> = {
  gemini: geminiProvider,
};

export function getProvider(name: string): AiProvider {
  const p = providers[name];
  if (!p) throw new Error(`Unknown AI provider: ${name}`);
  return p;
}
