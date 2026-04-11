import { describe, it, expect, beforeEach } from 'vitest';
import { useAiStore } from '../store/aiStore';
import { useResumeStore, activeSlot } from '../store/resumeStore';
import type { AnyMessage } from '../lib/ai';

function asChat(m: AnyMessage) {
  if (m.role === 'user' || m.role === 'assistant') return m;
  throw new Error('Not a chat message');
}

function msgs() {
  return activeSlot(useResumeStore.getState()).chatHistory;
}

describe('aiStore (keys, provider, model, session)', () => {
  beforeEach(() => {
    const s = useAiStore.getState();
    Object.keys(s.apiKeys).forEach((k) => s.clearApiKey(k));
    s.setStreaming(false);
    s.setError(null);
  });

  it('starts with empty state', () => {
    const s = useAiStore.getState();
    expect(s.apiKeys).toEqual({});
    expect(s.provider).toBe('gemini');
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
});

describe('chat messages (in resumeStore slot)', () => {
  beforeEach(() => {
    // Ensure a slot exists
    const rs = useResumeStore.getState();
    if (rs.slots.length === 0) rs.saveSlot('');
    rs.clearMessages();
  });

  it('addUserMessage appends user message', () => {
    useResumeStore.getState().addUserMessage('hello');
    expect(msgs()).toHaveLength(1);
    const m = asChat(msgs()[0]);
    expect(m.role).toBe('user');
    expect(m.content).toBe('hello');
    expect(m.id).toBeTruthy();
    expect(m.timestamp).toBeGreaterThan(0);
  });

  it('addAssistantMessage appends assistant message', () => {
    useResumeStore.getState().addAssistantMessage('hi there');
    expect(msgs()).toHaveLength(1);
    const m = asChat(msgs()[0]);
    expect(m.role).toBe('assistant');
    expect(m.content).toBe('hi there');
  });

  it('updateLastAssistantMessage updates last assistant message content', () => {
    useResumeStore.getState().addUserMessage('hello');
    useResumeStore.getState().addAssistantMessage('');
    useResumeStore.getState().updateLastAssistantMessage('partial');
    useResumeStore.getState().updateLastAssistantMessage('partial response');
    expect(msgs()).toHaveLength(2);
    expect(asChat(msgs()[1]).content).toBe('partial response');
  });

  it('updateLastAssistantMessage does nothing if last message is user', () => {
    useResumeStore.getState().addUserMessage('hello');
    useResumeStore.getState().updateLastAssistantMessage('nope');
    expect(asChat(msgs()[0]).content).toBe('hello');
  });

  it('addToolCallsToLastAssistant attaches tool calls', () => {
    useResumeStore.getState().addAssistantMessage('I will update your summary');
    useResumeStore
      .getState()
      .addToolCallsToLastAssistant([
        { id: 'tc1', name: 'update_summary', args: { summary: 'new' } },
      ]);
    const m = asChat(msgs()[0]);
    expect(m.toolCalls).toHaveLength(1);
    expect(m.toolCalls![0].name).toBe('update_summary');
  });

  it('addToolResult adds a tool result message', () => {
    useResumeStore
      .getState()
      .addToolResult('update_summary', 'Updated summary', true, ['basics', 'summary'], 'old value');
    expect(msgs()).toHaveLength(1);
    const m = msgs()[0];
    expect(m.role).toBe('tool_result');
    if (m.role === 'tool_result') {
      expect(m.toolName).toBe('update_summary');
      expect(m.success).toBe(true);
      expect(m.path).toEqual(['basics', 'summary']);
      expect(m.before).toBe('old value');
    }
  });

  it('toggleToolUndo sets after and undone', () => {
    useResumeStore
      .getState()
      .addToolResult('update_summary', 'ok', true, ['basics', 'summary'], 'old');
    const id = msgs()[0].id;
    useResumeStore.getState().toggleToolUndo(id, 'current value');
    const msg = msgs()[0];
    if (msg.role === 'tool_result') {
      expect(msg.undone).toBe(true);
      expect(msg.after).toBe('current value');
    }
  });

  it('removeLastMessage removes the last message', () => {
    useResumeStore.getState().addUserMessage('hello');
    useResumeStore.getState().addAssistantMessage('');
    useResumeStore.getState().removeLastMessage();
    expect(msgs()).toHaveLength(1);
    expect(msgs()[0].role).toBe('user');
  });

  it('removeToolResult removes by id', () => {
    useResumeStore
      .getState()
      .addToolResult('update_summary', 'ok', true, ['basics', 'summary'], '');
    const id = msgs()[0].id;
    useResumeStore.getState().removeToolResult(id);
    expect(msgs()).toHaveLength(0);
  });

  it('clearMessages resets chat history', () => {
    useResumeStore.getState().addUserMessage('hello');
    useResumeStore.getState().addAssistantMessage('world');
    useResumeStore.getState().clearMessages();
    expect(msgs()).toEqual([]);
  });

  it('generates unique message ids', () => {
    useResumeStore.getState().addUserMessage('a');
    useResumeStore.getState().addUserMessage('b');
    useResumeStore.getState().addAssistantMessage('c');
    const ids = msgs().map((m) => m.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('preserves message order across types', () => {
    useResumeStore.getState().addUserMessage('q1');
    useResumeStore.getState().addAssistantMessage('a1');
    useResumeStore.getState().addToolResult('tool', 'ok', true, ['skills'], []);
    useResumeStore.getState().addUserMessage('q2');
    const roles = msgs().map((m) => m.role);
    expect(roles).toEqual(['user', 'assistant', 'tool_result', 'user']);
  });
});
