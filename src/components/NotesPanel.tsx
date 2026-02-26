import { FileText, Clock } from "lucide-react";
import { TranscriptSegment } from "@/lib/mockData";

interface NotesPanelProps {
  notes: string[];
  transcript: TranscriptSegment[];
}

const NotesPanel = ({ notes, transcript }: NotesPanelProps) => {
  return (
    <div className="space-y-4">
      {/* Detailed Notes */}
      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          Detailed Notes
        </h3>
        <div className="space-y-2">
          {notes.length > 0 ? (
            notes.map((note, i) => (
              <div key={i} className="p-3 rounded-lg bg-secondary/40 border border-border/50">
                <p className="text-xs text-foreground/85 leading-relaxed">{note}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No detailed notes available.</p>
          )}
        </div>
      </div>

      {/* Full Transcript */}
      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" />
          Transcript
        </h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {transcript.map((seg, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-secondary/40 transition-colors">
              <span className="text-xs font-mono text-accent shrink-0 mt-0.5 min-w-[40px]">
                {seg.timestamp}
              </span>
              <p className="text-xs text-foreground/80 leading-relaxed">{seg.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotesPanel;
