import { useMemo, useState } from "react";
import { Loader2, Sparkles, Award, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePYQ, PYQQuestion, TranscriptSegment } from "@/lib/mockData";
import { PanelHeader, ExportButton } from "@/components/panel/PanelFrame";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EXAMS = [
  "CBSE Board",
  "ICSE Board",
  "State Board",
  "JEE Main",
  "JEE Advanced",
  "NEET",
  "UPSC",
];

interface Props {
  chapterTitle: string;
  transcript: TranscriptSegment[];
}

const PYQPanel = ({ chapterTitle, transcript }: Props) => {
  const [exam, setExam] = useState("CBSE Board");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [filter, setFilter] = useState<number | "all">("all");
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  // Warm the next page in the background so "More PYQs" feels instant.
  const prefetch = (nextPage: number, seen: string[]) => {
    generatePYQ(chapterTitle, transcript, exam, nextPage, seen).catch(() => {});
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generatePYQ(chapterTitle, transcript, exam, 1);
      setQuestions(data.questions || []);
      setPage(1);
      setRevealed({});
      setFilter("all");
      prefetch(2, (data.questions || []).map((q) => q.question));
    } catch (e: any) {
      toast.error(e.message || "Failed to generate PYQs");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await generatePYQ(
        chapterTitle,
        transcript,
        exam,
        next,
        questions.map((q) => q.question),
      );
      const fresh = (data.questions || []).filter(
        (q) => !questions.some((old) => old.question === q.question),
      );
      if (!fresh.length) {
        toast.info("No further unseen questions in the archive for this chapter.");
      } else {
        setQuestions((prev) => [...prev, ...fresh]);
        toast.success(`+${fresh.length} more PYQs added`);
      }
      setPage(next);
      prefetch(next + 1, [...questions, ...fresh].map((q) => q.question));
    } catch (e: any) {
      toast.error(e.message || "Failed to load more PYQs");
    } finally {
      setLoadingMore(false);
    }
  };

  const markGroups = useMemo(
    () => Array.from(new Set(questions.map((q) => q.marks))).sort((a, b) => a - b),
    [questions],
  );
  const visible = filter === "all" ? questions : questions.filter((q) => q.marks === filter);
  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);
  const yearsCovered = useMemo(
    () => Array.from(new Set(questions.map((q) => q.year).filter(Boolean))).sort(),
    [questions],
  );


  return (
    <div className="space-y-3">
      <PanelHeader
        label={`PYQ · ${exam}`}
        icon={<Award className="h-3.5 w-3.5" />}
        meta={questions.length ? `${questions.length}Q · ${totalMarks}M` : undefined}
        actions={
          questions.length > 0 && (
            <ExportButton
              title={`${chapterTitle} — ${exam} PYQ Paper`}
              subtitle={`${questions.length} questions · ${totalMarks} marks`}
              sections={[
                {
                  heading: `${exam} Previous Year Questions`,
                  type: "qa",
                  items: questions.map((q) => ({
                    question: q.question,
                    answer: q.answer,
                    meta: [q.year, `${q.marks} marks`, q.type, q.topic].filter(Boolean).join(" · "),
                  })),
                },
              ]}
            />
          )
        }
      />

      <div className="flex flex-wrap gap-1">
        {EXAMS.map((e) => (
          <button
            key={e}
            onClick={() => { setExam(e); setQuestions([]); setPage(0); }}
            className={cn(
              "text-[9px] font-mono-hud uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors",
              exam === e
                ? "bg-accent/15 text-accent border-accent/50"
                : "border-foreground/10 text-muted-foreground hover:border-accent/40",
            )}
          >
            {e}
          </button>
        ))}
      </div>

      <p className="text-[9px] font-mono-hud uppercase tracking-wider text-muted-foreground">
        39-year archive{yearsCovered.length ? ` · ${yearsCovered[0]}–${yearsCovered[yearsCovered.length - 1]} loaded` : ""}
      </p>


      {questions.length === 0 && !loading && (
        <div className="text-center py-6 space-y-3">
          <p className="text-xs text-muted-foreground">
            Marking-scheme accurate past-paper questions for this chapter.
          </p>
          <Button size="sm" onClick={handleGenerate} className="gap-2 gradient-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Generate {exam} PYQs
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-10 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-xs text-muted-foreground">Curating past-paper questions…</p>
        </div>
      )}

      {questions.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1">
            {(["all", ...markGroups] as (number | "all")[]).map((m) => (
              <button
                key={String(m)}
                onClick={() => setFilter(m)}
                className={cn(
                  "text-[9px] font-mono-hud uppercase px-2 py-0.5 rounded-full border transition-colors",
                  filter === m ? "bg-primary/15 text-primary border-primary/50" : "border-foreground/10 text-muted-foreground",
                )}
              >
                {m === "all" ? "All" : `${m} mark`}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {visible.map((q, i) => (
              <div
                key={i}
                className="rounded-xl border border-foreground/[0.07] bg-secondary/25 p-3 space-y-2 transition-colors hover:border-accent/35"
              >
                <div className="flex items-center justify-between gap-2 text-[9px] font-mono-hud uppercase">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent">{q.year}</span>
                    {q.type && <span className="text-muted-foreground truncate">{q.type}</span>}
                  </div>
                  <span className="px-2 py-0.5 rounded-full border border-foreground/10 text-muted-foreground shrink-0">
                    {q.marks} M
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{q.question}</p>
                <button
                  onClick={() => setRevealed((r) => ({ ...r, [i]: !r[i] }))}
                  className="text-[10px] font-mono-hud uppercase tracking-wider text-accent flex items-center gap-1"
                >
                  {revealed[i] ? "Hide" : "Model answer"}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", revealed[i] && "rotate-180")} />
                </button>
                {revealed[i] && (
                  <p className="text-xs text-foreground/80 bg-background/60 p-2.5 rounded-lg border border-foreground/[0.07] whitespace-pre-wrap animate-fade-in">
                    {q.answer}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="gap-2 gradient-primary text-primary-foreground"
            >
              {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              More PYQs
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading || loadingMore}>
              Regenerate paper
            </Button>
          </div>

        </>
      )}
    </div>
  );
};

export default PYQPanel;
