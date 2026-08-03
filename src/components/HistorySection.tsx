import { memo } from "react";
import { Clock, Trophy, ChevronRight } from "lucide-react";
import { VideoAnalysis } from "@/lib/mockData";

interface HistorySectionProps {
  history: VideoAnalysis[];
  onSelect: (analysis: VideoAnalysis) => void;
}

const HistorySection = memo(({ history, onSelect }: HistorySectionProps) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="hud-label flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          Recent Mastery
        </h2>
        <span className="font-mono-hud text-[10px] text-muted-foreground">{history.length} INDEXED</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {history.map((item, index) => {
          const pct =
            item.quiz_score != null && item.quiz_total
              ? Math.round((item.quiz_score / item.quiz_total) * 100)
              : null;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="text-left p-4 sm:p-5 bento bento-hover group animate-fade-in relative overflow-hidden"
              style={{ animationDelay: `${index * 70}ms`, animationFillMode: "both" }}
            >
              <div className="absolute inset-0 grid-noise pointer-events-none" />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-accent transition-colors">
                    {item.video_title}
                  </h3>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent shrink-0 ml-2 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="font-mono-hud text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
                  {item.duration || "—"} · {new Date(item.created_at).toLocaleDateString()} · {item.summary.length} insights
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-foreground/10 overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-accent transition-all duration-700"
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </div>
                  <span className="font-mono-hud text-[10px] text-accent flex items-center gap-1 shrink-0">
                    {pct != null ? (
                      <>
                        <Trophy className="h-3 w-3" />
                        {pct}%
                      </>
                    ) : (
                      "NOT QUIZZED"
                    )}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

HistorySection.displayName = "HistorySection";

export default HistorySection;
