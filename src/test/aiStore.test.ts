import { describe, it, expect, beforeEach } from 'vitest';
import { useAiStore } from '../store/aiStore';
import type { AnyMessage } from '../lib/ai';

function asChat(m: AnyMessage) {
  if (m.role === 'user' || m.role === 'assistant') return m;
  throw new Error('Not a chat message');
}

describe('aiStore', () => {
  beforeEach(() => {
    const s = useAiStore.getState();
    s.clearMessages();
    // Clear all provider keys
    Object.keys(s.apiKeys).forEach((k) => s.clearApiKey(k));
    s.setStreaming(false);
    s.setError(null);
  });

  it('starts with empty state', () => {
    const s = useAiStore.getState();
    expect(s.apiKeys).toEqual({});
    expect(s.provider).toBe('gemini');
    expect(s.model).toBe('gemini-2.5-flash');
    expect(s.messages).toEqual([]);
    expect(s.isStreaming).toBe(false);
    expect(s.error).toBeNull();
  });

  it('setApiKey persists key per provider', () => {
    useAiStore.getState().setApiKey('gemini', 'test-key-123');
    expect(useAiStore.getState().apiKeys.gemini).toBe('test-key-123');
    expect(useAiStore.getState().getApiKey('gemini')).toBe('test-key-123');
  });

  it('clearApiKey removes key for provider', () => {
    useAiStore.getState().setApiKey('gemini', 'test-key-123');
    useAiStore.getState().clearApiKey('gemini');
    expect(useAiStore.getState().apiKeys.gemini).toBeUndefined();
    expect(useAiStore.getState().getApiKey('gemini')).toBe('');
  });

  it('setModel updates model', () => {
    useAiStore.getState().setModel('gemini-2.5-pro');
    expect(useAiStore.getState().model).toBe('gemini-2.5-pro');
  });

  it('addUserMessage appends user message', () => {
    useAiStore.getState().addUserMessage('hello');
    const msgs = useAiStore.getState().messages;
    expect(msgs).toHaveLength(1);
    const m = asChat(msgs[0]);
    expect(m.role).toBe('user');
    expect(m.content).toBe('hello');
    expect(m.id).toBeTruthy();
    expect(m.timestamp).toBeGreaterThan(0);
  });

  it('addAssistantMessage appends assistant message', () => {
    useAiStore.getState().addAssistantMessage('hi there');
    const msgs = useAiStore.getState().messages;
    expect(msgs).toHaveLength(1);
    const m = asChat(msgs[0]);
    expect(m.role).toBe('assistant');
    expect(m.content).toBe('hi there');
  });

  it('updateLastAssistantMessage updates last assistant message content', () => {
    useAiStore.getState().addUserMessage('hello');
    useAiStore.getState().addAssistantMessage('');
    useAiStore.getState().updateLastAssistantMessage('partial');
    useAiStore.getState().updateLastAssistantMessage('partial response');

    const msgs = useAiStore.getState().messages;
    expect(msgs).toHaveLength(2);
    expect(asChat(msgs[1]).content).toBe('partial response');
  });

  it('updateLastAssistantMessage does nothing if last message is user', () => {
    useAiStore.getState().addUserMessage('hello');
    useAiStore.getState().updateLastAssistantMessage('nope');
    expect(asChat(useAiStore.getState().messages[0]).content).toBe('hello');
  });

  it('addToolCallsToLastAssistant attaches tool calls', () => {
    useAiStore.getState().addAssistantMessage('I will update your summary');
    useAiStore
      .getState()
      .addToolCallsToLastAssistant([
        { id: 'tc1', name: 'update_summary', args: { summary: 'new' } },
      ]);
    const m = asChat(useAiStore.getState().messages[0]);
    expect(m.toolCalls).toHaveLength(1);
    expect(m.toolCalls![0].name).toBe('update_summary');
  });

  it('addToolResult adds a tool result message with path and before', () => {
    useAiStore
      .getState()
      .addToolResult('update_summary', 'Updated summary', true, ['basics', 'summary'], 'old value');
    const msgs = useAiStore.getState().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].role).toBe('tool_result');
    if (msgs[0].role === 'tool_result') {
      expect(msgs[0].toolName).toBe('update_summary');
      expect(msgs[0].success).toBe(true);
      expect(msgs[0].path).toEqual(['basics', 'summary']);
      expect(msgs[0].before).toBe('old value');
      expect(msgs[0].undone).toBeUndefined();
    }
  });

  it('toggleToolUndo sets after and undone on first toggle', () => {
    useAiStore.getState().addToolResult('update_summary', 'ok', true, ['basics', 'summary'], 'old');
    const id = useAiStore.getState().messages[0].id;
    useAiStore.getState().toggleToolUndo(id, 'current value');
    const msg = useAiStore.getState().messages[0];
    if (msg.role === 'tool_result') {
      expect(msg.undone).toBe(true);
      expect(msg.after).toBe('current value');
    }
  });

  it('toggleToolUndo clears undone on second toggle', () => {
    useAiStore.getState().addToolResult('update_summary', 'ok', true, ['basics', 'summary'], 'old');
    const id = useAiStore.getState().messages[0].id;
    useAiStore.getState().toggleToolUndo(id, 'current');
    useAiStore.getState().toggleToolUndo(id, undefined);
    const msg = useAiStore.getState().messages[0];
    if (msg.role === 'tool_result') {
      expect(msg.undone).toBe(false);
    }
  });

  it('removeLastMessage removes the last message', () => {
    useAiStore.getState().addUserMessage('hello');
    useAiStore.getState().addAssistantMessage('');
    useAiStore.getState().removeLastMessage();
    expect(useAiStore.getState().messages).toHaveLength(1);
    expect(useAiStore.getState().messages[0].role).toBe('user');
  });

  it('removeToolResult removes by id', () => {
    useAiStore.getState().addToolResult('update_summary', 'ok', true, ['basics', 'summary'], '');
    const id = useAiStore.getState().messages[0].id;
    useAiStore.getState().removeToolResult(id);
    expect(useAiStore.getState().messages).toHaveLength(0);
  });

  it('clearMessages resets messages and error', () => {
    useAiStore.getState().addUserMessage('hello');
    useAiStore.getState().addAssistantMessage('world');
    useAiStore.getState().setError('some error');
    useAiStore.getState().clearMessages();
    expect(useAiStore.getState().messages).toEqual([]);
    expect(useAiStore.getState().error).toBeNull();
  });

  it('setStreaming toggles streaming flag', () => {
    useAiStore.getState().setStreaming(true);
    expect(useAiStore.getState().isStreaming).toBe(true);
    useAiStore.getState().setStreaming(false);
    expect(useAiStore.getState().isStreaming).toBe(false);
  });

  it('setError sets and clears error', () => {
    useAiStore.getState().setError('network error');
    expect(useAiStore.getState().error).toBe('network error');
    useAiStore.getState().setError(null);
    expect(useAiStore.getState().error).toBeNull();
  });

  it('generates unique message ids', () => {
    useAiStore.getState().addUserMessage('a');
    useAiStore.getState().addUserMessage('b');
    useAiStore.getState().addAssistantMessage('c');
    const ids = useAiStore.getState().messages.map((m) => m.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('preserves message order across types', () => {
    useAiStore.getState().addUserMessage('q1');
    useAiStore.getState().addAssistantMessage('a1');
    useAiStore.getState().addToolResult('tool', 'ok', true, ['skills'], []);
    useAiStore.getState().addUserMessage('q2');
    const roles = useAiStore.getState().messages.map((m) => m.role);
    expect(roles).toEqual(['user', 'assistant', 'tool_result', 'user']);
  });
});
