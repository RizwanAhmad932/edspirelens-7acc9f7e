import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, TrendingUp, AlertTriangle, Lightbulb, Target, Award } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAppLogo } from "@/hooks/use-app-logo";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import RevisionPlanPanel from "@/components/RevisionPlanPanel";

interface Attempt {
  id: string;
  topic: string | null;
  video_title: string | null;
  question: string;
  is_correct: boolean;
  selected_answer: string | null;
  correct_answer: string | null;
  created_at: string;
}

interface TopicStat {
  topic: string;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
  recentMistakes: Attempt[];
}

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const navigate = useNavigate();
  const logo = useAppLogo();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) toast.error(error.message);
      setAttempts(data || []);
      setLoading(false);
    })();
  }, [navigate]);

  const total = attempts.length;
  const correct = attempts.filter((a) => a.is_correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;

  const topicMap = new Map<string, TopicStat>();
  for (const a of attempts) {
    const key = a.topic || a.video_title || "General";
    const t = topicMap.get(key) || { topic: key, total: 0, correct: 0, wrong: 0, accuracy: 0, recentMistakes: [] };
    t.total++;
    if (a.is_correct) t.correct++;
    else { t.wrong++; if (t.recentMistakes.length < 3) t.recentMistakes.push(a); }
    t.accuracy = Math.round((t.correct / t.total) * 100);
    topicMap.set(key, t);
  }
  const topics = Array.from(topicMap.values()).sort((a, b) => a.accuracy - b.accuracy);
  const weakTopics = topics.filter((t) => t.accuracy < 70 && t.total >= 2).slice(0, 5);

  const requestAdvice = async () => {
    if (weakTopics.length === 0) { toast.info("No weak topics yet — keep practicing!"); return; }
    setAiLoading(true);
    try {
      const summary = weakTopics.map((t) =>
        `${t.topic}: ${t.correct}/${t.total} correct (${t.accuracy}%). Sample wrong: ${t.recentMistakes.map(m => m.question).slice(0, 2).join(" | ")}`
      ).join("\n");
      const { data, error } = await supabase.functions.invoke("analyze-video", {
        body: {
          videoUrl: "",
          action: "chat",
          videoTitle: "Performance Coach",
          transcript: summary,
          messages: [{ role: "user", content: `I am a student. Here are my weak topics with mistake samples:\n${summary}\n\nFor EACH weak topic, give a short diagnosis of likely root cause, then 3 concrete fixes (resources, practice routine, formulas to memorize). Use markdown headings per topic. Be specific and motivating.` }],
        },
      });
      if (error) throw error;
      setAiAdvice(data?.reply || "");
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch advice");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-surface flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] gradient-surface overflow-x-hidden">
      <header className="border-b border-border bg-card/80 glass sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img src={logo} alt="Logo" className="h-7 w-7 object-contain" />
            <h1 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" /> Performance
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-5">
        {/* Overall stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Target, label: "Questions", value: total, color: "text-accent" },
            { icon: Award, label: "Correct", value: correct, color: "text-success" },
            { icon: AlertTriangle, label: "Accuracy", value: `${accuracy}%`, color: "text-warning" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-card">
              <s.icon className={`h-5 w-5 ${s.color} mb-1`} />
              <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {total === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-card">
            <p className="text-sm text-muted-foreground">
              Take some quizzes from your analyzed videos to unlock topic-wise mistake analysis here.
            </p>
          </div>
        ) : (
          <>
            {/* Topic-wise breakdown */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-4">
              <h2 className="font-display text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" /> Topic-wise Accuracy
              </h2>
              <div className="space-y-3">
                {topics.map((t) => (
                  <div key={t.topic} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground truncate pr-2">{t.topic}</span>
                      <span className={t.accuracy >= 70 ? "text-success" : t.accuracy >= 40 ? "text-warning" : "text-destructive"}>
                        {t.correct}/{t.total} • {t.accuracy}%
                      </span>
                    </div>
                    <Progress value={t.accuracy} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Mistake analysis */}
            {weakTopics.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" /> Where you struggle
                  </h2>
                  <Button size="sm" onClick={requestAdvice} disabled={aiLoading} className="gap-1.5 gradient-primary text-primary-foreground h-8">
                    {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5" />}
                    Get AI fix
                  </Button>
                </div>
                <div className="space-y-3">
                  {weakTopics.map((t) => (
                    <div key={t.topic} className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-foreground">{t.topic}</p>
                        <span className="text-[11px] text-destructive">{t.wrong} mistakes</span>
                      </div>
                      {t.recentMistakes.map((m) => (
                        <div key={m.id} className="text-[11px] text-muted-foreground border-l-2 border-destructive/40 pl-2">
                          <p className="text-foreground/80">{m.question}</p>
                          <p className="line-through opacity-60">Your answer: {m.selected_answer || "—"}</p>
                          <p className="text-success">Correct: {m.correct_answer || "—"}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {aiAdvice && (
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    <p className="font-semibold text-accent mb-2 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5" /> AI Coach Recommendations
                    </p>
                    {aiAdvice}
                  </div>
                )}
              </div>
            )}

            <RevisionPlanPanel />
          </>
        )}
      </main>
    </div>
  );
};

export default Analytics;