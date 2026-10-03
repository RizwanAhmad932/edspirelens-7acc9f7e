import { useEffect, useState } from "react";
import { Layers, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { dueCards, loadDeck, onDeckChange, reviewCard, SrsCard, SrsRating } from "@/lib/srsDeck";
import { cn } from "@/lib/utils";

const XP = { again: 1, hard: 2, good: 3, easy: 4 } as const;

const DueTodayDeck = ({ className }: { className?: string }) => {
  const [due, setDue] = useState<SrsCard[]>(() => dueCards());
  const [total, setTotal] = useState(() => Object.keys(loadDeck()).length);
  const [open, setOpen] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [xp, setXp] = useState(0);

  useEffect(() => onDeckChange(() => { setDue(dueCards()); setTotal(Object.keys(loadDeck()).length); }), []);

  const card = due[0];

  const rate = (r: SrsRating) => {
    if (!card) return;
    reviewCard(card.id, r);
    setFlipped(false);
    setDone((n) => n + 1);
    setXp((n) => n + XP[r]);
  };

  // Award XP once the session ends (or the user closes it).
  const finish = async () => {
    setOpen(false);
    if (xp > 0) {
      const { data } = await supabase.auth.getUser();
      if (data.user) await supabase.rpc("add_xp", { _user_id: data.user.id, _amount: xp }).then(() => {}, () => {});
      setXp(0);
    }
  };

  if (total === 0) return null;

  return (
    <section className={cn("bg-card border border-border rounded-2xl p-4 shadow-card space-y-3", className)}>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
          <Layers className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Due today</p>
          <p className="text-[11px] text-muted-foreground">
            {due.length > 0 ? `${due.length} flashcard${due.length === 1 ? "" : "s"} to review from all your lectures` : `All caught up · ${total} cards in your deck`}
          </p>
        </div>
        {!open && due.length > 0 && <Button size="sm" onClick={() => { setOpen(true); setDone(0); }}>Review</Button>}
        {open && <Button size="sm" variant="ghost" onClick={finish}>Close</Button>}
      </div>

      {open && card && (
        <div className="space-y-3">
          <button
            onClick={() => setFlipped((f) => !f)}
            className="w-full min-h-[140px] rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:border-accent/50"
          >
            <p className="text-[9px] font-mono-hud uppercase tracking-wider text-muted-foreground mb-2">
              {flipped ? "Answer" : card.topic || card.deck} · tap to {flipped ? "see question" : "flip"}
            </p>
            <p className="text-sm whitespace-pre-wrap">{flipped ? card.back : card.front}</p>
          </button>
          {flipped ? (
            <div className="grid grid-cols-4 gap-2">
              <Button size="sm" variant="outline" onClick={() => rate("again")}><RotateCcw className="h-3 w-3" /> Again</Button>
              <Button size="sm" variant="outline" onClick={() => rate("hard")}>Hard</Button>
              <Button size="sm" variant="secondary" onClick={() => rate("good")}>Good</Button>
              <Button size="sm" onClick={() => rate("easy")}>Easy</Button>
            </div>
          ) : (
            <Button className="w-full" variant="secondary" onClick={() => setFlipped(true)}>Show answer</Button>
          )}
          <p className="text-[10px] text-muted-foreground text-center">{done} reviewed · {due.length} left · +{xp} XP</p>
        </div>
      )}

      {open && !card && (
        <div className="text-center py-4 space-y-2">
          <CheckCircle2 className="h-6 w-6 text-accent mx-auto" />
          <p className="text-sm font-medium">Session complete — {done} cards reviewed</p>
          <Button size="sm" onClick={finish}>Collect +{xp} XP</Button>
        </div>
      )}
    </section>
  );
};

export default DueTodayDeck;
