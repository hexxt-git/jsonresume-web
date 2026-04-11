import { GoogleGenAI } from '@google/genai';
import type { AiProvider, AnyMessage, StreamEvent, ToolDeclaration } from './types';

const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Convert our message array into the Gemini contents format.
 * Handles text messages, assistant tool calls, and tool results.
 */
function toGeminiContents(messages: AnyMessage[]) {
  const contents: {
    role: 'user' | 'model';
    parts: Record<string, unknown>[];
  }[] = [];

  for (const m of messages) {
    if (m.role === 'user') {
      if (!m.content) continue;
      contents.push({ role: 'user', parts: [{ text: m.content }] });
    } else if (m.role === 'assistant') {
      const parts: Record<string, unknown>[] = [];
      if (m.content) parts.push({ text: m.content });
      if (m.toolCalls) {
        for (const tc of m.toolCalls) {
          parts.push({ functionCall: { name: tc.name, args: tc.args } });
        }
      }
      if (parts.length) contents.push({ role: 'model', parts });
    } else if (m.role === 'tool_result') {
      // Function responses go as user messages
      contents.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: m.toolName,
              response: { result: m.result, success: m.success },
            },
          },
        ],
      });
    }
  }

  return contents;
}

function toGeminiTools(tools: ToolDeclaration[]) {
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    },
  ];
}

export const geminiProvider: AiProvider = {
  name: 'gemini',

  models: [
    { id: 'gemini-2.5-flash', label: '2.5 Flash' },
    { id: 'gemini-2.5-pro', label: '2.5 Pro' },
    { id: 'gemini-2.0-flash', label: '2.0 Flash' },
  ],

  async *streamChat(apiKey, messages, systemPrompt, tools, model, signal) {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContentStream({
      model: model || DEFAULT_MODEL,
      contents: toGeminiContents(messages),
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 8192,
        abortSignal: signal,
        ...(tools?.length ? { tools: toGeminiTools(tools) } : {}),
      },
    });

    for await (const chunk of response) {
      if (signal?.aborted) break;

      // Text content
      const text = chunk.text;
      if (text) {
        yield { type: 'text', content: text } satisfies StreamEvent;
      }

      // Function calls — access via the raw candidates structure
      const raw = chunk as unknown as {
        candidates?: {
          content?: {
            parts?: {
              functionCall?: { name: string; args: Record<string, unknown> };
            }[];
          };
        }[];
      };

      if (raw.candidates?.[0]?.content?.parts) {
        for (const part of raw.candidates[0].content.parts) {
          if (part.functionCall) {
            yield {
              type: 'tool_call',
              call: {
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                name: part.functionCall.name,
                args: part.functionCall.args,
              },
            } satisfies StreamEvent;
          }
        }
      }
    }
  },

  async validateKey(apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: 'Hi',
        config: { maxOutputTokens: 1 },
      });
      return true;
    } catch {
      return false;
    }
  },
};
