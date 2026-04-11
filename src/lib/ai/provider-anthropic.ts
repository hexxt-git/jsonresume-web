import Anthropic from '@anthropic-ai/sdk';
import type { AiProvider, AnyMessage, StreamEvent, ToolDeclaration } from './types';

const DEFAULT_MODEL = 'claude-sonnet-4-6-20260311';

function toAnthropicMessages(messages: AnyMessage[]): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];

  for (const m of messages) {
    if (m.role === 'user') {
      if (m.content) out.push({ role: 'user', content: m.content });
    } else if (m.role === 'assistant') {
      const content: Anthropic.ContentBlockParam[] = [];
      if (m.content) content.push({ type: 'text', text: m.content });
      if (m.toolCalls) {
        for (const tc of m.toolCalls) {
          content.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.args });
        }
      }
      if (content.length) out.push({ role: 'assistant', content });
    } else if (m.role === 'tool_result') {
      // Anthropic expects tool_result as a user message with tool_result content blocks
      // Check if the last message is already a user message with tool results — merge
      const last = out[out.length - 1];
      const block: Anthropic.ToolResultBlockParam = {
        type: 'tool_result',
        tool_use_id: m.id,
        content: JSON.stringify({ result: m.result, success: m.success }),
      };
      if (last?.role === 'user' && Array.isArray(last.content)) {
        (last.content as Anthropic.ContentBlockParam[]).push(block);
      } else {
        out.push({ role: 'user', content: [block] });
      }
    }
  }

  return out;
}

function toAnthropicTools(tools: ToolDeclaration[]): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters as Anthropic.Tool.InputSchema,
  }));
}

export const anthropicProvider: AiProvider = {
  name: 'anthropic',

  models: [
    { id: 'claude-opus-4-6-20260311', label: 'Claude Opus 4.6' },
    { id: 'claude-sonnet-4-6-20260311', label: 'Claude Sonnet 4.6' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    { id: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  ],

  async *streamChat(apiKey, messages, systemPrompt, tools, model, signal) {
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const stream = client.messages.stream(
      {
        model: model || DEFAULT_MODEL,
        max_tokens: 8192,
        system: systemPrompt,
        messages: toAnthropicMessages(messages),
        ...(tools?.length ? { tools: toAnthropicTools(tools) } : {}),
      },
      { signal },
    );

    let currentToolId = '';
    let currentToolName = '';
    let toolJsonBuf = '';

    for await (const event of stream) {
      if (signal?.aborted) break;

      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          currentToolId = event.content_block.id;
          currentToolName = event.content_block.name;
          toolJsonBuf = '';
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield { type: 'text', content: event.delta.text } satisfies StreamEvent;
        } else if (event.delta.type === 'input_json_delta') {
          toolJsonBuf += event.delta.partial_json;
        }
      } else if (event.type === 'content_block_stop') {
        if (currentToolName) {
          try {
            yield {
              type: 'tool_call',
              call: {
                id: currentToolId,
                name: currentToolName,
                args: JSON.parse(toolJsonBuf || '{}'),
              },
            } satisfies StreamEvent;
          } catch {
            // malformed JSON
          }
          currentToolId = '';
          currentToolName = '';
          toolJsonBuf = '';
        }
      }
    }
  },

  async validateKey(apiKey) {
    try {
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
      await client.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return true;
    } catch {
      return false;
    }
  },
};
