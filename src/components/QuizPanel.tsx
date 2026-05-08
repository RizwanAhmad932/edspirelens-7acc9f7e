import { useState } from "react";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizQuestion } from "@/lib/mockData";
import { recordQuizAttempt } from "@/lib/mockData";

interface QuizPanelProps {
  questions: QuizQuestion[];
  onComplete?: (score: number, total: number) => void;
  videoTitle?: string;
  analysisId?: string;
}

const QuizPanel = ({ questions, onComplete, videoTitle, analysisId }: QuizPanelProps) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[currentQ];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === question.correctIndex;
    if (isCorrect) setScore((s) => s + 1);
    // Record attempt for analytics (fire-and-forget)
    if (videoTitle) {
      recordQuizAttempt({
        analysisId,
        videoTitle,
        topic: videoTitle,
        question: question.question,
        selectedAnswer: question.options[idx] ?? "",
        correctAnswer: question.options[question.correctIndex] ?? "",
        isCorrect,
      }).catch(() => {});
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
      onComplete?.(score + (selected === question.correctIndex ? 0 : 0), questions.length);
    }
  };

  const handleReset = () => {
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const finalScore = score;
    return (
      <div className="text-center space-y-4 py-4">
        <div className="text-4xl font-display font-bold text-gradient">
          {finalScore}/{questions.length}
        </div>
        <p className="text-sm text-muted-foreground">
          {finalScore === questions.length
            ? "Perfect score! 🎉"
            : finalScore >= questions.length * 0.6
            ? "Great job! 👏"
            : "Keep learning! 📚"}
        </p>
        <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
          Quiz
        </h3>
        <span className="text-xs text-muted-foreground">
          {currentQ + 1} / {questions.length}
        </span>
      </div>

      <p className="text-sm font-medium text-foreground">{question.question}</p>

      <div className="space-y-2">
        {question.options.map((opt, idx) => {
          let cls = "w-full text-left p-3 rounded-lg text-sm border transition-all ";
          if (!answered) {
            cls += selected === idx
              ? "border-accent bg-accent/10"
              : "border-border bg-secondary/30 hover:bg-secondary/60 cursor-pointer";
          } else if (idx === question.correctIndex) {
            cls += "border-success bg-success/10 text-foreground";
          } else if (idx === selected) {
            cls += "border-destructive bg-destructive/10 text-foreground";
          } else {
            cls += "border-border bg-secondary/20 opacity-50";
          }

          return (
            <button key={idx} className={cls} onClick={() => handleSelect(idx)}>
              <span className="flex items-center gap-2">
                {answered && idx === question.correctIndex && (
                  <CheckCircle className="h-4 w-4 text-success shrink-0" />
                )}
                {answered && idx === selected && idx !== question.correctIndex && (
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                )}
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {answered && (
        <Button onClick={handleNext} size="sm" className="w-full gradient-primary text-primary-foreground">
          {currentQ < questions.length - 1 ? "Next Question" : "See Results"}
        </Button>
      )}
    </div>
  );
};

export default QuizPanel;
