import { useState, useEffect, useRef, lazy, Suspense, memo } from "react";
import { Sparkles, Loader2, LogOut, Shield, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAppLogo } from "@/hooks/use-app-logo";
import VideoInput from "@/components/VideoInput";
import YouTubeSearch from "@/components/YouTubeSearch";
import YouTubeEmbed, { YouTubeEmbedHandle } from "@/components/YouTubeEmbed";
import AudioPlayer from "@/components/AudioPlayer";
import HistorySection from "@/components/HistorySection";
import ThemeToggle from "@/components/ThemeToggle";
import AdBanner, { AdPopup } from "@/components/AdBanner";
import { MiniMascot } from "@/components/MascotAvatar";
import InstallButton from "@/components/InstallButton";
import SimulatedOverlay from "@/components/SimulatedOverlay";
import AIQuizCompanion from "@/components/AIQuizCompanion";
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

const FestivalOverlay = lazy(() => import("@/components/FestivalOverlay"));
const FloatingLens = lazy(() => import("@/components/FloatingLens"));
const AppDrawer = lazy(() => import("@/components/AppDrawer"));
const TutorialOverlay = lazy(() => import("@/components/TutorialOverlay"));
import { shouldShowTutorial } from "@/lib/tutorial";

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
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const navigate = useNavigate();
  const logo = useAppLogo();
  const videoRef = useRef<YouTubeEmbedHandle>(null);
  const [videoTime, setVideoTime] = useState(0);

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
        await supabase.rpc("add_xp", { _user_id: session.user.id, _amount: 5 });
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
      // Show tutorial for new users (once)
      if (shouldShowTutorial()) setTimeout(() => setTutorialOpen(true), 600);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadHistory();
      checkAdmin();
    }
  }, [user]);

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
        await supabase.rpc("add_xp", { _user_id: user.id, _amount: 25 });
      } catch (e) { /* ignore */ }

      if (analysis.transcript.length > 0) {
        setQuizLoading(true);
        setFlashcardsLoading(true);
        generateQuiz(analysis.transcript).then(q => setQuiz(q)).catch(e => { console.error(e); toast.error("Quiz generation failed"); }).finally(() => setQuizLoading(false));
        generateFlashcards(analysis.transcript)
          .then((f) => {
            setFlashcards(f);
            if (f.length === 0) toast.error("No flashcards could be generated for this video.");
          })
          .catch((e) => { console.error(e); toast.error(e?.message || "Flashcard generation failed"); })
          .finally(() => setFlashcardsLoading(false));
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to analyze video.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = useCallback(async (analysis: VideoAnalysis) => {
    setCurrentAnalysis(analysis);
    setLensOpen(true);
    setOverlayMode(true);
    setQuiz([]);
    setFlashcards([]);

    if (analysis.transcript.length > 0) {
      setQuizLoading(true);
      setFlashcardsLoading(true);
      generateQuiz(analysis.transcript).then(q => setQuiz(q)).catch(e => console.error(e)).finally(() => setQuizLoading(false));
      generateFlashcards(analysis.transcript)
        .then((f) => {
          setFlashcards(f);
          if (f.length === 0) toast.error("No flashcards could be generated for this video.");
        })
        .catch((e) => { console.error(e); toast.error(e?.message || "Flashcard generation failed"); })
        .finally(() => setFlashcardsLoading(false));
    }
  }, []);

  const handleQuizComplete = async (score: number, total: number) => {
    if (currentAnalysis?.id) {
      try {
        await updateQuizScore(currentAnalysis.id, score, total);
        loadHistory();
        const xpEarned = Math.round((score / total) * 50);
        await supabase.rpc("add_xp", { _user_id: user.id, _amount: xpEarned });
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
      <Suspense fallback={null}><FestivalOverlay /></Suspense>
      <AdPopup />

      {/* Header */}
      <header className="border-b border-border bg-card/80 glass sticky top-0 z-40 safe-top animate-fade-in">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <img src={logo} alt="Edspire Lens" className="h-7 w-7 sm:h-10 sm:w-10 object-contain shrink-0" />
            <h1 className="font-display text-base sm:text-xl font-bold text-foreground truncate">
              Edspire <span className="text-gradient">Lens</span>
            </h1>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            <InstallButton />
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/analytics")} className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-accent" title="Performance">
              <TrendingUp className="h-4 w-4" />
            </Button>
            <button onClick={() => navigate("/profile")} className="hover:opacity-80 transition-opacity" title="Profile">
              <MiniMascot />
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
              Your AI Study Companion for Every Lecture
            </div>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Turn any lecture into
              <br />
              <span className="text-gradient">complete chapter mastery</span>
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto px-4 sm:px-0">
              Paste any YouTube lecture and get the teacher's board notes, infographics, board-aligned quizzes, PYQs and a personal AI tutor — instantly.
            </p>
            <SimulatedOverlay />
          </div>
        )}

        <AdBanner placement="home" />

        <VideoInput onSubmit={handleAnalyze} isLoading={isLoading} />

        {!overlayMode && (
          <YouTubeSearch onSelect={handleAnalyze} />
        )}

        {overlayMode && currentAnalysis && (
          <div className="space-y-4">
            <YouTubeEmbed ref={videoRef} videoUrl={currentAnalysis.video_url} videoTitle={currentAnalysis.video_title} onTimeUpdate={setVideoTime} />
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
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>}>
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
            analysisId={currentAnalysis.id}
            onQuizComplete={handleQuizComplete}
            onSeekVideo={(sec) => videoRef.current?.seekTo(sec)}
          />
        </Suspense>
      )}

      {currentAnalysis && overlayMode && quiz.length > 0 && (
        <AIQuizCompanion
          quiz={quiz}
          transcript={currentAnalysis.transcript}
          getCurrentTime={() => videoRef.current?.getCurrentTime() ?? videoTime}
          visible={!lensOpen}
        />
      )}

      <Suspense fallback={null}><AppDrawer /></Suspense>
      <footer className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
        <button onClick={() => navigate("/about")} className="hover:text-accent underline-offset-2 hover:underline">
          About & Legal
        </button>
      </footer>
      {tutorialOpen && (
        <Suspense fallback={null}>
          <TutorialOverlay onClose={() => setTutorialOpen(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default Index;
