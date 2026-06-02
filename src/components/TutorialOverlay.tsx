import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, Search, BrainCircuit, User, BarChart3, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TUTORIAL_KEY = "edspire_tutorial_done";

interface Step {
  icon: typeof Sparkles;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  { icon: Sparkles, title: "Welcome to Edspire Lens!", description: "Your AI study companion that turns any YouTube lecture into complete chapter mastery — notes, quizzes, flashcards, and more." },
  { icon: Search, title: "Paste any YouTube lecture", description: "Just paste a video URL on the home screen. AI extracts the transcript, detects your board/class, and generates everything." },
  { icon: BrainCircuit, title: "Open the Floating Lens", description: "Tap 'Open Lens' to access 10+ AI tools: Quiz, Flashcards, Short Notes, Diagram MCQs, PYQs, Infographics, Teacher's Board Notes, and AI Chat." },
  { icon: BarChart3, title: "Track your progress", description: "Earn XP from quizzes, level up your mascot, and visit Performance Analytics to see topic-wise mistakes and AI-suggested fixes." },
  { icon: Grid3x3, title: "Explore the App Drawer", description: "Tap the bottom-right launcher to access learning apps and tools your admin has added." },
  { icon: User, title: "Customize your profile", description: "Update your class, board, and target exam in Profile to get more accurate chapter detection. You can replay this tutorial anytime." },
];

export const shouldShowTutorial = () => {
  try { return localStorage.getItem(TUTORIAL_KEY) !== "1"; } catch { return false; }
};

export const resetTutorial = () => {
  try { localStorage.removeItem(TUTORIAL_KEY); } catch {}
};

interface Props {
  onClose: () => void;
}

const TutorialOverlay = ({ onClose }: Props) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const finish = () => {
    try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch {}
    onClose();
  };

  const s = STEPS[step];
  const Icon = s.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-elevated p-6 animate-scale-in">
        <button onClick={finish} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors" aria-label="Close tutorial">
          <X className="h-4 w-4" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-md">
            <Icon className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        <h2 className="font-display text-xl font-bold text-foreground text-center mb-2">{s.title}</h2>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-5">{s.description}</p>

        <div className="flex justify-center gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-accent" : i < step ? "w-1.5 bg-accent/40" : "w-1.5 bg-muted"}`} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={finish} className="text-xs text-muted-foreground">Skip tour</Button>
          <div className="flex-1" />
          {step > 0 && (
            <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)} className="gap-1">
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </Button>
          )}
          <Button size="sm" onClick={() => (isLast ? finish() : setStep((s) => s + 1))} className="gap-1 gradient-primary text-primary-foreground">
            {isLast ? "Start learning" : "Next"}
            {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;