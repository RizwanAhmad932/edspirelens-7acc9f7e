import { ReactNode } from "react";
import { Download, FileText, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportDocMarkdown, exportDocPdf, DocSection } from "@/lib/exportDoc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** Futuristic HUD header used across every study-tool panel. */
export const PanelHeader = ({
  label,
  icon,
  meta,
  actions,
}: {
  label: string;
  icon?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) => (
  <div className="relative flex items-center justify-between gap-2 pb-2 mb-1 border-b border-foreground/10">
    <span className="pointer-events-none absolute -bottom-px left-0 h-px w-24 bg-gradient-to-r from-accent/80 to-transparent" />
    <div className="flex items-center gap-2 min-w-0">
      {icon && (
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
          {icon}
        </span>
      )}
      <h3 className="hud-label truncate">{label}</h3>
      {meta && (
        <span className="shrink-0 rounded-full border border-foreground/10 bg-secondary/50 px-1.5 py-0.5 text-[10px] font-mono-hud text-muted-foreground">
          {meta}
        </span>
      )}
    </div>
    <div className="flex items-center gap-1 shrink-0">{actions}</div>
  </div>
);

/** Download control: PDF (print dialog) or Markdown file. */
export const ExportButton = ({
  title,
  subtitle,
  sections,
  compact = true,
  disabled,
}: {
  title: string;
  subtitle?: string;
  sections: DocSection[];
  compact?: boolean;
  disabled?: boolean;
}) => {
  const hasContent = sections.some((s) => s.items?.length);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || !hasContent}>
        <button
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/12 text-accent",
            "font-mono-hud uppercase tracking-[0.14em] transition-all hover:bg-accent/25 hover:shadow-[0_0_14px_-2px_hsl(var(--accent)/0.6)] active:scale-95",
            "disabled:opacity-40 disabled:pointer-events-none",
            compact ? "text-[9px] px-2 py-1" : "text-[10px] px-3 py-1.5",
          )}
        >
          <Download className="h-3 w-3" /> Save
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[170px]">
        <DropdownMenuItem
          className="text-xs gap-2"
          onClick={async () => {
            try {
              await exportDocPdf({ title, subtitle, sections });
              toast.success("PDF downloaded");
            } catch (e) {
              toast.error("Could not create PDF");
            }
          }}
        >
          <FileText className="h-3.5 w-3.5" /> Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs gap-2"
          onClick={() => {
            exportDocMarkdown({ title, subtitle, sections });
            toast.success("Notes downloaded");
          }}
        >
          <FileDown className="h-3.5 w-3.5" /> Download as Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/** Neon progress rail used by quiz-style panels. */
export const HudProgress = ({ value }: { value: number }) => (
  <div className="h-1 w-full rounded-full bg-foreground/10 overflow-hidden">
    <div
      className="h-full rounded-full gradient-primary transition-all duration-500"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);
