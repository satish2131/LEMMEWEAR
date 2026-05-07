"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle, X, Send, Loader2, Bot, User,
  Minimize2, TicketCheck, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: string;
  role: "bot" | "user";
  content: string;
  time: string;
  ticketNumber?: string;
}

const STORAGE_KEY = "lw_chat_history";
const MAX_STORED = 50;

function chatKey(userId?: string | null) {
  return userId ? `lw_chat_${userId}` : "lw_chat_guest";
}

function formatTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function uid() {
  return Math.random().toString(36).slice(2);
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
function renderContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return (
      <span key={i}>
        {parts}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Load history from sessionStorage — keyed per user
  useEffect(() => {
    const key = chatKey(user?.id);
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([{
          id: uid(),
          role: "bot",
          content: `Hey there! 👋 Welcome to **LemmeWear** support!\n\nI can help you with orders, shipping, returns, sizing, custom designs, and more.\n\nWhat can I help you with today?`,
          time: formatTime(),
        }]);
      }
    } catch {
      // ignore
    }
  }, [user?.id]); // re-run when user changes

  // Persist to sessionStorage under user-specific key
  useEffect(() => {
    if (messages.length === 0) return;
    const key = chatKey(user?.id);
    try {
      sessionStorage.setItem(key, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      // ignore
    }
  }, [messages, user?.id]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [open, minimized, scrollToBottom]);

  useEffect(() => {
    if (open && !minimized) {
      scrollToBottom();
      setUnread(0);
    }
  }, [messages, open, minimized, scrollToBottom]);

  // Track scroll position for scroll-to-bottom button
  const handleScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 100);
  };

  // Unread badge when closed
  useEffect(() => {
    if (!open && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "bot") setUnread((n) => n + 1);
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: uid(), role: "user", content: text, time: formatTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userName: user?.name,
          userEmail: user?.email,
          conversationHistory: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const json = await res.json();
      if (json.success) {
        const botMsg: Message = {
          id: uid(),
          role: "bot",
          content: json.response,
          time: formatTime(),
          ticketNumber: json.ticketNumber,
        };
        setMessages((prev) => [...prev, botMsg]);
        if (!open || minimized) setUnread((n) => n + 1);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: uid(),
        role: "bot",
        content: "Sorry, I'm having trouble connecting. Please try again or email us at hello@lemmewear.in",
        time: formatTime(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    sessionStorage.removeItem(chatKey(user?.id));
    setMessages([{
      id: uid(),
      role: "bot",
      content: `Chat cleared! 👋 How can I help you today?`,
      time: formatTime(),
    }]);
    setUnread(0);
  };

  // Quick reply chips
  const quickReplies = [
    "My orders",
    "Track my order",
    "Shipping info",
    "Return policy",
    "Talk to agent",
  ];

  const showQuickReplies = messages.length <= 2;

  return (
    <>
      {/* ── Floating bubble ── */}
      <button
        onClick={() => { setOpen(true); setMinimized(false); setUnread(0); }}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full gradient-primary shadow-glow flex items-center justify-center transition-all duration-300 hover:scale-110 ${open && !minimized ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"}`}
        aria-label="Open chat support"
      >
        <MessageCircle className="h-6 w-6 text-white" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ── Chat window ── */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-border bg-background shadow-2xl transition-all duration-300 origin-bottom-right ${
          open
            ? minimized
              ? "w-72 h-14 opacity-100 scale-100"
              : "w-[360px] h-[560px] opacity-100 scale-100 sm:w-[380px]"
            : "w-[360px] h-[560px] opacity-0 scale-75 pointer-events-none"
        }`}
        style={{ maxHeight: "calc(100vh - 100px)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 gradient-primary rounded-t-2xl shrink-0">
          <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">LemmeWear Support</p>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[11px] text-white/80">Online · Usually replies instantly</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized((m) => !m)}
              className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Minimize"
            >
              <Minimize2 className="h-3.5 w-3.5 text-white" />
            </button>
            <button
              onClick={() => { setOpen(false); setMinimized(false); }}
              className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Messages */}
            <div
              ref={messagesRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === "bot" ? "bg-primary/10" : "bg-secondary"
                  }`}>
                    {msg.role === "bot"
                      ? <Bot className="h-4 w-4 text-primary" />
                      : <User className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "bot"
                        ? "bg-secondary text-foreground rounded-tl-sm"
                        : "gradient-primary text-white rounded-tr-sm"
                    }`}>
                      {renderContent(msg.content)}
                      {msg.ticketNumber && (
                        <div className="mt-2 flex items-center gap-1.5 bg-white/20 rounded-lg px-2 py-1">
                          <TicketCheck className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-bold">{msg.ticketNumber}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">{msg.time}</span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick replies */}
              {showQuickReplies && !loading && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickReplies.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); setTimeout(() => sendMessage(), 0); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollBtn && (
              <button
                onClick={() => scrollToBottom()}
                className="absolute bottom-20 right-4 h-8 w-8 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-10"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            )}

            {/* Input area */}
            <div className="border-t border-border px-3 py-3 shrink-0">
              {/* User info strip */}
              {user && (
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Chatting as <span className="font-semibold text-foreground">{user.name}</span>
                  </span>
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-24 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                  style={{ minHeight: 40 }}
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  aria-label="Send"
                >
                  {loading
                    ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                    : <Send className="h-4 w-4 text-white" />
                  }
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-[10px] text-muted-foreground">Press Enter to send · Shift+Enter for new line</p>
                <button onClick={clearChat} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">
                  Clear chat
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
