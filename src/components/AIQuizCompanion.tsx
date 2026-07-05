import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion, TranscriptSegment } from "@/lib/mockData";

interface Props {
  quiz: QuizQuestion[];
  transcript: TranscriptSegment[];
  getCurrentTime: () => number;
  visible: boolean;
}

/**
 * Floating circular AI orb that fires a timed poll question in sync with the
 * lecture's current timestamp. Questions are matched to the closest transcript
 * segment so the poll topic reflects what the teacher just said.
 */
const POLL_INTERVAL_SEC = 90; // Ask a poll roughly every 90s of video
const POLL_TIME_LIMIT = 15; // seconds to answer

const AIQuizCompanion = ({ quiz, transcript, getCurrentTime, visible }: Props) => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [active, setActive] = useState<{ q: QuizQuestion; index: number } | null>(null);
  const [remaining, setRemaining] = useState(POLL_TIME_LIMIT);
  const [chosen, setChosen] = useState<number | null>(null);
  const askedRef = useRef<Set<number>>(new Set());
  const lastAskAtRef = useRef(0);

  // Map each quiz question to a transcript timestamp (heuristic keyword match).
  const timedQuiz = useMemo(() => {
    if (!quiz.length || !transcript.length) return [] as { q: QuizQuestion; at: number }[];
    const total = transcript[transcript.length - 1]?.seconds || 600;
    return quiz.map((q, i) => {
      const words = q.question.toLowerCase().split(/\W+/).filter(w => w.length > 4);
      const hit = transcript.find(seg =>
        words.some(w => seg.text.toLowerCase().includes(w))
      );
      return { q, at: hit?.seconds ?? ((i + 1) * total) / (quiz.length + 1) };
    });
  }, [quiz, transcript]);

  useEffect(() => {
    if (!visible || active) return;
    const id = window.setInterval(() => {
      const t = getCurrentTime();
      if (!t) return;
      if (t - lastAskAtRef.current < POLL_INTERVAL_SEC && lastAskAtRef.current > 0) return;
      const idx = timedQuiz.findIndex((tq, i) => !askedRef.current.has(i) && tq.at <= t);
      if (idx === -1) return;
      askedRef.current.add(idx);
      lastAskAtRef.current = t;
      setActive({ q: timedQuiz[idx].q, index: idx });
      setChosen(null);
      setRemaining(POLL_TIME_LIMIT);
      setOpen(true);
    }, 2000);
    return () => window.clearInterval(id);
  }, [visible, active, timedQuiz, getCurrentTime]);

  useEffect(() => {
    if (!active || chosen !== null) return;
    const id = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [active, chosen]);

  if (!visible) return null;

  const dismiss = () => {
    setActive(null);
    setOpen(false);
  };

  return (
    <>
      {/* Circular AI Orb */}
      <button
        onClick={() => setMinimized(m => !m)}
        aria-label="AI Companion"
        className={cn(
          "fixed z-[60] bottom-24 right-4 sm:right-6 h-14 w-14 rounded-full",
          "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600",
          "shadow-[0_8px_30px_rgba(59,130,246,0.5)] flex items-center justify-center",
          "text-white ring-2 ring-white/30 hover:scale-105 transition-transform",
          active && !open && "animate-pulse"
        )}
      >
        <Sparkles className="h-6 w-6" />
        {active && !open && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {/* Poll card */}
      {active && open && (
        <div className="fixed z-[60] bottom-44 right-3 left-3 sm:left-auto sm:right-6 sm:w-96 rounded-2xl bg-card border border-border shadow-elevated animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Pop quiz
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded-full",
                remaining <= 5 ? "bg-red-500/15 text-red-500" : "bg-muted"
              )}>
                <Timer className="h-3 w-3" /> {remaining}s
              </span>
              <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-3 space-y-2">
            <p className="text-sm font-medium">{active.q.question}</p>
            <div className="space-y-1.5">
              {active.q.options.map((opt, i) => {
                const isCorrect = i === active.q.correctIndex;
                const isChosen = chosen === i;
                const revealed = chosen !== null || remaining === 0;
                return (
                  <button
                    key={i}
                    disabled={revealed}
                    onClick={() => setChosen(i)}
                    className={cn(
                      "w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors",
                      !revealed && "hover:bg-accent/10 border-border",
                      revealed && isCorrect && "bg-green-500/15 border-green-500/50 text-green-700 dark:text-green-400",
                      revealed && isChosen && !isCorrect && "bg-red-500/15 border-red-500/50 text-red-700 dark:text-red-400",
                      revealed && !isChosen && !isCorrect && "opacity-60 border-border"
                    )}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </button>
                );
              })}
            </div>
            {(chosen !== null || remaining === 0) && (
              <button
                onClick={dismiss}
                className="w-full mt-2 text-xs font-medium py-2 rounded-lg gradient-accent text-accent-foreground"
              >
                Continue watching
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AIQuizCompanion;