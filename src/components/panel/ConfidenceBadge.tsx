import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value?: number | null;
  /** true when a real source (web paper / transcript line) backs the item */
  verified?: boolean;
  className?: string;
}

/**
 * Small trust indicator so students can see which AI answers are reliable
 * and which are worth double-checking.
 */
const ConfidenceBadge = ({ value, verified, className }: Props) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return null;
  const v = Math.max(0, Math.min(100, Math.round(Number(value))));
  const high = v >= 80;
  const mid = v >= 60 && v < 80;
  const Icon = high ? ShieldCheck : mid ? ShieldQuestion : ShieldAlert;

  return (
    <span
      title={
        high
          ? "High confidence — cross-checked and reliable"
          : mid
          ? "Moderate confidence — worth a quick double-check"
          : "Low confidence — verify before you rely on this"
      }
      className={cn(
        "inline-flex items-center gap-1 text-[9px] font-mono-hud uppercase px-2 py-0.5 rounded-full border",
        high
          ? "text-success border-success/40 bg-success/10"
          : mid
          ? "text-warning border-warning/40 bg-warning/10"
          : "text-destructive border-destructive/40 bg-destructive/10",
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {v}%{verified ? " ✓src" : ""}
    </span>
  );
};

export default ConfidenceBadge;
