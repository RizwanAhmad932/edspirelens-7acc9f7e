import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Mic, MicOff, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { TranscriptSegment } from "@/lib/mockData";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  videoTitle: string;
  transcript: TranscriptSegment[];
  onSeekVideo?: (seconds: number) => void;
}

function parseTimestamp(ts: string): number {
  const parts = ts.split(":").map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

const ChatPanel = ({ videoTitle, transcript, onSeekVideo }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const timestampedContext = transcript
        .map((s) => `[${s.timestamp}] ${s.text}`)
        .join("\n")
        .substring(0, 12000);
      const { data, error } = await supabase.functions.invoke("analyze-video", {
        body: {
          videoUrl: "",
          action: "chat",
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          videoTitle,
          transcript: timestampedContext,
          includeTimestamps: true,
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

  // Voice-to-text using Web Speech API
  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input isn't supported on this browser. Try Chrome on Android.");
      return;
    }
    try {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";
      let finalText = "";
      rec.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t;
          else interim += t;
        }
        setInput((finalText + interim).trim());
      };
      rec.onerror = (e: any) => {
        console.error("SR error", e);
        setIsRecording(false);
      };
      rec.onend = () => setIsRecording(false);
      rec.start();
      recognitionRef.current = rec;
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't start voice input.");
    }
  };

  const stopRecording = () => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    setIsRecording(false);
  };

  // Render assistant content, converting [M:SS] or [H:MM:SS] tokens into clickable seek buttons.
  const renderAssistantContent = (content: string) => {
    const regex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
    const parts: Array<{ type: "text" | "ts"; value: string }> = [];
    let lastIdx = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(content)) !== null) {
      if (m.index > lastIdx) parts.push({ type: "text", value: content.slice(lastIdx, m.index) });
      parts.push({ type: "ts", value: m[1] });
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < content.length) parts.push({ type: "text", value: content.slice(lastIdx) });

    return (
      <div className="prose prose-xs prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0 text-xs leading-relaxed">
        {parts.map((p, i) =>
          p.type === "ts" ? (
            <button
              key={i}
              onClick={() => onSeekVideo?.(parseTimestamp(p.value))}
              disabled={!onSeekVideo}
              className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded-md bg-accent/20 hover:bg-accent/30 text-accent text-[10px] font-medium transition-colors align-baseline"
              title="Jump to this moment in the video"
            >
              <Play className="h-2.5 w-2.5" />
              {p.value}
            </button>
          ) : (
            <ReactMarkdown key={i}>{p.value}</ReactMarkdown>
          )
        )}
      </div>
    );
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
            <p className="text-xs text-muted-foreground">Ask anything — replies include clickable video timestamps.</p>
            <p className="text-[10px] text-muted-foreground mt-1 opacity-70">Tip: hold the mic to speak your question.</p>
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
              {msg.role === "assistant" ? renderAssistantContent(msg.content) : msg.content}
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
          placeholder={isRecording ? "Listening..." : "Ask about the video..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-9 text-xs rounded-lg bg-secondary/50"
          disabled={loading}
        />
        <Button
          type="button"
          size="sm"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={() => isRecording && stopRecording()}
          onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
          onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
          disabled={loading}
          className={`h-9 px-3 rounded-lg select-none ${isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-secondary text-foreground hover:bg-secondary/70"}`}
          title="Hold to speak"
        >
          {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
        </Button>
        <Button type="submit" size="sm" disabled={!input.trim() || loading} className="h-9 px-3 rounded-lg gradient-primary text-primary-foreground">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
};

export default ChatPanel;
