import { useState } from "react";
import { Sparkles, Eye } from "lucide-react";
import VideoInput from "@/components/VideoInput";
import FloatingLens from "@/components/FloatingLens";
import SimulatedOverlay from "@/components/SimulatedOverlay";
import HistorySection from "@/components/HistorySection";
import {
  mockTranscript,
  mockSummary,
  mockQuiz,
  mockHistory,
  simulateProcessing,
  VideoAnalysis,
} from "@/lib/mockData";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lensOpen, setLensOpen] = useState(false);
  const [overlayMode, setOverlayMode] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("Introduction to Machine Learning");
  const [history] = useState<VideoAnalysis[]>(mockHistory);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    await simulateProcessing();
    setIsLoading(false);
    setCurrentTitle("Introduction to Machine Learning");
    setLensOpen(true);
    setOverlayMode(true);
  };

  const handleSelectHistory = (analysis: VideoAnalysis) => {
    setCurrentTitle(analysis.title);
    setLensOpen(true);
    setOverlayMode(true);
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
          {lensOpen && (
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
        {overlayMode && <SimulatedOverlay videoTitle={currentTitle} />}

        {/* History */}
        <HistorySection history={history} onSelect={handleSelectHistory} />
      </main>

      {/* Floating Lens */}
      <FloatingLens
        isOpen={lensOpen}
        onClose={() => setLensOpen(false)}
        summary={mockSummary}
        transcript={mockTranscript}
        quiz={mockQuiz}
        videoTitle={currentTitle}
      />
    </div>
  );
};

export default Index;
