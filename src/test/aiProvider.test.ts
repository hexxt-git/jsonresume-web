import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProvider } from '../lib/ai';
import type { AiProvider, AnyMessage, StreamEvent } from '../lib/ai';

const mockGenerateContentStream = vi.fn();
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: function () {
    return {
      models: {
        generateContentStream: mockGenerateContentStream,
        generateContent: mockGenerateContent,
      },
    };
  },
}));

describe('getProvider', () => {
  it('returns gemini provider', () => {
    const p = getProvider('gemini');
    expect(p.name).toBe('gemini');
  });

  it('throws for unknown provider', () => {
    expect(() => getProvider('unknown')).toThrow('Unknown AI provider: unknown');
  });

  it('exposes model list', () => {
    const p = getProvider('gemini');
    expect(p.models.length).toBeGreaterThan(0);
    expect(p.models[0]).toHaveProperty('id');
    expect(p.models[0]).toHaveProperty('label');
  });
});

describe('gemini provider - streamChat', () => {
  let provider: AiProvider;
  const messages: AnyMessage[] = [{ id: '1', role: 'user', content: 'hello', timestamp: 1 }];

  beforeEach(() => {
    vi.clearAllMocks();
    provider = getProvider('gemini');
  });

  it('yields text events from stream', async () => {
    const chunks = [{ text: 'Hello' }, { text: ' world' }, { text: '!' }];
    mockGenerateContentStream.mockResolvedValue(
      (async function* () {
        for (const c of chunks) yield c;
      })(),
    );

    const result: StreamEvent[] = [];
    for await (const event of provider.streamChat('key', messages, 'system')) {
      result.push(event);
    }
    expect(result).toEqual([
      { type: 'text', content: 'Hello' },
      { type: 'text', content: ' world' },
      { type: 'text', content: '!' },
    ]);
  });

  it('skips empty text chunks', async () => {
    mockGenerateContentStream.mockResolvedValue(
      (async function* () {
        yield { text: 'Hi' };
        yield { text: '' };
        yield { text: undefined };
        yield { text: ' there' };
      })(),
    );

    const result: StreamEvent[] = [];
    for await (const event of provider.streamChat('key', messages, 'system')) {
      result.push(event);
    }
    expect(result).toEqual([
      { type: 'text', content: 'Hi' },
      { type: 'text', content: ' there' },
    ]);
  });

  it('yields tool_call events for function calls', async () => {
    mockGenerateContentStream.mockResolvedValue(
      (async function* () {
        yield {
          text: 'Updating...',
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: 'update_summary',
                      args: { summary: 'New summary' },
                    },
                  },
                ],
              },
            },
          ],
        };
      })(),
    );

    const result: StreamEvent[] = [];
    for await (const event of provider.streamChat('key', messages, 'system', [])) {
      result.push(event);
    }

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'text', content: 'Updating...' });
    expect(result[1].type).toBe('tool_call');
    if (result[1].type === 'tool_call') {
      expect(result[1].call.name).toBe('update_summary');
      expect(result[1].call.args).toEqual({ summary: 'New summary' });
      expect(result[1].call.id).toBeTruthy();
    }
  });

  it('passes system prompt, tools, and model to API', async () => {
    mockGenerateContentStream.mockResolvedValue(
      (async function* () {
        yield { text: 'ok' };
      })(),
    );

    const msgs: AnyMessage[] = [
      { id: '1', role: 'user', content: 'q1', timestamp: 1 },
      { id: '2', role: 'assistant', content: 'a1', timestamp: 2 },
      { id: '3', role: 'user', content: 'q2', timestamp: 3 },
    ];

    const tools = [{ name: 'test', description: 'test tool', parameters: {} }];

    for await (const _ of provider.streamChat(
      'test-key',
      msgs,
      'be helpful',
      tools,
      'gemini-2.5-pro',
    )) {
      void _;
    }

    expect(mockGenerateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-pro',
        contents: [
          { role: 'user', parts: [{ text: 'q1' }] },
          { role: 'model', parts: [{ text: 'a1' }] },
          { role: 'user', parts: [{ text: 'q2' }] },
        ],
        config: expect.objectContaining({
          systemInstruction: 'be helpful',
          tools: [
            { functionDeclarations: [{ name: 'test', description: 'test tool', parameters: {} }] },
          ],
        }),
      }),
    );
  });

  it('converts tool_result messages to function responses', async () => {
    mockGenerateContentStream.mockResolvedValue(
      (async function* () {
        yield { text: 'ok' };
      })(),
    );

    const msgs: AnyMessage[] = [
      { id: '1', role: 'user', content: 'hello', timestamp: 1 },
      {
        id: '2',
        role: 'assistant',
        content: 'updating',
        toolCalls: [{ id: 'tc1', name: 'update_summary', args: { summary: 'new' } }],
        timestamp: 2,
      },
      {
        id: '3',
        role: 'tool_result',
        toolName: 'update_summary',
        result: 'Updated',
        success: true,
        path: ['basics', 'summary'],
        before: 'old',
        timestamp: 3,
      },
    ];

    for await (const _ of provider.streamChat('key', msgs, 'sys')) {
      void _;
    }

    const call = mockGenerateContentStream.mock.calls[0][0];
    expect(call.contents[1]).toEqual({
      role: 'model',
      parts: [
        { text: 'updating' },
        { functionCall: { name: 'update_summary', args: { summary: 'new' } } },
      ],
    });
    expect(call.contents[2]).toEqual({
      role: 'user',
      parts: [
        {
          functionResponse: {
            name: 'update_summary',
            response: { result: 'Updated', success: true },
          },
        },
      ],
    });
  });

  it('filters out messages with empty content', async () => {
    mockGenerateContentStream.mockResolvedValue(
      (async function* () {
        yield { text: 'ok' };
      })(),
    );

    const msgs: AnyMessage[] = [
      { id: '1', role: 'user', content: 'hello', timestamp: 1 },
      { id: '2', role: 'assistant', content: '', timestamp: 2 },
    ];

    for await (const _ of provider.streamChat('key', msgs, 'sys')) {
      void _;
    }

    const call = mockGenerateContentStream.mock.calls[0][0];
    expect(call.contents).toEqual([{ role: 'user', parts: [{ text: 'hello' }] }]);
  });

  it('stops on abort signal', async () => {
    const controller = new AbortController();

    mockGenerateContentStream.mockResolvedValue(
      (async function* () {
        yield { text: 'first' };
        controller.abort();
        yield { text: 'second' };
      })(),
    );

    const result: StreamEvent[] = [];
    for await (const event of provider.streamChat(
      'key',
      messages,
      'system',
      undefined,
      undefined,
      controller.signal,
    )) {
      result.push(event);
    }
    expect(result).toEqual([{ type: 'text', content: 'first' }]);
  });
});

describe('gemini provider - validateKey', () => {
  let provider: AiProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = getProvider('gemini');
  });

  it('returns true for valid key', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'hi' });
    const result = await provider.validateKey('valid-key');
    expect(result).toBe(true);
  });

  it('returns false for invalid key', async () => {
    mockGenerateContent.mockRejectedValue(new Error('401 Unauthorized'));
    const result = await provider.validateKey('bad-key');
    expect(result).toBe(false);
  });

  it('calls API with minimal config', async () => {
    mockGenerateContent.mockResolvedValue({ text: '' });
    await provider.validateKey('my-key');
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        contents: 'Hi',
        config: { maxOutputTokens: 1 },
      }),
    );
  });
});
