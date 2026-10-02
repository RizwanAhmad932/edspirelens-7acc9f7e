import { useMemo, useState } from "react";
import { BookMarked, ChevronDown, Loader2, RefreshCw, Sparkles, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ExamSyllabus, PYQQuestion, generatePYQ } from "@/lib/mockData";
import ConfidenceBadge from "@/components/panel/ConfidenceBadge";

interface Props {
  exam: string;
  syllabus: ExamSyllabus | null;
  loading: boolean;
  onLoad: (refresh?: boolean) => void;
  plannedText: string; // all topics/focus text from the current plan, lowercased
}

const PRIORITY_TONE: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/40",
  medium: "bg-accent/10 text-accent border-accent/40",
  low: "bg-secondary text-muted-foreground border-border",
};

const SyllabusPanel = ({ exam, syllabus, loading, onLoad, plannedText }: Props) => {
  const [subject, setSubject] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [sort, setSort] = useState<"weight" | "pyq">("weight");
  const [pyqs, setPyqs] = useState<Record<string, { loading: boolean; list: PYQQuestion[] }>>({});

  const sub = syllabus?.subjects?.[subject];
  const chapters = useMemo(() => {
    const list = [...(sub?.chapters || [])];
    return list.sort((a, b) => (sort === "weight" ? b.weight - a.weight : b.pyqFrequency - a.pyqFrequency));
  }, [sub, sort]);

  const isCovered = (name: string) => !!plannedText && plannedText.includes(name.toLowerCase());
  const allChapters = syllabus?.subjects.flatMap((s) => s.chapters) || [];
  const coveredWeight = allChapters.filter((c) => isCovered(c.name)).reduce((t, c) => t + (c.weight || 0), 0);
  const totalWeight = allChapters.reduce((t, c) => t + (c.weight || 0), 0) || 1;
  const coverage = Math.round((coveredWeight / totalWeight) * 100);
  const missingHigh = allChapters.filter((c) => c.priority === "high" && !isCovered(c.name));

  const loadPyqs = async (name: string) => {
    if (pyqs[name]) return;
    setPyqs((p) => ({ ...p, [name]: { loading: true, list: [] } }));
    try {
      const r = await generatePYQ(name, [], exam, 1);
      setPyqs((p) => ({ ...p, [name]: { loading: false, list: (r.questions || []).slice(0, 5) } }));
    } catch (e: any) {
      toast.error(e.message || "Could not load PYQs");
      setPyqs((p) => ({ ...p, [name]: { loading: false, list: [] } }));
    }
  };

  if (!syllabus) {
    return (
      <section className="bg-card border border-border rounded-2xl p-6 text-center space-y-3 shadow-card">
        <BookMarked className="h-6 w-6 text-accent mx-auto" />
        <p className="text-xs text-muted-foreground">
          Load the official {exam} syllabus with each chapter's marks weight and how often it comes in past papers.
          Your plan will then give more days to the chapters that matter most.
        </p>
        <Button size="sm" onClick={() => onLoad()} disabled={loading} className="gap-2 gradient-primary text-primary-foreground">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Load {exam} syllabus
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-card">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-semibold">{syllabus.exam} syllabus</p>
            <p className="text-[11px] text-muted-foreground">
              {syllabus.session}{syllabus.totalMarks ? ` · ${syllabus.totalMarks} marks` : ""} · {allChapters.length} chapters
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceBadge value={syllabus.confidence} />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onLoad(true)} disabled={loading} title="Refresh from the web">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {plannedText && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Plan covers this much of the exam's marks</span>
              <span className="font-semibold text-foreground">{coverage}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full gradient-primary transition-all" style={{ width: `${coverage}%` }} />
            </div>
            {missingHigh.length > 0 && (
              <p className="text-[11px] text-destructive">
                High-priority chapters missing from your plan: {missingHigh.slice(0, 5).map((c) => c.name).join(", ")}
                {missingHigh.length > 5 ? ` +${missingHigh.length - 5} more` : ""}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {syllabus.subjects.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setSubject(i)}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                subject === i ? "bg-accent/15 text-accent border-accent/50" : "border-foreground/10 text-muted-foreground hover:border-accent/40",
              )}
            >
              {s.name}{s.weight ? ` · ${s.weight}%` : ""}
            </button>
          ))}
        </div>
        <div className="flex gap-1 text-[10px]">
          <span className="text-muted-foreground mr-1 self-center">Sort by</span>
          {(["weight", "pyq"] as const).map((k) => (
            <button key={k} onClick={() => setSort(k)}
              className={cn("px-2 py-0.5 rounded-full border", sort === k ? "border-primary/50 text-primary bg-primary/10" : "border-border text-muted-foreground")}>
              {k === "weight" ? "Marks weight" : "PYQ frequency"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {chapters.map((c) => {
          const covered = isCovered(c.name);
          const isOpen = open === c.name;
          const maxW = Math.max(...chapters.map((x) => x.weight || 0), 1);
          return (
            <div key={c.name} className="bg-card border border-border rounded-xl p-3 space-y-2">
              <button className="w-full text-left space-y-2" onClick={() => { setOpen(isOpen ? null : c.name); if (!isOpen) loadPyqs(c.name); }}>
                <div className="flex items-center gap-2">
                  {plannedText ? (covered
                    ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />) : null}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{c.unit}</p>
                  </div>
                  <span className={cn("text-[9px] uppercase px-2 py-0.5 rounded-full border", PRIORITY_TONE[c.priority] || PRIORITY_TONE.low)}>
                    {c.priority}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 items-center text-[10px]">
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${((c.weight || 0) / maxW) * 100}%` }} />
                  </div>
                  <span className="text-foreground font-semibold w-20 text-right">{c.weight}% marks</span>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${c.pyqFrequency}%` }} />
                  </div>
                  <span className="text-muted-foreground w-20 text-right">PYQ {c.pyqFrequency}/100</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  ~{c.avgQuestions} Q per paper{c.lastAsked ? ` · last asked ${c.lastAsked}` : ""} · {c.savedPyqs || 0} PYQs saved in app
                </p>
              </button>

              {isOpen && (
                <div className="space-y-2 pt-2 border-t border-border animate-fade-in">
                  {c.keyTopics?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.keyTopics.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground/80">{t}</span>
                      ))}
                    </div>
                  )}
                  {pyqs[c.name]?.loading ? (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Fetching past-paper questions…
                    </div>
                  ) : (
                    (pyqs[c.name]?.list || []).map((q, i) => (
                      <div key={i} className="rounded-lg bg-secondary/40 p-2 space-y-1">
                        <p className="text-[9px] font-mono-hud uppercase text-accent">{q.paper || q.year} · {q.marks}M</p>
                        <p className="text-xs">{q.question}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {syllabus.sources && syllabus.sources.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-1">
          <p className="text-[9px] font-mono-hud uppercase tracking-wider text-muted-foreground">Sources</p>
          {syllabus.sources.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer noopener" className="block text-[11px] text-accent truncate hover:underline">
              {s.title || s.url}
            </a>
          ))}
        </div>
      )}
    </section>
  );
};

export default SyllabusPanel;
