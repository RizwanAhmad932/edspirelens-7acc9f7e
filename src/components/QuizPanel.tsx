import { useMemo, useState } from "react";
import { CheckCircle, XCircle, RotateCcw, BrainCircuit, Lightbulb, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizQuestion, recordQuizAttempt } from "@/lib/mockData";
import { PanelHeader, ExportButton, HudProgress } from "@/components/panel/PanelFrame";
import { cn } from "@/lib/utils";

interface QuizPanelProps {
  questions: QuizQuestion[];
  onComplete?: (score: number, total: number) => void;
  videoTitle?: string;
  analysisId?: string;
}

const diffColor = (d?: string) =>
  d === "hard"
    ? "text-destructive border-destructive/40 bg-destructive/10"
    : d === "medium"
    ? "text-warning border-warning/40 bg-warning/10"
    : "text-success border-success/40 bg-success/10";

const QuizPanel = ({ questions, onComplete, videoTitle, analysisId }: QuizPanelProps) => {
  const [pool, setPool] = useState<QuizQuestion[]>(questions);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<QuizQuestion[]>([]);
  const [finished, setFinished] = useState(false);

  const question = pool[currentQ];

  const exportSections = useMemo(
    () => [
      {
        heading: "Question Paper",
        type: "qa" as const,
        items: questions.map((q) => ({
          question: `${q.question}\n   ${q.options
            .map((o, i) => `(${String.fromCharCode(65 + i)}) ${o}`)
            .join("   ")}`,
          answer: `${String.fromCharCode(65 + q.correctIndex)}. ${q.options[q.correctIndex] ?? ""}${
            q.explanation ? ` — ${q.explanation}` : ""
          }`,
          meta: [q.topic, q.difficulty, q.timestamp].filter(Boolean).join(" · "),
        })),
      },
    ],
    [questions],
  );

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === question.correctIndex;
    if (isCorrect) setScore((s) => s + 1);
    else setWrong((w) => [...w, question]);
    if (videoTitle) {
      recordQuizAttempt({
        analysisId,
        videoTitle,
        topic: question.topic || videoTitle,
        question: question.question,
        selectedAnswer: question.options[idx] ?? "",
        correctAnswer: question.options[question.correctIndex] ?? "",
        isCorrect,
      }).catch(() => {});
    }
  };

  const handleNext = () => {
    if (currentQ < pool.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
      onComplete?.(score, pool.length);
    }
  };

  const restart = (deck: QuizQuestion[]) => {
    setPool(deck);
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setWrong([]);
    setFinished(false);
  };

  if (!question) {
    return <p className="text-xs text-muted-foreground text-center py-8">No questions available.</p>;
  }

  if (finished) {
    const pct = Math.round((score / pool.length) * 100);
    return (
      <div className="space-y-4">
        <PanelHeader
          label="Result"
          icon={<Target className="h-3.5 w-3.5" />}
          actions={
            <ExportButton
              title={`${videoTitle || "Chapter"} — Question Paper`}
              subtitle="AI-generated MCQs with answer key"
              sections={exportSections}
            />
          }
        />
        <div className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-5 text-center space-y-3 scan-lines">
          <div className="text-4xl font-display font-bold text-gradient">
            {score}/{pool.length}
          </div>
          <HudProgress value={pct} />
          <p className="text-xs text-muted-foreground">
            {pct === 100 ? "Perfect score 🎉" : pct >= 60 ? "Strong performance 👏" : "Revise and retry 📚"}
          </p>
        </div>

        {wrong.length > 0 && (
          <div className="space-y-2">
            <p className="hud-label">Mistakes to review</p>
            {wrong.map((q, i) => (
              <div key={i} className="rounded-xl border border-destructive/25 bg-destructive/[0.05] p-3 space-y-1">
                <p className="text-xs font-medium text-foreground">{q.question}</p>
                <p className="text-[11px] text-success">✓ {q.options[q.correctIndex]}</p>
                {q.explanation && <p className="text-[11px] text-muted-foreground">{q.explanation}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => restart(questions)} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" /> Retry all
          </Button>
          <Button
            onClick={() => restart(wrong)}
            size="sm"
            disabled={wrong.length === 0}
            className="gap-2 gradient-primary text-primary-foreground"
          >
            <Target className="h-3.5 w-3.5" /> Retry mistakes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PanelHeader
        label="Quiz"
        icon={<BrainCircuit className="h-3.5 w-3.5" />}
        meta={`${currentQ + 1}/${pool.length} · ${score} correct`}
        actions={
          <ExportButton
            title={`${videoTitle || "Chapter"} — Question Paper`}
            subtitle="AI-generated MCQs with answer key"
            sections={exportSections}
          />
        }
      />

      <HudProgress value={((currentQ + (answered ? 1 : 0)) / pool.length) * 100} />

      <div className="flex flex-wrap items-center gap-1.5">
        {question.difficulty && (
          <span className={cn("text-[9px] font-mono-hud uppercase px-2 py-0.5 rounded-full border", diffColor(question.difficulty))}>
            {question.difficulty}
          </span>
        )}
        {question.topic && (
          <span className="text-[9px] font-mono-hud uppercase px-2 py-0.5 rounded-full border border-foreground/10 text-muted-foreground">
            {question.topic}
          </span>
        )}
        {question.timestamp && (
          <span className="text-[9px] font-mono-hud px-2 py-0.5 rounded-full bg-accent/10 text-accent">
            {question.timestamp}
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-foreground leading-relaxed">{question.question}</p>

      <div className="space-y-2">
        {question.options.map((opt, idx) => {
          const isCorrect = idx === question.correctIndex;
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={cn(
                "w-full text-left p-3 rounded-xl text-sm border transition-all flex items-start gap-2.5",
                !answered && selected === idx && "border-accent bg-accent/10",
                !answered && selected !== idx && "border-foreground/[0.08] bg-secondary/25 hover:border-accent/40 hover:bg-accent/[0.06]",
                answered && isCorrect && "border-success/50 bg-success/10",
                answered && !isCorrect && idx === selected && "border-destructive/50 bg-destructive/10",
                answered && !isCorrect && idx !== selected && "border-foreground/[0.06] opacity-45",
              )}
            >
              <span className="font-mono-hud text-[10px] text-accent mt-0.5">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{opt}</span>
              {answered && isCorrect && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
              {answered && !isCorrect && idx === selected && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
            </button>
          );
        })}
      </div>

      {answered && question.explanation && (
        <div className="rounded-xl border border-accent/25 bg-accent/[0.06] p-3 flex gap-2 animate-fade-in">
          <Lightbulb className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
          <p className="text-[11px] text-foreground/85 leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {answered && (
        <Button onClick={handleNext} size="sm" className="w-full gradient-primary text-primary-foreground">
          {currentQ < pool.length - 1 ? "Next question" : "See results"}
        </Button>
      )}
    </div>
  );
};

export default QuizPanel;
