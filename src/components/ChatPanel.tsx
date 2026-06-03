import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  videoTitle: string;
  transcript: { text: string }[];
}

const ChatPanel = ({ videoTitle, transcript }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-video", {
        body: {
          videoUrl: "",
          action: "chat",
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          videoTitle,
          transcript: transcript.map(s => s.text).join(" ").substring(0, 8000),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.message || data.error);

      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, I couldn't generate a response." }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
        Chat with Video
      </h3>

      <div ref={scrollRef} className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <Bot className="h-8 w-8 text-accent mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground">Ask anything about this video!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-accent" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === "user"
                ? "bg-accent text-accent-foreground"
                : "bg-secondary/60 text-foreground"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-xs prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
            {msg.role === "user" && (
              <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-accent-foreground" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <Loader2 className="h-3.5 w-3.5 text-accent animate-spin" />
            </div>
            <div className="bg-secondary/60 rounded-xl px-3 py-2 text-xs text-muted-foreground">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
        <Input
          placeholder="Ask about the video..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-9 text-xs rounded-lg bg-secondary/50"
          disabled={loading}
        />
        <Button type="submit" size="sm" disabled={!input.trim() || loading} className="h-9 px-3 rounded-lg gradient-primary text-primary-foreground">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
};

export default ChatPanel;
