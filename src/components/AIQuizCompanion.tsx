import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X, Timer, Flame, BellOff, Bell, Target, Lightbulb, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion, TranscriptSegment } from "@/lib/mockData";

interface Props {
  quiz: QuizQuestion[];
  transcript: TranscriptSegment[];
  getCurrentTime: () => number;
  visible: boolean;
}

/**
 * Adaptive floating AI orb that fires timed polls in sync with the lecture
 * timeline. Difficulty adapts to live accuracy, weak topics are re-queued,
 * and answer timing feeds a streak/accuracy HUD.
 */
const BASE_INTERVAL_SEC = 90;
const TIME_LIMIT: Record<string, number> = { easy: 12, medium: 18, hard: 25 };
const DIFF_ORDER = ["easy", "medium", "hard"] as const;
type Diff = (typeof DIFF_ORDER)[number];

const diffOf = (q: QuizQuestion): Diff =>
  (DIFF_ORDER.includes(q.difficulty as Diff) ? q.difficulty : "medium") as Diff;

const AIQuizCompanion = ({ quiz, transcript, getCurrentTime, visible }: Props) => {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [active, setActive] = useState<{ q: QuizQuestion; index: number } | null>(null);
  const [limit, setLimit] = useState(TIME_LIMIT.medium);
  const [remaining, setRemaining] = useState(TIME_LIMIT.medium);
  const [chosen, setChosen] = useState<number | null>(null);
  const [level, setLevel] = useState<Diff>("medium");
  const [stats, setStats] = useState({ asked: 0, correct: 0, streak: 0, best: 0, points: 0 });
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const askedRef = useRef<Set<number>>(new Set());
  const lastAskAtRef = useRef(0);

  // Map each quiz question to a transcript timestamp (keyword match, fallback spread).
  const timedQuiz = useMemo(() => {
    if (!quiz.length) return [] as { q: QuizQuestion; at: number }[];
    const total = transcript[transcript.length - 1]?.seconds || 600;
    return quiz.map((q, i) => {
      const stamp = q.timestamp?.match(/(\d+):(\d{2})/);
      if (stamp) return { q, at: Number(stamp[1]) * 60 + Number(stamp[2]) };
      const words = q.question.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
      const hit = transcript.find((seg) => words.some((w) => seg.text.toLowerCase().includes(w)));
      return { q, at: hit?.seconds ?? ((i + 1) * total) / (quiz.length + 1) };
    });
  }, [quiz, transcript]);

  // Adaptive picker: prefer unasked questions at/below current playback time,
  // weighting weak topics first and the current difficulty level next.
  const pickNext = useCallback(
    (t: number) => {
      const due = timedQuiz
        .map((tq, i) => ({ ...tq, i }))
        .filter((tq) => !askedRef.current.has(tq.i) && tq.at <= t);
      if (!due.length) return null;
      const score = (tq: { q: QuizQuestion }) => {
        let s = 0;
        if (tq.q.topic && weakTopics.includes(tq.q.topic)) s += 3;
        if (diffOf(tq.q) === level) s += 2;
        return s;
      };
      return due.sort((a, b) => score(b) - score(a) || a.at - b.at)[0];
    },
    [timedQuiz, weakTopics, level],
  );

  useEffect(() => {
    if (!visible || muted || active) return;
    const id = window.setInterval(() => {
      const t = getCurrentTime();
      if (!t) return;
      // Higher accuracy → longer gaps; struggling learners get checked more often.
      const acc = stats.asked ? stats.correct / stats.asked : 0.5;
      const gap = BASE_INTERVAL_SEC * (acc > 0.8 ? 1.4 : acc < 0.4 ? 0.7 : 1);
      if (lastAskAtRef.current > 0 && t - lastAskAtRef.current < gap) return;
      const next = pickNext(t);
      if (!next) return;
      askedRef.current.add(next.i);
      lastAskAtRef.current = t;
      const lim = TIME_LIMIT[diffOf(next.q)] ?? 18;
      setLimit(lim);
      setRemaining(lim);
      setActive({ q: next.q, index: next.i });
      setChosen(null);
      setOpen(true);
    }, 2000);
    return () => window.clearInterval(id);
  }, [visible, muted, active, getCurrentTime, pickNext, stats]);

  useEffect(() => {
    if (!active || chosen !== null) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [active, chosen]);

  // Timeout counts as a miss.
  useEffect(() => {
    if (!active || chosen !== null || remaining !== 0) return;
    register(false, active.q, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const register = (isCorrect: boolean, q: QuizQuestion, timeLeft: number) => {
    setStats((s) => {
      const streak = isCorrect ? s.streak + 1 : 0;
      const speedBonus = isCorrect ? Math.round((timeLeft / limit) * 10) : 0;
      const base = isCorrect ? (diffOf(q) === "hard" ? 30 : diffOf(q) === "medium" ? 20 : 10) : 0;
      return {
        asked: s.asked + 1,
        correct: s.correct + (isCorrect ? 1 : 0),
        streak,
        best: Math.max(s.best, streak),
        points: s.points + base + speedBonus + (streak >= 3 ? 10 : 0),
      };
    });
    setLevel((l) => {
      const idx = DIFF_ORDER.indexOf(l);
      if (isCorrect) return DIFF_ORDER[Math.min(idx + 1, 2)];
      return DIFF_ORDER[Math.max(idx - 1, 0)];
    });
    if (!isCorrect && q.topic) {
      setWeakTopics((w) => (w.includes(q.topic!) ? w : [...w, q.topic!]));
    }
  };

  const answer = (i: number) => {
    if (!active || chosen !== null || remaining === 0) return;
    setChosen(i);
    register(i === active.q.correctIndex, active.q, remaining);
  };

  if (!visible) return null;

  const dismiss = () => {
    setActive(null);
    setOpen(false);
  };

  const accuracy = stats.asked ? Math.round((stats.correct / stats.asked) * 100) : 0;
  const revealed = chosen !== null || remaining === 0;
  const pct = (remaining / limit) * 100;

  return (
    <>
      {/* Circular AI Orb with live timer ring */}
      <button
        onClick={() => (active ? setOpen((o) => !o) : setMuted((m) => !m))}
        aria-label={active ? "Open pop quiz" : muted ? "Enable auto polls" : "Mute auto polls"}
        className={cn(
          "fixed z-[60] bottom-24 right-4 sm:right-6 h-14 w-14 rounded-full",
          "bg-gradient-to-br from-primary via-accent to-primary",
          "shadow-[0_8px_30px_hsl(var(--accent)/0.45)] flex items-center justify-center",
          "text-accent-foreground ring-2 ring-foreground/10 hover:scale-105 transition-transform",
          active && !open && "animate-pulse",
        )}
        style={
          active
            ? {
                backgroundImage: `conic-gradient(hsl(var(--accent)) ${pct}%, hsl(var(--muted)) ${pct}%)`,
              }
            : undefined
        }
      >
        <span className="h-11 w-11 rounded-full bg-background/85 flex items-center justify-center">
          {muted && !active ? (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Sparkles className="h-5 w-5 text-accent" />
          )}
        </span>
        {active && !open && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-destructive-foreground">
            !
          </span>
        )}
        {!active && stats.streak > 1 && (
          <span className="absolute -top-1 -right-1 px-1.5 h-4 rounded-full bg-accent text-[10px] font-mono-hud flex items-center gap-0.5 text-accent-foreground">
            <Flame className="h-2.5 w-2.5" />
            {stats.streak}
          </span>
        )}
      </button>

      {/* Poll card */}
      {active && open && (
        <div className="fixed z-[60] bottom-44 right-3 left-3 sm:left-auto sm:right-6 sm:w-96 rounded-2xl bg-card/95 backdrop-blur border border-accent/25 shadow-elevated animate-scale-in overflow-hidden">
          <div className="h-0.5 bg-muted">
            <div
              className={cn("h-full transition-all duration-1000 ease-linear", remaining <= 5 ? "bg-destructive" : "bg-accent")}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-1.5 text-[10px] font-mono-hud uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Live poll
              <span className="px-1.5 py-0.5 rounded-full border border-foreground/10 text-muted-foreground">
                {diffOf(active.q)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-1 text-[11px] font-mono-hud px-1.5 py-0.5 rounded-full",
                  remaining <= 5 ? "bg-destructive/15 text-destructive" : "bg-muted",
                )}
              >
                <Timer className="h-3 w-3" /> {remaining}s
              </span>
              <button onClick={() => setMuted(true)} className="text-muted-foreground hover:text-foreground" aria-label="Mute polls">
                <Bell className="h-3.5 w-3.5" />
              </button>
              <button onClick={dismiss} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-1 text-[9px] font-mono-hud uppercase text-muted-foreground">
              {active.q.topic && <span className="px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">{active.q.topic}</span>}
              {active.q.timestamp && <span>@ {active.q.timestamp}</span>}
            </div>
            <p className="text-sm font-medium leading-relaxed">{active.q.question}</p>
            <div className="space-y-1.5">
              {active.q.options.map((opt, i) => {
                const isCorrect = i === active.q.correctIndex;
                const isChosen = chosen === i;
                return (
                  <button
                    key={i}
                    disabled={revealed}
                    onClick={() => answer(i)}
                    className={cn(
                      "w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors",
                      !revealed && "hover:bg-accent/10 border-foreground/[0.08]",
                      revealed && isCorrect && "bg-success/15 border-success/50 text-success",
                      revealed && isChosen && !isCorrect && "bg-destructive/15 border-destructive/50 text-destructive",
                      revealed && !isChosen && !isCorrect && "opacity-55 border-foreground/[0.06]",
                    )}
                  >
                    <span className="font-mono-hud text-[10px] text-accent mr-1.5">{String.fromCharCode(65 + i)}</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {revealed && active.q.explanation && (
              <div className="rounded-lg border border-accent/25 bg-accent/[0.06] p-2.5 flex gap-2 animate-fade-in">
                <Lightbulb className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-foreground/85">{active.q.explanation}</p>
              </div>
            )}

            {revealed && (
              <>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="rounded-lg border border-foreground/[0.07] bg-secondary/25 py-1.5">
                    <p className="text-[9px] font-mono-hud uppercase text-muted-foreground">Accuracy</p>
                    <p className="text-sm font-semibold">{accuracy}%</p>
                  </div>
                  <div className="rounded-lg border border-foreground/[0.07] bg-secondary/25 py-1.5">
                    <p className="text-[9px] font-mono-hud uppercase text-muted-foreground">Streak</p>
                    <p className="text-sm font-semibold flex items-center justify-center gap-1">
                      <Flame className="h-3 w-3 text-accent" />
                      {stats.streak}
                    </p>
                  </div>
                  <div className="rounded-lg border border-foreground/[0.07] bg-secondary/25 py-1.5">
                    <p className="text-[9px] font-mono-hud uppercase text-muted-foreground">Points</p>
                    <p className="text-sm font-semibold flex items-center justify-center gap-1">
                      <Zap className="h-3 w-3 text-accent" />
                      {stats.points}
                    </p>
                  </div>
                </div>
                {weakTopics.length > 0 && (
                  <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                    <Target className="h-3 w-3 mt-0.5 shrink-0 text-destructive" />
                    Revisit: {weakTopics.slice(-3).join(", ")}
                  </p>
                )}
                <button
                  onClick={dismiss}
                  className="w-full mt-1 text-xs font-medium py-2 rounded-lg gradient-accent text-accent-foreground"
                >
                  Continue watching
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AIQuizCompanion;
