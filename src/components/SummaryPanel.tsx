import { CheckCircle } from "lucide-react";

interface SummaryPanelProps {
  summary: string[];
}

const SummaryPanel = ({ summary }: SummaryPanelProps) => {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
        Key Takeaways
      </h3>
      <ul className="space-y-2.5">
        {summary.map((point, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <CheckCircle className="h-4 w-4 mt-0.5 text-accent shrink-0" />
            <span className="text-foreground/85 leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SummaryPanel;
