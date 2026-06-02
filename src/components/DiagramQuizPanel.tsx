import { useState } from "react";
import { Loader2, Sparkles, CheckCircle, XCircle, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateDiagramQuiz, DiagramQuiz, TranscriptSegment, recordQuizAttempt } from "@/lib/mockData";

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
      const result = await generateDiagramQuiz(chapterTitle, transcript, exam);
      setData(result);
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider">Diagram MCQs</h3>
        {data && <span className="text-[10px] text-muted-foreground">Score: {score}/{data.questions.length}</span>}
      </div>

      {!data && !loading && (
        <div className="text-center py-6 space-y-3">
          <p className="text-xs text-muted-foreground">AI generates a labeled diagram + 5 MCQs in {exam} exam style.</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {EXAMS.map((e) => (
              <button key={e} onClick={() => setExam(e)} className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${exam === e ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground hover:border-accent"}`}>{e}</button>
            ))}
          </div>
          <Button size="sm" onClick={handleGenerate} className="gap-2 gradient-primary text-primary-foreground">
            <ImagePlus className="h-3.5 w-3.5" /> Generate Diagram Quiz
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-10 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-xs text-muted-foreground">Drawing diagram & writing questions…</p>
        </div>
      )}

      {data && data.questions.length > 0 && (
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden border border-border bg-white">
            <img src={data.imageUrl} alt={`${chapterTitle} diagram`} className="w-full h-auto" />
          </div>

          <div className="rounded-xl border border-border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Q{currentQ + 1} / {data.questions.length}</span>
              <span className="font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent">Label {data.questions[currentQ].label}</span>
            </div>
            <p className="text-sm font-medium text-foreground">{data.questions[currentQ].question}</p>
            <div className="space-y-1.5">
              {data.questions[currentQ].options.map((opt, idx) => {
                const q = data.questions[currentQ];
                let cls = "w-full text-left p-2.5 rounded-lg text-xs border transition-all ";
                if (!answered) cls += selected === idx ? "border-accent bg-accent/10" : "border-border bg-secondary/30 hover:bg-secondary/60";
                else if (idx === q.correctIndex) cls += "border-success bg-success/10";
                else if (idx === selected) cls += "border-destructive bg-destructive/10";
                else cls += "border-border opacity-50";
                return (
                  <button key={idx} className={cls} onClick={() => handleSelect(idx)}>
                    <span className="flex items-center gap-2">
                      {answered && idx === q.correctIndex && <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />}
                      {answered && idx === selected && idx !== q.correctIndex && <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
            {answered && (
              <Button size="sm" onClick={handleNext} className="w-full gradient-primary text-primary-foreground">
                {currentQ < data.questions.length - 1 ? "Next" : "Finish"}
              </Button>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={handleGenerate} className="w-full gap-1">
            <Sparkles className="h-3 w-3" /> New Diagram
          </Button>
        </div>
      )}
    </div>
  );
};

export default DiagramQuizPanel;