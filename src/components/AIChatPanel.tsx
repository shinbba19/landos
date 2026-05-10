"use client";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Why is my ROI at this level?",
  "How can I improve the gross margin?",
  "What's the break-even selling price per wah²?",
  "Is this a good acquisition price given the location?",
];

interface Props {
  project: Project;
}

export function AIChatPanel({ project }: Props) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [open, history]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setHistory(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history,
          input: project.input,
          result: project.result,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Request failed");
      setHistory(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setError("Failed to get a response. Please try again.");
      setHistory(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {/* ── Floating button — only rendered when panel is closed ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            backgroundColor: '#C9A84C',
            color: '#0D1B2A',
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
            cursor: 'pointer',
            border: 'none',
          }}
          aria-label="Open AI Assistant"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* ── Chat panel — only rendered when open ── */}
      {open && (
      <div
        style={{ backgroundColor: '#0D1B2A' }}
        className="fixed z-[9999] flex flex-col overflow-hidden shadow-2xl border border-brand-gold/30 h-full rounded-none inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[380px] md:rounded-2xl md:h-[520px]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy-mid px-4 py-3 flex items-center justify-between border-b border-brand-gold/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center">
              <Bot size={14} className="text-brand-gold" />
            </div>
            <div>
              <p className="text-brand-gold text-sm font-semibold leading-none">LANDOS AI</p>
              <p className="text-brand-cream/40 text-xs mt-0.5">Knows this project's numbers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="text-brand-cream/30 hover:text-brand-cream/60 text-xs transition-colors px-2 py-1 rounded hover:bg-brand-navy-mid"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="text-brand-cream/40 hover:text-brand-cream transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-brand-navy px-4 py-4 space-y-4">
          {history.length === 0 ? (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={12} className="text-brand-gold" />
                </div>
                <div className="bg-brand-navy-mid rounded-2xl rounded-tl-sm px-4 py-3 text-brand-cream/80 text-sm leading-relaxed">
                  Hi! I know everything about <span className="text-brand-gold font-medium">{project.input.projectName}</span> — the numbers, the risks, the scenarios. Ask me anything.
                </div>
              </div>
              <div className="pl-9 space-y-2">
                <p className="text-brand-cream/30 text-xs uppercase tracking-wider">Try asking:</p>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="block w-full text-left text-xs text-brand-cream/60 hover:text-brand-cream border border-brand-gold/15 hover:border-brand-gold/40 rounded-lg px-3 py-2 transition-all hover:bg-brand-navy-mid"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {history.map((msg, i) => (
                <div key={i} className={cn("flex gap-2.5", msg.role === "user" && "justify-end")}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={12} className="text-brand-gold" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "assistant"
                      ? "bg-brand-navy-mid text-brand-cream/80 rounded-tl-sm"
                      : "bg-brand-gold/20 text-brand-cream rounded-tr-sm"
                  )}>
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={12} className="text-brand-cream/60" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center shrink-0">
                    <Bot size={12} className="text-brand-gold" />
                  </div>
                  <div className="bg-brand-navy-mid rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 size={14} className="text-brand-gold animate-spin" />
                  </div>
                </div>
              )}
              {error && (
                <p className="text-red-400 text-xs pl-9">{error}</p>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-brand-navy-mid border-t border-brand-gold/15 px-3 py-3 flex items-center gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this project…"
            disabled={loading}
            className="flex-1 bg-brand-navy border border-brand-gold/20 rounded-xl px-4 py-2.5 text-brand-cream text-sm placeholder:text-brand-cream/30 focus:outline-none focus:border-brand-gold/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-brand-gold hover:bg-brand-gold/90 text-brand-navy flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
      )}
    </>
  );
}
