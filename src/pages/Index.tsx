import { useState, useEffect } from "react";
import { Sparkles, Loader2, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import edspireLogo from "@/assets/edspire-logo.png";
import VideoInput from "@/components/VideoInput";
import FloatingLens from "@/components/FloatingLens";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import AudioPlayer from "@/components/AudioPlayer";
import HistorySection from "@/components/HistorySection";
import ThemeToggle from "@/components/ThemeToggle";
import AdBanner, { AdPopup } from "@/components/AdBanner";
import { MiniAvatar3D } from "@/components/Avatar3D";
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [userOutfit, setUserOutfit] = useState({ top: "tshirt_white", hat: "none_hat", accessory: "none_acc" });
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
        return;
      }
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        try {
          await supabase.from("login_logs").insert({
            user_id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name || "",
            user_agent: navigator.userAgent,
          });
        } catch (e) { console.error("Login log error:", e); }
        try {
          await supabase.rpc("add_xp" as any, { _user_id: session.user.id, _amount: 5 });
        } catch (e) { /* ignore */ }
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
    if (user) {
      loadHistory();
      checkAdmin();
      loadOutfit();
    }
  }, [user]);

  const loadOutfit = async () => {
    const { data } = await supabase.from("profiles").select("selected_avatar").eq("id", user.id).single();
    if (data?.selected_avatar) {
      try {
        const parsed = JSON.parse(data.selected_avatar);
        if (parsed?.top) setUserOutfit(parsed);
      } catch {}
    }
  };

  const checkAdmin = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");
    setIsAdmin((data?.length || 0) > 0);
  };

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

      try {
        await supabase.rpc("add_xp" as any, { _user_id: user.id, _amount: 25 });
      } catch (e) { /* ignore */ }

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
        const xpEarned = Math.round((score / total) * 50);
        await supabase.rpc("add_xp" as any, { _user_id: user.id, _amount: xpEarned });
        toast.success(`+${xpEarned} XP earned!`);
      } catch (e) { console.error(e); }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen min-h-[100dvh] gradient-surface overflow-x-hidden">
      <AdPopup />

      {/* Header */}
      <header className="border-b border-border bg-card/80 glass sticky top-0 z-40 safe-top animate-fade-in">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <img src={edspireLogo} alt="Edspire Lens" className="h-7 w-7 sm:h-10 sm:w-10 object-contain shrink-0" />
            <h1 className="font-display text-base sm:text-xl font-bold text-foreground truncate">
              Edspire <span className="text-gradient">Lens</span>
            </h1>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            {currentAnalysis && !lensOpen && (
              <button
                onClick={() => setLensOpen(true)}
                className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full gradient-accent text-accent-foreground font-medium shadow-sm hover:opacity-90 transition-opacity animate-scale-in"
              >
                Open Lens
              </button>
            )}
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-accent" title="Admin Panel">
                <Shield className="h-4 w-4" />
              </Button>
            )}
            <button onClick={() => navigate("/profile")} className="hover:opacity-80 transition-opacity" title="Profile">
              <MiniAvatar3D outfit={userOutfit} />
            </button>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1 sm:gap-1.5 text-muted-foreground hover:text-foreground h-8 sm:h-9 px-2 sm:px-3">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-12">
        {/* Hero */}
        {!overlayMode && (
          <div className="text-center space-y-3 sm:space-y-6 max-w-2xl mx-auto pt-2 sm:pt-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent/10 text-accent text-xs sm:text-sm font-medium animate-scale-in">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              AI-Powered Video Analysis
            </div>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Understand any video
              <br />
              <span className="text-gradient">in seconds</span>
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto px-4 sm:px-0">
              Paste a video link and let Edspire Lens extract detailed notes, quizzes, flashcards aligned to your board's syllabus.
            </p>
          </div>
        )}

        <AdBanner placement="home" />

        <VideoInput onSubmit={handleAnalyze} isLoading={isLoading} />

        {overlayMode && currentAnalysis && (
          <div className="space-y-4">
            <YouTubeEmbed videoUrl={currentAnalysis.video_url} videoTitle={currentAnalysis.video_title} />
            <AudioPlayer videoUrl={currentAnalysis.video_url} />
          </div>
        )}

        <AdBanner placement="between_content" />

        {historyLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <HistorySection history={history} onSelect={handleSelectHistory} />
        )}
      </main>

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
