import { useState } from "react";
import { Loader2, Sparkles, Copy, Lightbulb, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateShortNotes, ShortNotes, TranscriptSegment } from "@/lib/mockData";
import { PanelHeader, ExportButton } from "@/components/panel/PanelFrame";
import type { DocSection } from "@/lib/exportDoc";

interface Props {
  chapterTitle: string;
  transcript: TranscriptSegment[];
}

const ShortNotesPanel = ({ chapterTitle, transcript }: Props) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<ShortNotes | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      setNotes(await generateShortNotes(chapterTitle, transcript));
    } catch (e: any) {
      toast.error(e.message || "Failed to generate notes");
    } finally {
      setLoading(false);
    }
  };

  const sections: DocSection[] = notes
    ? [
        { heading: "Key Points", type: "list", items: notes.keyPoints || [] },
        { heading: "Formulas", type: "formula", items: notes.formulas || [] },
        { heading: "Key Terms", type: "kv", items: notes.keyTerms || [] },
        { heading: "Mnemonics", type: "list", items: notes.mnemonics || [] },
        { heading: "Common Mistakes", type: "list", items: notes.commonMistakes || [] },
        { heading: "Remember", type: "text", items: notes.rememberTip ? [notes.rememberTip] : [] },
      ]
    : [];

  const handleCopy = () => {
    if (!notes) return;
    const text = [
      `# ${notes.title}`,
      "\n## Key Points",
      ...(notes.keyPoints || []).map((p) => `• ${p}`),
      "\n## Formulas",
      ...(notes.formulas || []).map((f) => `▸ ${f}`),
      "\n## Key Terms",
      ...(notes.keyTerms || []).map((t) => `${t.term}: ${t.definition}`),
      ...(notes.mnemonics?.length ? ["\n## Mnemonics", ...notes.mnemonics.map((m) => `★ ${m}`)] : []),
      ...(notes.commonMistakes?.length ? ["\n## Common Mistakes", ...notes.commonMistakes.map((m) => `✗ ${m}`)] : []),
      `\n💡 Remember: ${notes.rememberTip}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Cheat sheet copied");
  };

  return (
    <div className="space-y-3">
      <PanelHeader
        label="Short Notes"
        icon={<Zap className="h-3.5 w-3.5" />}
        meta={notes ? `${notes.keyPoints?.length || 0} pts` : undefined}
        actions={
          notes && (
            <>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-full border border-foreground/10 text-muted-foreground font-mono-hud uppercase tracking-[0.14em] text-[9px] px-2 py-1 hover:text-accent hover:border-accent/40 transition-colors"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
              <ExportButton
                title={notes.title || `${chapterTitle} — Cheat Sheet`}
                subtitle={`${chapterTitle} · 5-minute revision`}
                sections={sections}
              />
            </>
          )
        }
      />

      {!notes && !loading && (
        <div className="text-center py-6 space-y-3">
          <p className="text-xs text-muted-foreground">Exam cheat-sheet you can revise in 5 minutes.</p>
          <Button size="sm" onClick={handleGenerate} className="gap-2 gradient-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Generate short notes
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-10 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-xs text-muted-foreground">Distilling key points…</p>
        </div>
      )}

      {notes && (
        <div className="space-y-3 text-xs">
          <div className="rounded-xl bg-accent/[0.06] border border-accent/25 p-3 scan-lines">
            <h4 className="font-bold text-foreground text-sm mb-2">{notes.title}</h4>
            <ul className="space-y-1.5">
              {(notes.keyPoints || []).map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono-hud text-[9px] text-accent mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-foreground/90">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {notes.formulas?.length > 0 && (
            <div className="rounded-xl bg-secondary/25 border border-foreground/[0.07] p-3">
              <p className="hud-label mb-2">Formulas</p>
              <div className="space-y-1.5">
                {notes.formulas.map((f, i) => (
                  <div key={i} className="font-mono-hud text-accent bg-background/60 rounded-lg px-2.5 py-1.5 border border-accent/20">
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {notes.keyTerms?.length > 0 && (
            <div className="rounded-xl bg-secondary/25 border border-foreground/[0.07] p-3">
              <p className="hud-label mb-2">Key Terms</p>
              <dl className="space-y-2">
                {notes.keyTerms.map((t, i) => (
                  <div key={i}>
                    <dt className="font-semibold text-accent">{t.term}</dt>
                    <dd className="text-foreground/80">{t.definition}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {notes.mnemonics && notes.mnemonics.length > 0 && (
            <div className="rounded-xl bg-primary/[0.07] border border-primary/25 p-3">
              <p className="hud-label mb-2">Mnemonics</p>
              <ul className="space-y-1 text-foreground/85">
                {notes.mnemonics.map((m, i) => (
                  <li key={i}>★ {m}</li>
                ))}
              </ul>
            </div>
          )}

          {notes.commonMistakes && notes.commonMistakes.length > 0 && (
            <div className="rounded-xl bg-destructive/[0.06] border border-destructive/25 p-3">
              <p className="hud-label mb-2 flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" /> Common mistakes
              </p>
              <ul className="space-y-1 text-foreground/85">
                {notes.commonMistakes.map((m, i) => (
                  <li key={i}>✗ {m}</li>
                ))}
              </ul>
            </div>
          )}

          {notes.rememberTip && (
            <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 flex gap-2">
              <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="hud-label mb-0.5">Remember</p>
                <p className="text-foreground/85">{notes.rememberTip}</p>
              </div>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={handleGenerate} className="w-full">
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShortNotesPanel;
