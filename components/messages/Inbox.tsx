"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { messageApi, type ChatMessage, type Conversation } from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import NewMessagePicker from "@/components/messages/NewMessagePicker";
import { announceMessagesRead } from "@/components/messages/useMessageUnread";
import { roleLabel } from "@/components/messages/roles";

const LIST_POLL_MS = 15_000;
const THREAD_POLL_MS = 10_000;
const MAX_BODY = 4000;

function when(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

// Runs `fn` every `ms` while the tab is visible (and once when it becomes visible again).
function usePoll(fn: () => void, ms: number, enabled = true) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => { if (!timer) timer = setInterval(() => saved.current(), ms); };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };
    const onVisibility = () => { if (document.hidden) stop(); else { saved.current(); start(); } };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [ms, enabled]);
}

// Two panes on wide screens (list + thread); one at a time on phones. The open
// conversation lives in ?c= so notifications can link straight to it.
export default function Inbox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedId = params.get("c");
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const loadList = useCallback(() => {
    messageApi.conversations()
      .then((list) => { setConversations(list); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load your messages"));
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  usePoll(loadList, LIST_POLL_MS);

  function select(id: string | null) {
    const qs = new URLSearchParams(params.toString());
    qs.set("tab", "messages");
    if (id) qs.set("c", id); else qs.delete("c");
    router.replace(`${pathname}?${qs}`);
  }

  async function startWith(userPublicId: string) {
    const c = await messageApi.start(userPublicId);
    setPicking(false);
    select(c.publicId);
  }

  // Keep the list's badge in step with what the thread has just read or sent.
  const onThreadChange = useCallback((c: Conversation) => {
    setConversations((list) => {
      if (!list) return list;
      const rest = list.filter((x) => x.publicId !== c.publicId);
      return c.lastMessageAt ? [c, ...rest].sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "")) : rest;
    });
  }, []);

  return (
    <section className="flex h-[calc(100vh-15rem)] min-h-[460px] overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-sm">
      {/* Conversation list */}
      <div className={`${selectedId ? "hidden md:flex" : "flex"} w-full md:w-80 shrink-0 flex-col border-r border-gray-100`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>
          <button type="button" onClick={() => setPicking(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            New message
          </button>
        </div>
        {error && <p className="m-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {conversations === null ? (
            <p className="px-4 py-6 text-sm text-gray-400 animate-pulse">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-gray-400">No conversations yet. Start one with “New message”.</p>
          ) : (
            conversations.map((c) => (
              <button key={c.publicId} type="button" onClick={() => select(c.publicId)}
                aria-current={c.publicId === selectedId ? "true" : undefined}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                  c.publicId === selectedId ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <Avatar name={c.other.name} src={c.other.profileImageUrl} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`truncate text-sm ${c.unreadCount > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
                      {c.other.name}
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-400">{when(c.lastMessageAt)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`truncate text-xs ${c.unreadCount > 0 ? "text-gray-700" : "text-gray-500"}`}>
                      {c.lastMessageFromMe ? "You: " : ""}{c.lastMessagePreview}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="ml-auto grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold leading-none text-white">
                        {c.unreadCount > 99 ? "99+" : c.unreadCount}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      <div className={`${selectedId ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {selectedId ? (
          <Thread key={selectedId} conversationId={selectedId} onBack={() => select(null)} onChange={onThreadChange} />
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center text-sm text-gray-400">
            Choose a conversation, or start a new one.
          </div>
        )}
      </div>

      {picking && <NewMessagePicker onPick={startWith} onClose={() => setPicking(false)} />}
    </section>
  );
}

function Thread({ conversationId, onBack, onChange }: {
  conversationId: string;
  onBack: () => void;
  onChange: (c: Conversation) => void;
}) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const markRead = useCallback(() => {
    messageApi.markRead(conversationId)
      .then((c) => { setConversation(c); onChange(c); announceMessagesRead(); })
      .catch(() => {});
  }, [conversationId, onChange]);

  useEffect(() => {
    setLoading(true);
    Promise.all([messageApi.get(conversationId), messageApi.messages(conversationId)])
      .then(([c, page]) => {
        setConversation(c);
        setMessages(page.items);
        setHasMore(page.hasMore);
        if (c.unreadCount > 0) markRead();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't open this conversation"))
      .finally(() => setLoading(false));
  }, [conversationId, markRead]);

  // Scroll to the newest message when new ones arrive, unless the reader scrolled up.
  useEffect(() => {
    if (stickToBottom.current) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const poll = useCallback(() => {
    const last = messages[messages.length - 1];
    if (!last) {
      messageApi.messages(conversationId).then((p) => { if (p.items.length) { setMessages(p.items); markRead(); } }).catch(() => {});
      return;
    }
    messageApi.messages(conversationId, { after: last.publicId, size: 100 })
      .then((p) => {
        if (p.items.length === 0) return;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.publicId));
          return [...prev, ...p.items.filter((m) => !seen.has(m.publicId))];
        });
        if (p.items.some((m) => !m.mine)) markRead();
      })
      .catch(() => {});
  }, [conversationId, messages, markRead]);
  usePoll(poll, THREAD_POLL_MS, !loading && !error);

  async function loadOlder() {
    const first = messages[0];
    if (!first) return;
    stickToBottom.current = false;
    const page = await messageApi.messages(conversationId, { before: first.publicId }).catch(() => null);
    if (!page) return;
    setMessages((prev) => [...page.items, ...prev]);
    setHasMore(page.hasMore);
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const sent = await messageApi.send(conversationId, body);
      stickToBottom.current = true;
      setMessages((prev) => (prev.some((m) => m.publicId === sent.publicId) ? prev : [...prev, sent]));
      setDraft("");
      if (conversation) {
        onChange({ ...conversation, lastMessageAt: sent.createdAt, lastMessagePreview: body.replace(/\s+/g, " ").slice(0, 200),
          lastMessageFromMe: true, unreadCount: 0 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your message");
    } finally {
      setSending(false);
    }
  }

  function onScroll() {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
        <button type="button" onClick={onBack} aria-label="Back to conversations" className="md:hidden -ml-1 p-1 text-gray-500 hover:text-gray-900">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        {conversation && (
          <>
            <Avatar name={conversation.other.name} src={conversation.other.profileImageUrl} size={32} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{conversation.other.name}</p>
              <p className="text-xs text-gray-500">{roleLabel(conversation.other.roles)}</p>
            </div>
          </>
        )}
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
        ) : (
          <>
            {hasMore && (
              <div className="text-center">
                <button type="button" onClick={loadOlder} className="text-xs font-medium text-blue-600 hover:underline">Load older messages</button>
              </div>
            )}
            {messages.length === 0 && !error && (
              <p className="py-10 text-center text-sm text-gray-400">No messages yet — say hello.</p>
            )}
            {messages.map((m) => (
              <div key={m.publicId} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.mine ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md bg-gray-100 text-gray-900"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-0.5 text-right text-[10.5px] ${m.mine ? "text-blue-100" : "text-gray-400"}`}>{when(m.createdAt)}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {error && <p className="mx-4 mb-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {conversation && !conversation.canSend ? (
        <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500">You can no longer message this person.</p>
      ) : (
        <form onSubmit={send} className="flex items-end gap-2 border-t border-gray-100 p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            maxLength={MAX_BODY}
            placeholder="Write a message…"
            aria-label="Message"
            className="max-h-40 min-h-[40px] flex-1 resize-none rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={sending || !draft.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </>
  );
}
