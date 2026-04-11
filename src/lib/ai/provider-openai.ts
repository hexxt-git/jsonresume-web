import OpenAI from 'openai';
import type { AiProvider, AnyMessage, StreamEvent, ToolDeclaration } from './types';

const DEFAULT_MODEL = 'gpt-5.4-mini';

function toOpenAIMessages(
  messages: AnyMessage[],
  systemPrompt: string,
): OpenAI.ChatCompletionMessageParam[] {
  const out: OpenAI.ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompt }];

  for (const m of messages) {
    if (m.role === 'user') {
      if (m.content) out.push({ role: 'user', content: m.content });
    } else if (m.role === 'assistant') {
      const msg: OpenAI.ChatCompletionAssistantMessageParam = { role: 'assistant' };
      if (m.content) msg.content = m.content;
      if (m.toolCalls?.length) {
        msg.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: JSON.stringify(tc.args) },
        }));
      }
      out.push(msg);
    } else if (m.role === 'tool_result') {
      out.push({
        role: 'tool',
        tool_call_id: m.id,
        content: JSON.stringify({ result: m.result, success: m.success, previous_value: m.before }),
      });
    }
  }

  return out;
}

function toOpenAITools(tools: ToolDeclaration[]): OpenAI.ChatCompletionTool[] {
  return tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters as OpenAI.FunctionParameters,
    },
  }));
}

export const openaiProvider: AiProvider = {
  name: 'openai',

  models: [
    { id: 'gpt-5.4-nano', label: 'GPT-5.4 Nano' },
    { id: 'gpt-5.4-mini', label: 'GPT-5.4 Mini' },
    { id: 'gpt-5.4', label: 'GPT-5.4' },
    { id: 'gpt-5.2', label: 'GPT-5.2' },
    { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { id: 'gpt-4.1', label: 'GPT-4.1' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'o4-mini', label: 'o4 Mini' },
    { id: 'o3-mini', label: 'o3 Mini' },
  ],

  async *streamChat(apiKey, messages, systemPrompt, tools, model, signal) {
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const stream = await client.chat.completions.create(
      {
        model: model || DEFAULT_MODEL,
        messages: toOpenAIMessages(messages, systemPrompt),
        ...(tools?.length ? { tools: toOpenAITools(tools) } : {}),
        stream: true,
      },
      { signal },
    );

    const toolCallBuffers: Record<number, { id: string; name: string; args: string }> = {};

    for await (const chunk of stream) {
      if (signal?.aborted) break;
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        yield { type: 'text', content: delta.content } satisfies StreamEvent;
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCallBuffers[tc.index]) {
            toolCallBuffers[tc.index] = { id: tc.id || '', name: '', args: '' };
          }
          const buf = toolCallBuffers[tc.index];
          if (tc.id) buf.id = tc.id;
          if (tc.function?.name) buf.name += tc.function.name;
          if (tc.function?.arguments) buf.args += tc.function.arguments;
        }
      }
    }

    // Yield completed tool calls
    for (const buf of Object.values(toolCallBuffers)) {
      if (buf.name) {
        try {
          yield {
            type: 'tool_call',
            call: {
              id: buf.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
              name: buf.name,
              args: JSON.parse(buf.args || '{}'),
            },
          } satisfies StreamEvent;
        } catch {
          // malformed JSON args — skip
        }
      }
    }
  },

  async validateKey(apiKey) {
    try {
      const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  },
};
