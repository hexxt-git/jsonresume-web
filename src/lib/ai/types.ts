/* ── Display & Store types ─────────────────────────────── */

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: number;
}

export interface ToolResultMessage {
  id: string;
  role: 'tool_result';
  toolName: string;
  result: string;
  success: boolean;
  /** Path to the modified field, e.g. ['basics','summary'] or ['skills'] */
  path: string[];
  /** Value of the field before the tool modified it */
  before: unknown;
  /** Value of the field at the moment undo was pressed (set on first undo) */
  after?: unknown;
  /** Whether this tool call is currently undone */
  undone?: boolean;
  timestamp: number;
}

export type AnyMessage = ChatMessage | ToolResultMessage;

/* ── Provider interface ───────────────────────────────── */

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: object;
}

export type StreamEvent = { type: 'text'; content: string } | { type: 'tool_call'; call: ToolCall };

export interface AiProvider {
  name: string;
  models: { id: string; label: string }[];
  streamChat(
    apiKey: string,
    messages: AnyMessage[],
    systemPrompt: string,
    tools?: ToolDeclaration[],
    model?: string,
    signal?: AbortSignal,
  ): AsyncGenerator<StreamEvent>;
  validateKey(apiKey: string): Promise<boolean>;
}
