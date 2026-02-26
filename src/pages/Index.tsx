import { useState, useEffect } from "react";
import { Sparkles, Loader2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import edspireLogo from "@/assets/edspire-logo.png";
import VideoInput from "@/components/VideoInput";
import FloatingLens from "@/components/FloatingLens";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import HistorySection from "@/components/HistorySection";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  analyzeVideo,
  generateQuiz,
  generateFlashcards,
  fetchHistory,
  updateQuizScore,
  VideoAnalysis,
  QuizQuestion,
  Flashcard,
} from "@/lib/mockData";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lensOpen, setLensOpen] = useState(false);
  const [overlayMode, setOverlayMode] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<VideoAnalysis | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [history, setHistory] = useState<VideoAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
        return;
      }
      setUser(session?.user || null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    try {
      const analysis = await analyzeVideo(url);
      setCurrentAnalysis(analysis);
      setLensOpen(true);
      setOverlayMode(true);
      setQuiz([]);
      setFlashcards([]);
      toast.success("Video analyzed successfully!");
      loadHistory();

      // Generate quiz + flashcards in background
      if (analysis.transcript.length > 0) {
        setQuizLoading(true);
        setFlashcardsLoading(true);
        generateQuiz(analysis.transcript).then(q => setQuiz(q)).catch(e => { console.error(e); toast.error("Quiz generation failed"); }).finally(() => setQuizLoading(false));
        generateFlashcards(analysis.transcript).then(f => setFlashcards(f)).catch(e => console.error(e)).finally(() => setFlashcardsLoading(false));
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to analyze video.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = async (analysis: VideoAnalysis) => {
    setCurrentAnalysis(analysis);
    setLensOpen(true);
    setOverlayMode(true);
    setQuiz([]);
    setFlashcards([]);

    if (analysis.transcript.length > 0) {
      setQuizLoading(true);
      setFlashcardsLoading(true);
      generateQuiz(analysis.transcript).then(q => setQuiz(q)).catch(e => console.error(e)).finally(() => setQuizLoading(false));
      generateFlashcards(analysis.transcript).then(f => setFlashcards(f)).catch(e => console.error(e)).finally(() => setFlashcardsLoading(false));
    }
  };

  const handleQuizComplete = async (score: number, total: number) => {
    if (currentAnalysis?.id) {
      try {
        await updateQuizScore(currentAnalysis.id, score, total);
        loadHistory();
      } catch (e) { console.error(e); }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-surface">
      {/* Header */}
      <header className="border-b border-border bg-card/80 glass sticky top-0 z-40 animate-fade-in">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={edspireLogo} alt="EdSpire.AI logo" className="h-10 w-10 object-contain" />
            <h1 className="font-display text-xl font-bold text-foreground">
              EdSpire<span className="text-gradient">.AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {currentAnalysis && !lensOpen && (
              <button
                onClick={() => setLensOpen(true)}
                className="text-xs px-3 py-1.5 rounded-full gradient-accent text-accent-foreground font-medium shadow-sm hover:opacity-90 transition-opacity animate-scale-in"
              >
                Open Lens
              </button>
            )}
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 space-y-12">
        {/* Hero */}
        {!overlayMode && (
          <div className="text-center space-y-6 max-w-2xl mx-auto pt-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium animate-scale-in">
              <Sparkles className="h-4 w-4" />
              AI-Powered Video Analysis
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              Understand any video
              <br />
              <span className="text-gradient">in seconds</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
              Paste a video link and let EdSpire.AI extract detailed notes, generate quizzes, flashcards, and help you learn faster.
            </p>
          </div>
        )}

        {/* Video Input */}
        <VideoInput onSubmit={handleAnalyze} isLoading={isLoading} />

        {/* YouTube Embed */}
        {overlayMode && currentAnalysis && (
          <YouTubeEmbed videoUrl={currentAnalysis.video_url} videoTitle={currentAnalysis.video_title} />
        )}

        {/* History */}
        {historyLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <HistorySection history={history} onSelect={handleSelectHistory} />
        )}
      </main>

      {/* Floating Lens */}
      {currentAnalysis && (
        <FloatingLens
          isOpen={lensOpen}
          onClose={() => setLensOpen(false)}
          summary={currentAnalysis.summary}
          notes={currentAnalysis.notes}
          transcript={currentAnalysis.transcript}
          quiz={quiz}
          quizLoading={quizLoading}
          flashcards={flashcards}
          flashcardsLoading={flashcardsLoading}
          videoTitle={currentAnalysis.video_title}
          onQuizComplete={handleQuizComplete}
        />
      )}
    </div>
  );
};

export default Index;
