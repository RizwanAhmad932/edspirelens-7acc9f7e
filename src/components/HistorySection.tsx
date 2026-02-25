import { Clock, Trophy, ChevronRight } from "lucide-react";
import { VideoAnalysis } from "@/lib/mockData";

interface HistorySectionProps {
  history: VideoAnalysis[];
  onSelect: (analysis: VideoAnalysis) => void;
}

const HistorySection = ({ history, onSelect }: HistorySectionProps) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-accent" />
        Recent Analyses
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="text-left p-5 rounded-xl bg-card border border-border shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-display font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-accent transition-colors">
                {item.video_title}
              </h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent shrink-0 ml-2 transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {item.duration || "—"} • {new Date(item.created_at).toLocaleDateString()}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                {item.summary.length} insights
              </span>
              {item.quiz_score != null && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {item.quiz_score}/{item.quiz_total}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HistorySection;
