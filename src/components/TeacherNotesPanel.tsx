import { useState } from "react";
import { Loader2, Sparkles, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateTeacherNotes, TranscriptSegment, TeacherNoteBlock } from "@/lib/mockData";
import { toast } from "sonner";

interface Props {
  chapterTitle: string;
  transcript: TranscriptSegment[];
}

const TeacherNotesPanel = ({ chapterTitle, transcript }: Props) => {
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<TeacherNoteBlock[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateTeacherNotes(chapterTitle, transcript);
      setBlocks(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to extract notes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-accent" /> Teacher's Board Notes
        </h3>
        {blocks.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleGenerate} className="text-xs h-7">
            Regenerate
          </Button>
        )}
      </div>

      {blocks.length === 0 && !loading && (
        <div className="text-center py-6 space-y-3">
          <p className="text-xs text-muted-foreground">
            AI extracts what the teacher actually wrote on the board / slides — formulas, diagrams and headings — verbatim.
          </p>
          <Button size="sm" onClick={handleGenerate} className="gap-2 gradient-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Extract Board Notes
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-10 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-xs text-muted-foreground">Reconstructing teacher's board…</p>
        </div>
      )}

      {blocks.length > 0 && (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {blocks.map((b, i) => (
            <div key={i} className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                {b.timestamp && (
                  <span className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                    {b.timestamp}
                  </span>
                )}
                <h4 className="text-sm font-semibold text-foreground">{b.heading}</h4>
              </div>
              {b.formula && (
                <pre className="text-xs font-mono bg-background/60 border border-border rounded p-2 whitespace-pre-wrap break-words">
                  {b.formula}
                </pre>
              )}
              {b.diagram && (
                <p className="text-[11px] italic text-muted-foreground">📐 Diagram: {b.diagram}</p>
              )}
              {b.bullets && b.bullets.length > 0 && (
                <ul className="text-xs text-foreground/85 space-y-1 list-disc pl-5">
                  {b.bullets.map((bl, j) => <li key={j}>{bl}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherNotesPanel;