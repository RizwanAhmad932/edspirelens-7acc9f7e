import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generatePYQ, PYQQuestion, TranscriptSegment } from "@/lib/mockData";
import { toast } from "sonner";

const EXAMS = ["CBSE Board", "ICSE Board", "State Board", "JEE", "NEET", "UPSC"];

interface Props {
  chapterTitle: string;
  transcript: TranscriptSegment[];
}

const PYQPanel = ({ chapterTitle, transcript }: Props) => {
  const [exam, setExam] = useState("CBSE Board");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generatePYQ(chapterTitle, transcript, exam);
      setQuestions(data.questions || []);
      setRevealed({});
    } catch (e: any) {
      toast.error(e.message || "Failed to generate PYQs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider">PYQs</h3>
        <Select value={exam} onValueChange={setExam}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EXAMS.map((e) => <SelectItem key={e} value={e} className="text-xs">{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {questions.length === 0 && !loading && (
        <div className="text-center py-6">
          <Button size="sm" onClick={handleGenerate} className="gap-2 gradient-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Generate {exam} PYQs
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-10 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-xs text-muted-foreground">Curating exam questions…</p>
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">{q.year}</span>
                <span>{q.marks} marks</span>
              </div>
              <p className="text-sm text-foreground">{q.question}</p>
              <button
                onClick={() => setRevealed(r => ({ ...r, [i]: !r[i] }))}
                className="text-xs text-accent hover:underline"
              >
                {revealed[i] ? "Hide answer" : "Show answer"}
              </button>
              {revealed[i] && (
                <p className="text-xs text-muted-foreground bg-card p-2 rounded border border-border">{q.answer}</p>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={handleGenerate} className="w-full">Regenerate</Button>
        </div>
      )}
    </div>
  );
};

export default PYQPanel;