import { useState } from "react";
import { FileText, Clock, Search } from "lucide-react";
import { TranscriptSegment } from "@/lib/mockData";
import { PanelHeader, ExportButton } from "@/components/panel/PanelFrame";

interface NotesPanelProps {
  notes: string[];
  transcript: TranscriptSegment[];
  chapterTitle?: string;
}

const NotesPanel = ({ notes, transcript, chapterTitle = "Chapter" }: NotesPanelProps) => {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q ? notes.filter((n) => n.toLowerCase().includes(q)) : notes;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <PanelHeader
          label="Detailed Notes"
          icon={<FileText className="h-3.5 w-3.5" />}
          meta={`${notes.length}`}
          actions={
            <ExportButton
              title={`${chapterTitle} — Detailed Notes`}
              subtitle="AI-generated textbook notes"
              sections={[
                { heading: "Detailed Notes", type: "text", items: notes },
                {
                  heading: "Transcript",
                  type: "text",
                  items: transcript.map((s) => `[${s.timestamp}] ${s.text}`),
                },
              ]}
            />
          }
        />

        {notes.length > 4 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter notes…"
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-secondary/40 border border-foreground/[0.07] text-xs outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        )}

        <div className="space-y-2">
          {filtered.length > 0 ? (
            filtered.map((note, i) => (
              <div
                key={i}
                className="relative rounded-xl border border-foreground/[0.07] bg-secondary/25 p-3 pl-4 transition-colors hover:border-accent/35"
              >
                <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-accent/40" />
                <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap">{note}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">No matching notes.</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <PanelHeader
          label="Transcript"
          icon={<Clock className="h-3.5 w-3.5" />}
          meta={`${transcript.length} seg`}
        />
        <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
          {transcript.map((seg, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-accent/[0.07] transition-colors"
            >
              <span className="text-[10px] font-mono-hud text-accent shrink-0 mt-0.5 min-w-[38px]">
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
