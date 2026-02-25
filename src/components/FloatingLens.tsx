import { useState, useRef, useCallback, useEffect } from "react";
import { X, Minimize2, Maximize2, GripVertical, BookOpen, Search, BrainCircuit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryPanel from "./SummaryPanel";
import TopicSearch from "./TopicSearch";
import QuizPanel from "./QuizPanel";
import { TranscriptSegment, QuizQuestion } from "@/lib/mockData";

interface FloatingLensProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string[];
  transcript: TranscriptSegment[];
  quiz: QuizQuestion[];
  videoTitle: string;
}

const FloatingLens = ({ isOpen, onClose, summary, transcript, quiz, videoTitle }: FloatingLensProps) => {
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Position on right side
  useEffect(() => {
    setPosition({ x: window.innerWidth - 420, y: 80 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - offsetRef.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - offsetRef.current.y)),
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  return (
    <div
      ref={dragRef}
      className="fixed z-50 transition-all duration-200"
      style={{
        left: position.x,
        top: position.y,
        width: minimized ? 220 : 380,
      }}
    >
      <div className="rounded-2xl bg-card border border-border shadow-lens overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-3 gradient-primary cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-4 w-4 text-primary-foreground/60" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-primary-foreground tracking-wide uppercase">
              EdSpire Lens
            </span>
            {!minimized && (
              <p className="text-xs text-primary-foreground/70 truncate mt-0.5">
                {videoTitle}
              </p>
            )}
          </div>
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 rounded hover:bg-primary-foreground/10 text-primary-foreground/80 transition-colors"
          >
            {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-primary-foreground/10 text-primary-foreground/80 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content */}
        {!minimized && (
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-4 bg-secondary/50 rounded-lg h-9">
                <TabsTrigger value="summary" className="text-xs gap-1.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <BookOpen className="h-3.5 w-3.5" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="search" className="text-xs gap-1.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Search className="h-3.5 w-3.5" />
                  Topics
                </TabsTrigger>
                <TabsTrigger value="quiz" className="text-xs gap-1.5 rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  Quiz
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <SummaryPanel summary={summary} />
              </TabsContent>
              <TabsContent value="search">
                <TopicSearch transcript={transcript} />
              </TabsContent>
              <TabsContent value="quiz">
                <QuizPanel questions={quiz} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingLens;
