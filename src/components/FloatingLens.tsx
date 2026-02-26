import { useState, useRef, useCallback, useEffect } from "react";
import { X, Minimize2, Maximize2, GripVertical, BookOpen, Search, BrainCircuit, Loader2, FileText, Layers, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryPanel from "./SummaryPanel";
import NotesPanel from "./NotesPanel";
import TopicSearch from "./TopicSearch";
import QuizPanel from "./QuizPanel";
import FlashcardPanel from "./FlashcardPanel";
import ChatPanel from "./ChatPanel";
import { TranscriptSegment, QuizQuestion, Flashcard } from "@/lib/mockData";

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
}

const FloatingLens = ({ isOpen, onClose, summary, notes, transcript, quiz, quizLoading, flashcards, flashcardsLoading, videoTitle, onQuizComplete }: FloatingLensProps) => {
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setPosition({ x: window.innerWidth - 440, y: 80 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    offsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;
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
  }, [isDragging]);

  if (!isOpen) return null;

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
            <span className="text-xs font-semibold text-primary-foreground tracking-wide uppercase">EdSpire.AI Lens</span>
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
              <TabsList className="w-full grid grid-cols-6 mb-4 bg-secondary/50 rounded-lg h-9">
                <TabsTrigger value="notes" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <FileText className="h-3 w-3" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="summary" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <BookOpen className="h-3 w-3" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="search" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <Search className="h-3 w-3" />
                  Topics
                </TabsTrigger>
                <TabsTrigger value="quiz" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <BrainCircuit className="h-3 w-3" />
                  Quiz
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <Layers className="h-3 w-3" />
                  Cards
                </TabsTrigger>
                <TabsTrigger value="chat" className="text-[10px] gap-1 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-1">
                  <MessageCircle className="h-3 w-3" />
                  Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes">
                <NotesPanel notes={notes} transcript={transcript} />
              </TabsContent>
              <TabsContent value="summary">
                <SummaryPanel summary={summary} />
              </TabsContent>
              <TabsContent value="search">
                <TopicSearch transcript={transcript} />
              </TabsContent>
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
              <TabsContent value="flashcards">
                <FlashcardPanel flashcards={flashcards} loading={flashcardsLoading} />
              </TabsContent>
              <TabsContent value="chat">
                <ChatPanel videoTitle={videoTitle} transcript={transcript} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingLens;
