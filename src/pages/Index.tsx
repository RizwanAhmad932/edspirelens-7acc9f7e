import { useState, useEffect } from "react";
import { Sparkles, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import VideoInput from "@/components/VideoInput";
import FloatingLens from "@/components/FloatingLens";
import SimulatedOverlay from "@/components/SimulatedOverlay";
import HistorySection from "@/components/HistorySection";
import {
  analyzeVideo,
  generateQuiz,
  fetchHistory,
  updateQuizScore,
  VideoAnalysis,
  QuizQuestion,
} from "@/lib/mockData";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lensOpen, setLensOpen] = useState(false);
  const [overlayMode, setOverlayMode] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<VideoAnalysis | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [history, setHistory] = useState<VideoAnalysis[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
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
      toast.success("Video analyzed successfully!");
      loadHistory();

      // Generate quiz in background
      setQuizLoading(true);
      try {
        const quizData = await generateQuiz(analysis.transcript);
        setQuiz(quizData);
      } catch (e) {
        console.error("Quiz generation failed:", e);
        toast.error("Quiz generation failed, but summary is ready!");
      } finally {
        setQuizLoading(false);
      }
    } catch (e: any) {
      console.error("Analysis failed:", e);
      toast.error(e.message || "Failed to analyze video. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = async (analysis: VideoAnalysis) => {
    setCurrentAnalysis(analysis);
    setLensOpen(true);
    setOverlayMode(true);
    setQuiz([]);

    // Generate quiz for historical item
    if (analysis.transcript.length > 0) {
      setQuizLoading(true);
      try {
        const quizData = await generateQuiz(analysis.transcript);
        setQuiz(quizData);
      } catch (e) {
        console.error("Quiz generation failed:", e);
      } finally {
        setQuizLoading(false);
      }
    }
  };

  const handleQuizComplete = async (score: number, total: number) => {
    if (currentAnalysis?.id) {
      try {
        await updateQuizScore(currentAnalysis.id, score, total);
        loadHistory();
      } catch (e) {
        console.error("Failed to save quiz score:", e);
      }
    }
  };

  return (
    <div className="min-h-screen gradient-surface">
      {/* Header */}
      <header className="border-b border-border bg-card/80 glass sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Eye className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">
              EdSpire <span className="text-gradient">Lens</span>
            </h1>
          </div>
          {currentAnalysis && !lensOpen && (
            <button
              onClick={() => setLensOpen(true)}
              className="text-xs px-3 py-1.5 rounded-full gradient-accent text-accent-foreground font-medium shadow-sm hover:opacity-90 transition-opacity"
            >
              Open Lens
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 space-y-12">
        {/* Hero */}
        {!overlayMode && (
          <div className="text-center space-y-6 max-w-2xl mx-auto pt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI-Powered Video Analysis
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              Understand any video
              <br />
              <span className="text-gradient">in seconds</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
              Paste a video link and let EdSpire Lens extract key insights, generate quizzes, and help you learn faster.
            </p>
          </div>
        )}

        {/* Video Input */}
        <VideoInput onSubmit={handleAnalyze} isLoading={isLoading} />

        {/* Simulated Overlay */}
        {overlayMode && currentAnalysis && (
          <SimulatedOverlay videoTitle={currentAnalysis.video_title} />
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
          transcript={currentAnalysis.transcript}
          quiz={quiz}
          quizLoading={quizLoading}
          videoTitle={currentAnalysis.video_title}
          onQuizComplete={handleQuizComplete}
        />
      )}
    </div>
  );
};

export default Index;
