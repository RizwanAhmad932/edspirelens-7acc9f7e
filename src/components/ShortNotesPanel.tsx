import { useState } from "react";
import { Loader2, Sparkles, Copy, Lightbulb, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateShortNotes, ShortNotes, TranscriptSegment } from "@/lib/mockData";
import { exportCheatSheetPdf } from "@/lib/pdfExport";

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
      const data = await generateShortNotes(chapterTitle, transcript);
      setNotes(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate notes");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!notes) return;
    const text = [
      `# ${notes.title}`,
      "\n## Key Points",
      ...notes.keyPoints.map((p) => `• ${p}`),
      "\n## Formulas",
      ...notes.formulas.map((f) => `▸ ${f}`),
      "\n## Key Terms",
      ...notes.keyTerms.map((t) => `${t.term}: ${t.definition}`),
      `\n💡 Remember: ${notes.rememberTip}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Notes copied!");
  };

  const handleExport = () => {
    if (!notes) return;
    exportCheatSheetPdf(chapterTitle, notes);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider">Short Notes</h3>
        {notes && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1 text-xs">
              <Copy className="h-3 w-3" /> Copy
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport} className="h-7 gap-1 text-xs">
              <Download className="h-3 w-3" /> PDF
            </Button>
          </div>
        )}
      </div>

      {!notes && !loading && (
        <div className="text-center py-6 space-y-3">
          <p className="text-xs text-muted-foreground">AI cheat-sheet for 5-minute revision.</p>
          <Button size="sm" onClick={handleGenerate} className="gap-2 gradient-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Generate Short Notes
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
        <div className="space-y-4 text-xs">
          <div className="rounded-xl bg-accent/5 border border-accent/20 p-3">
            <h4 className="font-bold text-foreground text-sm mb-2">{notes.title}</h4>
            <ul className="space-y-1.5">
              {notes.keyPoints.map((p, i) => (
                <li key={i} className="flex gap-2"><span className="text-accent">•</span><span className="text-foreground/90">{p}</span></li>
              ))}
            </ul>
          </div>

          {notes.formulas.length > 0 && (
            <div className="rounded-xl bg-secondary/40 border border-border p-3">
              <h4 className="font-semibold text-foreground mb-2 uppercase tracking-wide text-[10px]">Formulas</h4>
              <div className="space-y-1.5">
                {notes.formulas.map((f, i) => (
                  <div key={i} className="font-mono text-foreground bg-card rounded px-2 py-1 border border-border/50">{f}</div>
                ))}
              </div>
            </div>
          )}

          {notes.keyTerms.length > 0 && (
            <div className="rounded-xl bg-secondary/40 border border-border p-3">
              <h4 className="font-semibold text-foreground mb-2 uppercase tracking-wide text-[10px]">Key Terms</h4>
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

          {notes.rememberTip && (
            <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 flex gap-2">
              <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-[11px] uppercase tracking-wide mb-0.5">Remember</p>
                <p className="text-foreground/85">{notes.rememberTip}</p>
              </div>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={handleGenerate} className="w-full">Regenerate</Button>
        </div>
      )}
    </div>
  );
};

export default ShortNotesPanel;