import { CheckCircle, BookOpen } from "lucide-react";
import { PanelHeader, ExportButton } from "@/components/panel/PanelFrame";

interface SummaryPanelProps {
  summary: string[];
  chapterTitle?: string;
}

const SummaryPanel = ({ summary, chapterTitle = "Chapter" }: SummaryPanelProps) => {
  return (
    <div className="space-y-3">
      <PanelHeader
        label="Key Takeaways"
        icon={<BookOpen className="h-3.5 w-3.5" />}
        meta={`${summary.length} pts`}
        actions={
          <ExportButton
            title={`${chapterTitle} — Summary`}
            subtitle="AI-generated chapter summary"
            sections={[{ heading: "Key Takeaways", type: "list", items: summary }]}
          />
        }
      />

      {summary.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">No summary generated yet.</p>
      ) : (
        <ul className="space-y-2">
          {summary.map((point, i) => (
            <li
              key={i}
              className="group relative flex items-start gap-3 rounded-xl border border-foreground/[0.07] bg-secondary/25 p-3 text-sm transition-colors hover:border-accent/40 hover:bg-accent/[0.06]"
            >
              <span className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-accent/0 transition-colors group-hover:bg-accent/70" />
              <span className="font-mono-hud text-[10px] text-accent/70 mt-0.5 w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-accent shrink-0" />
              <span className="text-foreground/85 leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SummaryPanel;
