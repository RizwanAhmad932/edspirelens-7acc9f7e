import { useState } from "react";
import { Loader2, Sparkles, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateTeacherNotes, TranscriptSegment, TeacherNoteBlock } from "@/lib/mockData";
import { PanelHeader, ExportButton } from "@/components/panel/PanelFrame";
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
      setBlocks(await generateTeacherNotes(chapterTitle, transcript));
    } catch (e: any) {
      toast.error(e.message || "Failed to extract notes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <PanelHeader
        label="Board Notes"
        icon={<ClipboardList className="h-3.5 w-3.5" />}
        meta={blocks.length ? `${blocks.length} sections` : undefined}
        actions={
          blocks.length > 0 && (
            <ExportButton
              title={`${chapterTitle} — Teacher's Board Notes`}
              subtitle="Reconstructed from the lecture"
              sections={blocks.flatMap((b) => {
                const head = b.timestamp ? `${b.heading} [${b.timestamp}]` : b.heading;
                const out: any[] = [];
                if (b.bullets?.length) out.push({ heading: head, type: "list", items: b.bullets });
                else out.push({ heading: head, type: "text", items: [b.diagram || ""] });
                if (b.formula) out.push({ heading: `${b.heading} — Formula`, type: "formula", items: [b.formula] });
                return out;
              })}
            />
          )
        }
      />

      {blocks.length === 0 && !loading && (
        <div className="text-center py-6 space-y-3">
          <p className="text-xs text-muted-foreground">
            AI reconstructs exactly what the teacher wrote on the board — headings, formulas and diagrams.
          </p>
          <Button size="sm" onClick={handleGenerate} className="gap-2 gradient-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Extract board notes
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-10 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-xs text-muted-foreground">Reconstructing the blackboard…</p>
        </div>
      )}

      {blocks.length > 0 && (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {blocks.map((b, i) => (
            <div
              key={i}
              className="relative rounded-xl border border-foreground/[0.07] bg-secondary/25 p-3 pl-4 space-y-2 transition-colors hover:border-accent/35"
            >
              <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-accent/50" />
              <div className="flex items-center gap-2">
                {b.timestamp && (
                  <span className="text-[10px] font-mono-hud text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                    {b.timestamp}
                  </span>
                )}
                <h4 className="text-sm font-semibold text-foreground">{b.heading}</h4>
              </div>
              {b.formula && (
                <pre className="text-xs font-mono-hud bg-background/70 border border-accent/20 rounded-lg p-2.5 whitespace-pre-wrap break-words text-accent">
                  {b.formula}
                </pre>
              )}
              {b.diagram && <p className="text-[11px] italic text-muted-foreground">📐 {b.diagram}</p>}
              {b.bullets && b.bullets.length > 0 && (
                <ul className="text-xs text-foreground/85 space-y-1 list-disc pl-5">
                  {b.bullets.map((bl, j) => (
                    <li key={j}>{bl}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={handleGenerate} className="w-full">
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
};

export default TeacherNotesPanel;
