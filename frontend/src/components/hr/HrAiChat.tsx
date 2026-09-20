'use client';

import { Bot, LoaderCircle, MessageCircle, Plus, SendHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  hrAiChatServer,
  type HrAiChatMessage,
  type HrAiConversation,
} from '@/server/hr-ai-chat.server';

const suggestions = [
  "Show today's attendance summary",
  'Show pending leave requests',
  'Give me workforce analytics',
  'Show task and project analytics',
];

export function HrAiChat() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<HrAiChatMessage[]>([]);
  const [conversations, setConversations] = useState<HrAiConversation[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages, loading]);
  useEffect(() => {
    hrAiChatServer
      .list()
      .then(({ conversations: items }) => setConversations(items))
      .catch(() => undefined);
  }, []);
  async function loadConversation(id: string) {
    setLoading(true);
    try {
      const { conversation } = await hrAiChatServer.get(id);
      setConversationId(conversation.id);
      setMessages(conversation.messages);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load conversation.');
    } finally {
      setLoading(false);
    }
  }
  function newConversation() {
    setConversationId(undefined);
    setMessages([]);
    setText('');
  }
  async function send(value = text) {
    const message = value.trim();
    if (!message || loading) return;
    setMessages((current) => [
      ...current,
      { role: 'user', content: message, createdAt: new Date().toISOString() },
    ]);
    setText('');
    setLoading(true);
    try {
      const result = await hrAiChatServer.send(message, conversationId);
      setConversationId(result.conversationId);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: result.reply, createdAt: result.createdAt },
      ]);
      const { conversations: items } = await hrAiChatServer.list();
      setConversations(items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Chatbot is unavailable.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7">
      {open && (
        <section
          className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[calc(100vw-2.5rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          aria-label="WorkPilot HR assistant"
        >
          <header className="flex items-center justify-between bg-emerald-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-white/15">
                <Bot className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold">WorkPilot AI</p>
                <p className="text-xs text-emerald-100">HR assistant · Live company data</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={newConversation}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="New conversation"
              >
                <Plus className="size-5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Close chat"
              >
                <X className="size-5" />
              </button>
            </div>
          </header>
          {conversations.length > 0 && (
            <div className="border-b border-slate-200 bg-white px-3 py-2">
              <select
                value={conversationId ?? ''}
                onChange={(event) => event.target.value && loadConversation(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600"
              >
                <option value="" disabled>
                  Select previous conversation
                </option>
                {conversations.map((conversation) => (
                  <option key={conversation.id} value={conversation.id}>
                    {new Date(conversation.updatedAt).toLocaleString()} · {conversation.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {!messages.length && (
              <div className="space-y-3">
                <div className="rounded-2xl rounded-tl-sm bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm">
                  Ask anything about your HR workspace. I can help with employees, attendance,
                  leave, payroll, requests, tasks, projects, documents, announcements, and live
                  analytics.
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      onClick={() => send(item)}
                      className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`max-w-[88%] whitespace-pre-wrap rounded-2xl p-3 text-sm leading-6 shadow-sm ${item.role === 'user' ? 'ml-auto rounded-br-sm bg-emerald-600 text-white' : 'rounded-tl-sm bg-white text-slate-700'}`}
              >
                {item.content}
                {item.createdAt && (
                  <p
                    className={`mt-1 text-[10px] ${item.role === 'user' ? 'text-emerald-100' : 'text-slate-400'}`}
                  >
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex w-fit items-center gap-2 rounded-2xl rounded-tl-sm bg-white p-3 text-sm text-slate-500 shadow-sm">
                <LoaderCircle className="size-4 animate-spin" />
                Checking live data...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
            className="flex gap-2 border-t border-slate-200 bg-white p-3"
          >
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              disabled={loading}
              maxLength={1500}
              placeholder="Ask about your HR workspace..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!text.trim() || loading}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <SendHorizontal className="size-4" />
            </button>
          </form>
        </section>
      )}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="grid size-14 place-items-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-700/30 transition hover:scale-105 hover:bg-emerald-700"
          aria-label="Open WorkPilot AI chat"
        >
          <MessageCircle className="size-6" />
        </button>
      )}
    </div>
  );
}
