import { useState, useRef, useCallback, useEffect } from "react";
import { X, Minimize2, Maximize2, GripVertical, BookOpen, Search, BrainCircuit, Loader2, FileText, Layers, MessageCircle, Image as ImageIcon, Award, ClipboardList } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryPanel from "./SummaryPanel";
import NotesPanel from "./NotesPanel";
import TopicSearch from "./TopicSearch";
import QuizPanel from "./QuizPanel";
import FlashcardPanel from "./FlashcardPanel";
import ChatPanel from "./ChatPanel";
import InfographicPanel from "./InfographicPanel";
import PYQPanel from "./PYQPanel";
import TeacherNotesPanel from "./TeacherNotesPanel";
import { TranscriptSegment, QuizQuestion, Flashcard } from "@/lib/mockData";
import { useIsMobile } from "@/hooks/use-mobile";

interface FloatingLensProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string[];
  notes: string[];
  transcript: TranscriptSegment[];
  quiz: QuizQuestion[];
  quizLoading?: boolean;
  flashcards: Flashcard[];
  flashcardsLoading?: boolean;
  videoTitle: string;
  onQuizComplete?: (score: number, total: number) => void;
  analysisId?: string;
}

const FloatingLens = ({ isOpen, onClose, summary, notes, transcript, quiz, quizLoading, flashcards, flashcardsLoading, videoTitle, onQuizComplete, analysisId }: FloatingLensProps) => {
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setPosition({ x: window.innerWidth - 440, y: 80 });
    }
  }, [isMobile]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    setIsDragging(true);
    offsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [position, isMobile]);

  useEffect(() => {
    if (!isDragging || isMobile) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 420, e.clientX - offsetRef.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - offsetRef.current.y)),
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, [isDragging, isMobile]);

  if (!isOpen) return null;

  // Mobile: bottom sheet style
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 animate-fade-in">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

        {/* Bottom Sheet */}
        <div className={`absolute bottom-0 left-0 right-0 rounded-t-2xl bg-card border-t border-border shadow-lens overflow-hidden animate-slide-up ${minimized ? 'h-14' : 'h-[85vh]'} transition-all duration-300`}>
          {/* Handle */}
          <div className="flex items-center gap-2 px-4 py-3 gradient-primary">
            <div className="w-8 h-1 rounded-full bg-primary-foreground/30 mx-auto absolute left-1/2 -translate-x-1/2 top-1.5" />
            <div className="flex-1 min-w-0 mt-1">
              <span className="text-xs font-semibold text-primary-foreground tracking-wide uppercase">Edspire Lens</span>
              {!minimized && <p className="text-xs text-primary-foreground/70 truncate mt-0.5">{videoTitle}</p>}
            </div>
            <button onClick={() => setMinimized(!minimized)} className="p-1 rounded hover:bg-primary-foreground/10 text-primary-foreground/80">
              {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-primary-foreground/10 text-primary-foreground/80">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {!minimized && (
            <div className="p-4 overflow-y-auto" style={{ height: "calc(85vh - 56px)" }}>
              <Tabs defaultValue="notes" className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-4 bg-secondary/50 rounded-lg h-10">
                  <TabsTrigger value="notes" className="text-xs gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <FileText className="h-3.5 w-3.5" /> Notes
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="text-xs gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <BookOpen className="h-3.5 w-3.5" /> Summary
                  </TabsTrigger>
                  <TabsTrigger value="quiz" className="text-xs gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <BrainCircuit className="h-3.5 w-3.5" /> Quiz
                  </TabsTrigger>
                </TabsList>
                <TabsList className="w-full grid grid-cols-3 mb-4 bg-secondary/50 rounded-lg h-10">
                  <TabsTrigger value="search" className="text-xs gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <Search className="h-3.5 w-3.5" /> Topics
                  </TabsTrigger>
                  <TabsTrigger value="flashcards" className="text-xs gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <Layers className="h-3.5 w-3.5" /> Cards
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="text-xs gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <MessageCircle className="h-3.5 w-3.5" /> Chat
                  </TabsTrigger>
                </TabsList>
                <TabsList className="w-full grid grid-cols-2 mb-4 bg-secondary/50 rounded-lg h-10">
                  <TabsTrigger value="infographic" className="text-xs gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <ImageIcon className="h-3.5 w-3.5" /> Infographic
                  </TabsTrigger>
                  <TabsTrigger value="pyq" className="text-xs gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <Award className="h-3.5 w-3.5" /> PYQs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="notes"><NotesPanel notes={notes} transcript={transcript} /></TabsContent>
                <TabsContent value="summary"><SummaryPanel summary={summary} /></TabsContent>
                <TabsContent value="search"><TopicSearch transcript={transcript} /></TabsContent>
                <TabsContent value="quiz">
                  {quizLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-accent" />
                      <p className="text-xs text-muted-foreground">Extracting questions...</p>
                    </div>
                  ) : quiz.length > 0 ? (
                    <QuizPanel questions={quiz} onComplete={onQuizComplete} />
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8">No quiz available yet.</p>
                  )}
                </TabsContent>
                <TabsContent value="flashcards"><FlashcardPanel flashcards={flashcards} loading={flashcardsLoading} /></TabsContent>
                <TabsContent value="chat"><ChatPanel videoTitle={videoTitle} transcript={transcript} /></TabsContent>
                <TabsContent value="infographic"><InfographicPanel chapterTitle={videoTitle} summary={summary} /></TabsContent>
                <TabsContent value="pyq"><PYQPanel chapterTitle={videoTitle} transcript={transcript} /></TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop: Floating draggable panel
  return (
    <div
      ref={dragRef}
      className="fixed z-50 animate-scale-in"
      style={{ left: position.x, top: position.y, width: minimized ? 220 : 420, transition: isDragging ? 'none' : 'width 0.2s ease' }}
    >
      <div className="rounded-2xl bg-card border border-border shadow-lens overflow-hidden">
        <div
          className="flex items-center gap-2 px-4 py-3 gradient-primary cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-4 w-4 text-primary-foreground/60" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-primary-foreground tracking-wide uppercase">Edspire Lens</span>
            {!minimized && <p className="text-xs text-primary-foreground/70 truncate mt-0.5">{videoTitle}</p>}
          </div>
          <button onClick={() => setMinimized(!minimized)} className="p-1 rounded hover:bg-primary-foreground/10 text-primary-foreground/80 transition-colors">
            {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-primary-foreground/10 text-primary-foreground/80 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {!minimized && (
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            <Tabs defaultValue="notes" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-2 bg-secondary/50 rounded-lg h-9">
                <TabsTrigger value="notes" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <FileText className="h-3 w-3" /> Notes
                </TabsTrigger>
                <TabsTrigger value="summary" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <BookOpen className="h-3 w-3" /> Summary
                </TabsTrigger>
                <TabsTrigger value="search" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <Search className="h-3 w-3" /> Topics
                </TabsTrigger>
                <TabsTrigger value="quiz" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <BrainCircuit className="h-3 w-3" /> Quiz
                </TabsTrigger>
              </TabsList>
              <TabsList className="w-full grid grid-cols-4 mb-4 bg-secondary/50 rounded-lg h-9">
                <TabsTrigger value="flashcards" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <Layers className="h-3 w-3" /> Cards
                </TabsTrigger>
                <TabsTrigger value="chat" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <MessageCircle className="h-3 w-3" /> Chat
                </TabsTrigger>
                <TabsTrigger value="infographic" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <ImageIcon className="h-3 w-3" /> Info
                </TabsTrigger>
                <TabsTrigger value="pyq" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <Award className="h-3 w-3" /> PYQ
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes"><NotesPanel notes={notes} transcript={transcript} /></TabsContent>
              <TabsContent value="summary"><SummaryPanel summary={summary} /></TabsContent>
              <TabsContent value="search"><TopicSearch transcript={transcript} /></TabsContent>
              <TabsContent value="quiz">
                {quizLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    <p className="text-xs text-muted-foreground">Extracting all questions from video...</p>
                  </div>
                ) : quiz.length > 0 ? (
                  <QuizPanel questions={quiz} onComplete={onQuizComplete} />
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">No quiz available yet.</p>
                )}
              </TabsContent>
              <TabsContent value="flashcards"><FlashcardPanel flashcards={flashcards} loading={flashcardsLoading} /></TabsContent>
              <TabsContent value="chat"><ChatPanel videoTitle={videoTitle} transcript={transcript} /></TabsContent>
              <TabsContent value="infographic"><InfographicPanel chapterTitle={videoTitle} summary={summary} /></TabsContent>
              <TabsContent value="pyq"><PYQPanel chapterTitle={videoTitle} transcript={transcript} /></TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingLens;
