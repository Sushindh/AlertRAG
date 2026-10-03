import { useState, useRef, useEffect } from "react";
import { api, ChatMessage } from "../api/alertApi";
import { Send, Bot, User, AlertTriangle, Zap } from "lucide-react";

const SUGGESTED = [
  "Why is the /pay endpoint slow?",
  "What metrics does the payment service expose?",
  "What should I do first when I see a High Latency incident?",
  "How does AlertRAG detect incidents?",
  "What is the difference between p95 latency and average latency?",
  "What does a payment failure mean in this system?",
];

export function SREChat() {
  const [history, setHistory] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "👋 Hi! I'm AlertRAG, your SRE assistant for the payment service.\n\n" +
        "I have access to:\n" +
        "• Real-time metrics from Prometheus\n" +
        "• Active incident reports with trace data\n" +
        "• Knowledge about the payment service architecture\n\n" +
        "Ask me anything — about current incidents, how the system works, what metrics to watch, or what actions to take.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  const send = async (msg?: string) => {
    const message = (msg ?? input).trim();
    if (!message || loading) return;

    const userMsg: ChatMessage = { role: "user", content: message };
    setHistory(h => [...h, userMsg]);
    setInput("");
    setLoading(true);

    // Auto-resize textarea back to 1 line
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }

    try {
      // Send only non-system messages as history (all except the first greeting)
      const historyToSend = history.slice(1);
      const res = await api.chat(message, historyToSend);
      setHistory(h => [...h, { role: "assistant", content: res.reply }]);
    } catch (e: any) {
      setHistory(h => [
        ...h,
        {
          role: "assistant",
          content: `⚠️ Could not reach the backend: ${e.message}\n\nMake sure the AlertRAG server is running on port 9000.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "44px";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px - 56px)" }}>
      {/* Header */}
      <div className="page-header flex items-center justify-between" style={{ flexShrink: 0, marginBottom: 0, paddingBottom: 16 }}>
        <div>
          <h1 className="page-title">SRE Chat</h1>
          <p className="page-subtitle">
            Context-aware AI assistant — answers questions about incidents and the payment service
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-violet">
            <Bot size={11} /> gemma3:4b
          </span>
          <span className="badge badge-blue">RAG enabled</span>
        </div>
      </div>

      {/* Suggested questions — only when chat is fresh */}
      {history.length === 1 && (
        <div style={{ flexShrink: 0, marginBottom: 16 }}>
          <div className="text-xs text-muted mb-2">Suggested questions:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SUGGESTED.map(q => (
              <button
                key={q}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: "4px 10px" }}
                onClick={() => send(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages card" style={{ flex: 1, overflowY: "auto", padding: 20, gap: 16 }}>
        {history.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            <div className={`bubble-avatar ${msg.role}`}>
              {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`bubble-content ${msg.role}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-bubble assistant">
            <div className="bubble-avatar assistant"><Bot size={14} /></div>
            <div className="bubble-content assistant">
              <div className="flex items-center gap-2 text-muted text-sm">
                <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Thinking…
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area" style={{ flexShrink: 0, marginTop: 8, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder="Ask about incidents, metrics, or the payment service... (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="chat-send-btn"
          onClick={() => send()}
          disabled={loading || !input.trim()}
          title="Send (Enter)"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Context note */}
      <div className="text-xs text-muted mt-2" style={{ paddingLeft: 4 }}>
        <Zap size={10} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
        Using incident data + payment service knowledge as context. Conversation history included.
      </div>
    </div>
  );
}
