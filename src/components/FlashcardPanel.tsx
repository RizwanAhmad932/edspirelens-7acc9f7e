import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardPanelProps {
  flashcards: Flashcard[];
  loading?: boolean;
}

const FlashcardPanel = ({ flashcards, loading }: FlashcardPanelProps) => {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

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

  const card = flashcards[current];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">Flashcards</h3>
        <span className="text-xs text-muted-foreground">{current + 1}/{flashcards.length}</span>
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

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={current === 0}
          onClick={() => { setCurrent(c => c - 1); setFlipped(false); }}
          className="gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setCurrent(0); setFlipped(false); }}
          className="gap-1"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={current === flashcards.length - 1}
          onClick={() => { setCurrent(c => c + 1); setFlipped(false); }}
          className="gap-1"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default FlashcardPanel;
