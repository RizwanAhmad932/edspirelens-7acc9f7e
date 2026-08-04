import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Loader2, Check, X, Zap, Layers, Shuffle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelHeader, ExportButton, HudProgress } from "@/components/panel/PanelFrame";
import { cn } from "@/lib/utils";

export interface Flashcard {
  front: string;
  back: string;
  hint?: string;
  topic?: string;
  difficulty?: string;
}

interface FlashcardPanelProps {
  flashcards: Flashcard[];
  loading?: boolean;
  deckId?: string;
}

type Rating = "again" | "hard" | "good";

/** SM-2-lite state per card: ease box, virtual due position and streak. */
interface CardState { ease: number; due: number; streak?: number; }

function loadState(key: string): Record<number, CardState> {
  try { return JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch { return {}; }
}
function saveState(key: string, state: Record<number, CardState>) {
  try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* ignore */ }
}

const FlashcardPanel = ({ flashcards, loading, deckId }: FlashcardPanelProps) => {
  const storageKey = `srs:${deckId || "default"}:${flashcards.length}`;
  const [state, setState] = useState<Record<number, CardState>>(() => loadState(storageKey));
  const [step, setStep] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [topic, setTopic] = useState<string>("all");
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [session, setSession] = useState({ again: 0, hard: 0, good: 0 });

  useEffect(() => {
    setState(loadState(storageKey));
    setStep(0);
    setFlipped(false);
    setShowHint(false);
  }, [storageKey]);

  const topics = useMemo(
    () => Array.from(new Set(flashcards.map((c) => c.topic).filter(Boolean))) as string[],
    [flashcards],
  );

  // Order by SRS due position, filtered by topic; reshuffle on demand.
  const order = useMemo(() => {
    const idx = flashcards
      .map((c, i) => ({ i, c }))
      .filter(({ c }) => topic === "all" || c.topic === topic)
      .map(({ i }) => ({ i, due: state[i]?.due ?? i }))
      .sort((a, b) => a.due - b.due)
      .map((o) => o.i);
    if (shuffleSeed === 0) return idx;
    return [...idx].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashcards, state, topic, shuffleSeed]);

  const currentIdx = order[step] ?? order[0] ?? 0;
  const card = flashcards[currentIdx];

  const rate = (r: Rating) => {
    const prev = state[currentIdx] ?? { ease: 1, due: currentIdx, streak: 0 };
    let ease = prev.ease;
    let streak = prev.streak ?? 0;
    let gap: number;
    if (r === "again") { ease = 1; streak = 0; gap = 1; }
    else if (r === "hard") { ease = Math.max(1, ease); streak = streak; gap = 3; }
    else { ease = ease + 1; streak = streak + 1; gap = Math.min(24, 5 * ease); }
    const updated = { ...state, [currentIdx]: { ease, due: step + gap, streak } };
    setState(updated);
    saveState(storageKey, updated);
    setSession((s) => ({ ...s, [r]: s[r] + 1 }));
    setFlipped(false);
    setShowHint(false);
    setStep((s) => (order.length ? (s + 1) % order.length : 0));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-xs text-muted-foreground">Building your deck…</p>
      </div>
    );
  }

  if (flashcards.length === 0 || !card) {
    return <p className="text-xs text-muted-foreground text-center py-8">No flashcards available yet.</p>;
  }

  const mastered = Object.values(state).filter((s) => (s.streak ?? 0) >= 2).length;
  const masteryPct = (mastered / flashcards.length) * 100;

  return (
    <div className="space-y-3">
      <PanelHeader
        label="Flashcards · SRS"
        icon={<Layers className="h-3.5 w-3.5" />}
        meta={`${step + 1}/${order.length}`}
        actions={
          <ExportButton
            title="Flashcard Deck"
            subtitle={`${flashcards.length} cards`}
            sections={[
              {
                heading: "Flashcards",
                type: "qa",
                items: flashcards.map((c) => ({
                  question: c.front,
                  answer: c.back,
                  meta: [c.topic, c.difficulty].filter(Boolean).join(" · "),
                })),
              },
            ]}
          />
        }
      />

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px] font-mono-hud uppercase text-muted-foreground">
          <span>Mastery</span>
          <span className="text-accent">{mastered}/{flashcards.length}</span>
        </div>
        <HudProgress value={masteryPct} />
      </div>

      {topics.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {["all", ...topics].map((t) => (
            <button
              key={t}
              onClick={() => { setTopic(t); setStep(0); setFlipped(false); }}
              className={cn(
                "text-[9px] font-mono-hud uppercase px-2 py-0.5 rounded-full border transition-colors",
                topic === t ? "bg-accent/15 text-accent border-accent/50" : "border-foreground/10 text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="[perspective:1200px]">
        <button
          onClick={() => setFlipped((f) => !f)}
          className="relative w-full min-h-[170px] text-left"
        >
          <div
            className={cn(
              "relative w-full min-h-[170px] transition-transform duration-500 [transform-style:preserve-3d]",
              flipped && "[transform:rotateY(180deg)]",
            )}
          >
            <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl border border-accent/25 bg-secondary/30 p-5 flex flex-col items-center justify-center text-center gap-3 scan-lines">
              <span className="hud-label">Question</span>
              <p className="text-sm font-medium text-foreground leading-relaxed">{card.front}</p>
              <div className="flex items-center gap-1.5">
                {card.difficulty && (
                  <span className="text-[9px] font-mono-hud uppercase px-2 py-0.5 rounded-full border border-foreground/10 text-muted-foreground">
                    {card.difficulty}
                  </span>
                )}
                <span className="text-[10px] text-accent">Tap to flip</span>
              </div>
            </div>
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl border border-success/30 bg-success/[0.07] p-5 flex flex-col items-center justify-center text-center gap-2">
              <span className="hud-label">Answer</span>
              <p className="text-sm font-medium text-foreground leading-relaxed">{card.back}</p>
            </div>
          </div>
        </button>
      </div>

      {!flipped && card.hint && (
        <button
          onClick={() => setShowHint((h) => !h)}
          className="w-full text-[11px] text-muted-foreground flex items-center justify-center gap-1 hover:text-accent transition-colors"
        >
          <Eye className="h-3 w-3" /> {showHint ? card.hint : "Show hint"}
        </button>
      )}

      {flipped ? (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => rate("again")} className="gap-1 border-destructive/40 hover:bg-destructive/10 text-destructive">
            <X className="h-3.5 w-3.5" /> Again
          </Button>
          <Button variant="outline" size="sm" onClick={() => rate("hard")} className="gap-1 border-warning/40 hover:bg-warning/10 text-warning">
            <Zap className="h-3.5 w-3.5" /> Hard
          </Button>
          <Button variant="outline" size="sm" onClick={() => rate("good")} className="gap-1 border-success/40 hover:bg-success/10 text-success">
            <Check className="h-3.5 w-3.5" /> Good
          </Button>
        </div>
      ) : (
        <p className="text-[10px] font-mono-hud uppercase tracking-wider text-center text-muted-foreground">
          Session · {session.good} good / {session.hard} hard / {session.again} again
        </p>
      )}

      <div className="flex items-center justify-between gap-1">
        <Button variant="outline" size="sm" disabled={step === 0} onClick={() => { setStep((s) => s - 1); setFlipped(false); setShowHint(false); }} className="gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </Button>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setShuffleSeed((s) => s + 1); setStep(0); setFlipped(false); }} className="gap-1">
            <Shuffle className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setState({}); saveState(storageKey, {}); setStep(0); setFlipped(false); setSession({ again: 0, hard: 0, good: 0 }); }}
            className="gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Button variant="outline" size="sm" disabled={step >= order.length - 1} onClick={() => { setStep((s) => s + 1); setFlipped(false); setShowHint(false); }} className="gap-1">
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default FlashcardPanel;
