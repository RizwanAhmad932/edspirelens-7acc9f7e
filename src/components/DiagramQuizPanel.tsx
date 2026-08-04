import { useState } from "react";
import { Loader2, Sparkles, CheckCircle, XCircle, ImagePlus, Lightbulb, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateDiagramQuiz, DiagramQuiz, TranscriptSegment, recordQuizAttempt } from "@/lib/mockData";
import { PanelHeader, ExportButton, HudProgress } from "@/components/panel/PanelFrame";
import { cn } from "@/lib/utils";

interface Props {
  chapterTitle: string;
  transcript: TranscriptSegment[];
  analysisId?: string;
}

const EXAMS = ["NEET", "CBSE Board", "JEE", "ICSE Board"];

const DiagramQuizPanel = ({ chapterTitle, transcript, analysisId }: Props) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DiagramQuiz | null>(null);
  const [exam, setExam] = useState("NEET");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const handleGenerate = async () => {
    setLoading(true);
    setCurrentQ(0); setSelected(null); setAnswered(false); setScore(0);
    try {
      setData(await generateDiagramQuiz(chapterTitle, transcript, exam));
    } catch (e: any) {
      toast.error(e.message || "Failed to generate diagram quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (idx: number) => {
    if (answered || !data) return;
    const q = data.questions[currentQ];
    const isCorrect = idx === q.correctIndex;
    setSelected(idx);
    setAnswered(true);
    if (isCorrect) setScore((s) => s + 1);
    recordQuizAttempt({
      analysisId,
      videoTitle: chapterTitle,
      topic: `${chapterTitle} — Diagram (${exam})`,
      question: q.question,
      selectedAnswer: q.options[idx] ?? "",
      correctAnswer: q.options[q.correctIndex] ?? "",
      isCorrect,
    }).catch(() => {});
  };

  const handleNext = () => {
    if (!data) return;
    if (currentQ < data.questions.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      toast.success(`Diagram quiz complete: ${score}/${data.questions.length}`);
    }
  };

  const q = data?.questions[currentQ];

  return (
    <div className="space-y-3">
      <PanelHeader
        label="Diagram MCQ"
        icon={<ImagePlus className="h-3.5 w-3.5" />}
        meta={data ? `${score}/${data.questions.length}` : undefined}
        actions={
          data && (
            <ExportButton
              title={`${chapterTitle} — Diagram MCQs (${exam})`}
              subtitle="Labelling questions with answer key"
              sections={[
                {
                  heading: "Diagram Labelling MCQs",
                  type: "qa",
                  items: data.questions.map((dq) => ({
                    question: `${dq.question}\n   ${dq.options
                      .map((o, i) => `(${String.fromCharCode(65 + i)}) ${o}`)
                      .join("   ")}`,
                    answer: `${dq.options[dq.correctIndex] ?? ""}${dq.explanation ? ` — ${dq.explanation}` : ""}`,
                    meta: `Label ${dq.label}`,
                  })),
                },
              ]}
            />
          )
        }
      />

      {!data && !loading && (
        <div className="text-center py-6 space-y-3">
          <p className="text-xs text-muted-foreground">
            AI draws a labelled diagram and sets 5 MCQs in {exam} style.
          </p>
          <div className="flex flex-wrap gap-1 justify-center">
            {EXAMS.map((e) => (
              <button
                key={e}
                onClick={() => setExam(e)}
                className={cn(
                  "text-[9px] font-mono-hud uppercase px-2.5 py-1 rounded-full border transition-colors",
                  exam === e ? "bg-accent/15 text-accent border-accent/50" : "border-foreground/10 text-muted-foreground hover:border-accent/40",
                )}
              >
                {e}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={handleGenerate} className="gap-2 gradient-primary text-primary-foreground">
            <ImagePlus className="h-3.5 w-3.5" /> Generate diagram quiz
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-10 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-xs text-muted-foreground">Drawing diagram & writing questions…</p>
        </div>
      )}

      {data && q && (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-accent/25 bg-white scanline">
            <img src={data.imageUrl} alt={`${chapterTitle} diagram`} className="w-full h-auto" />
            <a
              href={data.imageUrl}
              download={`${chapterTitle}-diagram.png`}
              className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur px-2.5 py-1 text-[9px] font-mono-hud uppercase text-accent border border-accent/30"
            >
              <Download className="h-3 w-3" /> Save
            </a>
          </div>

          <HudProgress value={((currentQ + (answered ? 1 : 0)) / data.questions.length) * 100} />

          <div className="rounded-2xl border border-foreground/[0.07] bg-card/60 p-3 space-y-2">
            <div className="flex items-center justify-between text-[9px] font-mono-hud uppercase text-muted-foreground">
              <span>Q{currentQ + 1} / {data.questions.length}</span>
              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent">Label {q.label}</span>
            </div>
            <p className="text-sm font-medium text-foreground">{q.question}</p>
            <div className="space-y-1.5">
              {q.options.map((opt, idx) => {
                const isCorrect = idx === q.correctIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl text-xs border transition-all flex items-center gap-2",
                      !answered && selected === idx && "border-accent bg-accent/10",
                      !answered && selected !== idx && "border-foreground/[0.08] bg-secondary/25 hover:border-accent/40",
                      answered && isCorrect && "border-success/50 bg-success/10",
                      answered && !isCorrect && idx === selected && "border-destructive/50 bg-destructive/10",
                      answered && !isCorrect && idx !== selected && "border-foreground/[0.06] opacity-45",
                    )}
                  >
                    <span className="font-mono-hud text-[10px] text-accent">{String.fromCharCode(65 + idx)}</span>
                    <span className="flex-1">{opt}</span>
                    {answered && isCorrect && <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />}
                    {answered && !isCorrect && idx === selected && <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                  </button>
                );
              })}
            </div>
            {answered && q.explanation && (
              <div className="rounded-xl border border-accent/25 bg-accent/[0.06] p-2.5 flex gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                <p className="text-[11px] text-foreground/85">{q.explanation}</p>
              </div>
            )}
            {answered && (
              <Button size="sm" onClick={handleNext} className="w-full gradient-primary text-primary-foreground">
                {currentQ < data.questions.length - 1 ? "Next" : "Finish"}
              </Button>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={handleGenerate} className="w-full gap-1">
            <Sparkles className="h-3 w-3" /> New diagram
          </Button>
        </div>
      )}
    </div>
  );
};

export default DiagramQuizPanel;
