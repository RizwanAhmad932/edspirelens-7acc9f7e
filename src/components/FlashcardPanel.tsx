import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Loader2, Check, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardPanelProps {
  flashcards: Flashcard[];
  loading?: boolean;
  deckId?: string;
}

type Rating = "again" | "hard" | "good";

// SM-2-lite: each card has an ease (interval count) and next-due index.
interface CardState { ease: number; due: number; }

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

  useEffect(() => { setState(loadState(storageKey)); setStep(0); setFlipped(false); }, [storageKey]);

  // Order cards by SRS due date (lower due first); default = original index.
  const order = useMemo(() => {
    return flashcards
      .map((_, i) => ({ i, due: state[i]?.due ?? i }))
      .sort((a, b) => a.due - b.due)
      .map((o) => o.i);
  }, [flashcards, state]);

  const currentIdx = order[step] ?? 0;
  const card = flashcards[currentIdx];

  const rate = (r: Rating) => {
    const prev = state[currentIdx] ?? { ease: 1, due: currentIdx };
    let ease = prev.ease;
    let gap: number;
    if (r === "again") { ease = 1; gap = 1; }
    else if (r === "hard") { ease = Math.max(1, ease); gap = 3; }
    else { ease = ease + 1; gap = Math.min(20, 5 * ease); }
    const next = { ease, due: step + gap };
    const updated = { ...state, [currentIdx]: next };
    setState(updated);
    saveState(storageKey, updated);
    setFlipped(false);
    setStep((s) => (s + 1) % flashcards.length);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-xs text-muted-foreground">Generating flashcards...</p>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-8">No flashcards available yet.</p>;
  }

  const reviewed = Object.keys(state).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">Flashcards · SRS</h3>
        <span className="text-xs text-muted-foreground">{step + 1}/{flashcards.length} · {reviewed} reviewed</span>
      </div>

      <button
        onClick={() => setFlipped(!flipped)}
        className="w-full min-h-[140px] p-5 rounded-xl border-2 border-border bg-secondary/30 hover:bg-secondary/50 transition-all text-center cursor-pointer"
      >
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
          {flipped ? "Answer" : "Question"}
        </p>
        <p className="text-sm font-medium text-foreground leading-relaxed">
          {flipped ? card.back : card.front}
        </p>
        <p className="text-xs text-accent mt-3">Tap to flip</p>
      </button>

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
        <p className="text-[11px] text-center text-muted-foreground">Flip the card, then rate how well you knew it.</p>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={step === 0}
          onClick={() => { setStep(s => s - 1); setFlipped(false); }}
          className="gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setState({}); saveState(storageKey, {}); setStep(0); setFlipped(false); }}
          className="gap-1"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset SRS
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={step === flashcards.length - 1}
          onClick={() => { setStep(s => s + 1); setFlipped(false); }}
          className="gap-1"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default FlashcardPanel;
