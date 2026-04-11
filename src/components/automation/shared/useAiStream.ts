import { useState, useRef, useCallback } from 'react';
import { useAiStore } from '../../../store/aiStore';
import { useResumeStore, activeSlot } from '../../../store/resumeStore';
import { getProvider } from '../../../lib/ai';
import type { ToolCall, ToolDeclaration } from '../../../lib/ai';
import {
  resumeToolDeclarations,
  executeResumeTool,
  type ToolExecResult,
} from '../../../lib/ai/resume-tools';

interface ToolCallCapture {
  call: ToolCall;
  result?: ToolExecResult;
}

/**
 * AI streaming hook for automation tools.
 * Independent from the chat — uses its own local state, no global isStreaming.
 */
export function useAiStream() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const getConfig = () => {
    const { apiKeys, provider, model } = useAiStore.getState();
    const key = apiKeys[provider] || '';
    const providerObj = getProvider(provider);
    return { key, providerObj, model };
  };

  const getResumeContext = () => {
    const slot = activeSlot(useResumeStore.getState());
    return JSON.stringify(slot.resume, null, 2);
  };

  /** Run a one-shot text prompt. Returns full response text. */
  const run = useCallback(async (systemPrompt: string, userMessage: string): Promise<string> => {
    const { key, providerObj, model } = getConfig();
    if (!key) throw new Error('No API key configured');

    setIsRunning(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let result = '';
      const stream = providerObj.streamChat(
        key,
        [{ id: '1', role: 'user', content: userMessage, timestamp: Date.now() }],
        systemPrompt,
        undefined,
        model,
        controller.signal,
      );
      for await (const event of stream) {
        if (controller.signal.aborted) break;
        if (event.type === 'text') result += event.content;
      }
      return result.trim();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const msg = err instanceof Error ? err.message : 'AI request failed';
        setError(msg);
        throw err;
      }
      return '';
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, []);

  /** Run a one-shot prompt and stream text chunks via callback. Returns full text. */
  const runStreaming = useCallback(
    async (
      systemPrompt: string,
      userMessage: string,
      onChunk: (accumulated: string) => void,
    ): Promise<string> => {
      const { key, providerObj, model } = getConfig();
      if (!key) throw new Error('No API key configured');

      setIsRunning(true);
      setError(null);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let result = '';
        const stream = providerObj.streamChat(
          key,
          [{ id: '1', role: 'user', content: userMessage, timestamp: Date.now() }],
          systemPrompt,
          undefined,
          model,
          controller.signal,
        );
        for await (const event of stream) {
          if (controller.signal.aborted) break;
          if (event.type === 'text') {
            result += event.content;
            onChunk(result);
          }
        }
        return result.trim();
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const msg = err instanceof Error ? err.message : 'AI request failed';
          setError(msg);
          throw err;
        }
        return '';
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [],
  );

  /**
   * Run with tool declarations. Tool calls are CAPTURED, not auto-executed.
   * Returns text response + list of captured tool calls.
   * Pass `execute: true` to also execute tools against the store.
   */
  const runWithTools = useCallback(
    async (
      systemPrompt: string,
      userMessage: string,
      options?: { execute?: boolean; tools?: ToolDeclaration[] },
    ): Promise<{ text: string; toolCalls: ToolCallCapture[] }> => {
      const { key, providerObj, model } = getConfig();
      if (!key) throw new Error('No API key configured');
      const tools = options?.tools ?? resumeToolDeclarations;

      setIsRunning(true);
      setError(null);
      const controller = new AbortController();
      abortRef.current = controller;

      const allCaptures: ToolCallCapture[] = [];
      let fullText = '';

      try {
        const MAX_LOOPS = 10;
        // Local message history for multi-turn tool use
        const messages: {
          id: string;
          role: 'user' | 'assistant' | 'tool_result';
          content: string;
          toolCalls?: ToolCall[];
          toolName?: string;
          result?: string;
          success?: boolean;
          before?: unknown;
          timestamp: number;
        }[] = [{ id: '1', role: 'user', content: userMessage, timestamp: Date.now() }];

        for (let loop = 0; loop < MAX_LOOPS; loop++) {
          if (controller.signal.aborted) break;

          let accumulated = '';
          const toolCalls: ToolCall[] = [];

          const stream = providerObj.streamChat(
            key,
            messages as any,
            systemPrompt,
            tools,
            model,
            controller.signal,
          );

          for await (const event of stream) {
            if (controller.signal.aborted) break;
            if (event.type === 'text') {
              accumulated += event.content;
            } else if (event.type === 'tool_call') {
              toolCalls.push(event.call);
            }
          }

          if (accumulated) fullText += (fullText ? '\n' : '') + accumulated;

          // Add assistant message to local history
          messages.push({
            id: String(Date.now()),
            role: 'assistant',
            content: accumulated,
            toolCalls: toolCalls.length ? toolCalls : undefined,
            timestamp: Date.now(),
          });

          if (controller.signal.aborted || toolCalls.length === 0) break;

          // Process tool calls
          for (const call of toolCalls) {
            const capture: ToolCallCapture = { call };
            if (options?.execute) {
              capture.result = executeResumeTool(call);
            }
            allCaptures.push(capture);

            // Add tool result to local history for next loop
            messages.push({
              id: String(Date.now()),
              role: 'tool_result',
              content: '',
              toolName: call.name,
              result: capture.result?.message ?? `Captured: ${call.name}`,
              success: capture.result?.success ?? true,
              before: capture.result?.before,
              timestamp: Date.now(),
            });
          }
        }

        return { text: fullText.trim(), toolCalls: allCaptures };
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const msg = err instanceof Error ? err.message : 'AI request failed';
          setError(msg);
          throw err;
        }
        return { text: '', toolCalls: [] };
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { run, runStreaming, runWithTools, isRunning, error, setError, abort, getResumeContext };
}
