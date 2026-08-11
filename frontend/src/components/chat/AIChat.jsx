import { useState, useRef, useEffect, memo } from "react";
import { Send, Bot, Trash2, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { formatTime } from "@/utils/helpers";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL   = import.meta.env.VITE_GROQ_MODEL || "openai/gpt-oss-120b";

const SYSTEM_INSTRUCTION = `You are Prism AI, a friendly assistant built into Prism Chat.
Help users: write/improve messages, summarize & translate text, brainstorm group names,
answer questions, give communication advice. Be concise and friendly. Use markdown where helpful.`;

const SUGGESTIONS = [
  "Help me write a professional message",
  "Summarize a long text for me",
  "Give me a group chat name idea",
  "Draft a polite follow-up message",
  "Translate a message to Spanish",
  "How do I start a difficult conversation?",
];


const md = (text) =>
  text
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_, c) =>
      `<pre class="bg-muted rounded-lg p-3 my-2 text-xs font-mono border border-border overflow-x-auto whitespace-pre-wrap"><code>${c.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,   "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-sm mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="font-semibold text-base mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="font-bold text-lg mt-4 mb-2">$1</h1>')
    .replace(/^[-*] (.+)$/gm,'<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/^\d+\. (.+)$/gm,'<li class="ml-4 list-decimal text-sm">$1</li>')
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g,  "<br/>");


const TypingIndicator = () => (
  <div className="flex items-end gap-2 py-1 px-3">
    <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <Bot className="size-4 text-primary" />
    </div>
    <div className="px-3 py-2.5 rounded-tl-xl rounded-r-xl bg-card border border-border shadow-sm">
      <div className="flex items-center gap-1">
        {[0,1,2].map((i) => (
          <span key={i} className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${i*0.15}s` }} />
        ))}
      </div>
    </div>
  </div>
);


const AIBubble = memo(({ msg }) => {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2 py-1 px-3 msg-animate", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
          <Bot className="size-4 text-primary" />
        </div>
      )}
      <div className={cn("max-w-[80%]", isUser && "items-end flex flex-col")}>
        <div className={cn(
          "px-3 py-2 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-xl rounded-l-xl"
            : "bg-card dark:bg-accent border border-border rounded-tl-xl rounded-r-xl"
        )}>
          {isUser
            ? <p className="leading-snug whitespace-pre-wrap">{msg.content}</p>
            : <div className="leading-relaxed [&_pre]:my-2 [&_li]:my-0.5"
                dangerouslySetInnerHTML={{ __html: md(msg.content) }} />
          }
        </div>
        <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
});
AIBubble.displayName = "AIBubble";


const AIChat = ({ onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const bottomRef = useRef();
  const inputRef  = useRef();

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      setError("Missing VITE_GROQ_API_KEY in .env");
      return;
    }

    const userMsg = { role: "user", content, timestamp: new Date().toISOString() };
    const history = [...messages];
    setMessages([...history, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      
      const groqMessages = [
        { role: "system", content: SYSTEM_INSTRUCTION },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content },
      ];

      const res = await fetch(GROQ_API_URL, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model:            GROQ_MODEL,
          messages:         groqMessages,
          temperature:      0.7,
          max_tokens:       1024,
          reasoning_effort: "low", 
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Error ${res.status}`);
      }

      const data = await res.json();
      const raw  = data.choices?.[0]?.message?.content
        || "Sorry, I couldn't generate a response.";
      
      const reply = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim() || raw;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, timestamp: new Date().toISOString() },
      ]);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const retry = () => {
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const idx   = messages.length - 1 - lastUserIdx;
    const last  = messages[idx];
    setMessages(messages.slice(0, idx));
    setError("");
    sendMessage(last.content);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="icon" className="size-8 lg:hidden shrink-0" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="size-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Prism AI</p>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <Sparkles className="size-3" /> Powered by Groq
          </p>
        </div>
        {!isEmpty && (
          <Button variant="ghost" size="icon"
            className="size-8 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => { setMessages([]); setError(""); }} title="Clear chat">
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center min-h-full px-6 py-8 text-center gap-6">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bot className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-1">Prism AI</h2>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Your AI assistant powered by Groq. Ask me to help with messages,
                translations, summaries, ideas, and more.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="px-3 py-2.5 rounded-xl border border-border bg-card text-xs text-left
                  leading-snug font-medium hover:bg-accent hover:border-primary/30 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-4">
            {messages.map((msg, i) => <AIBubble key={i} msg={msg} />)}
            {loading && <TypingIndicator />}
            {error && (
              <div className="mx-4 my-2 px-3 py-2.5 bg-destructive/10 text-destructive text-xs
                rounded-lg border border-destructive/20 flex items-center gap-2">
                <span className="shrink-0">⚠</span>
                <span className="flex-1">{error}</span>
                {!error.includes("VITE_GROQ") && (
                  <button onClick={retry} className="shrink-0 underline font-medium">Retry</button>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      
      <div className="border-t border-border bg-card py-3 px-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask Prism AI anything… (Shift+Enter for new line)"
            disabled={loading}
            className={cn(
              "flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              "disabled:opacity-50 transition-colors max-h-40 overflow-y-auto"
            )}
            style={{ fieldSizing: "content" }}
          />
          <Button size="icon" className="size-9 rounded-full shrink-0"
            onClick={() => sendMessage()} disabled={!input.trim() || loading}>
            {loading
              ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="size-4" />}
          </Button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2 opacity-60">
          AI can make mistakes · Verify important information
        </p>
      </div>
    </div>
  );
};

export default AIChat;
