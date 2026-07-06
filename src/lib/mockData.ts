import { supabase } from "@/integrations/supabase/client";

export interface TranscriptSegment {
  timestamp: string;
  seconds: number;
  text: string;
}

export interface VideoAnalysis {
  id: string;
  video_url: string;
  video_title: string;
  duration: string | null;
  summary: string[];
  notes: string[];
  transcript: TranscriptSegment[];
  quiz?: QuizQuestion[];
  quiz_score?: number | null;
  quiz_total?: number | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface PYQQuestion {
  year: string;
  marks: number;
  question: string;
  answer: string;
}

export interface TeacherNoteBlock {
  timestamp?: string;
  heading: string;
  bullets?: string[];
  formula?: string;
  diagram?: string;
}

export interface ShortNotes {
  title: string;
  keyPoints: string[];
  formulas: string[];
  keyTerms: { term: string; definition: string }[];
  rememberTip: string;
}

export interface DiagramQuizQuestion {
  label: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface DiagramQuiz {
  imageUrl: string;
  questions: DiagramQuizQuestion[];
}

export async function generateShortNotes(chapterTitle: string, transcript: TranscriptSegment[]): Promise<ShortNotes> {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: {
      videoUrl: "",
      action: "generate-short-notes",
      chapterTitle,
      transcript: transcript.map((s) => s.text).join(" "),
    },
  });
  if (error) throw new Error(error.message || "Failed to generate short notes");
  if (data?.error) throw new Error(data.message || data.error);
  return data;
}

export async function generateDiagramQuiz(chapterTitle: string, transcript: TranscriptSegment[], exam: string): Promise<DiagramQuiz> {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: {
      videoUrl: "",
      action: "generate-diagram-quiz",
      chapterTitle,
      transcript: transcript.map((s) => s.text).join(" "),
      exam,
    },
  });
  if (error) throw new Error(error.message || "Failed to generate diagram quiz");
  if (data?.error) throw new Error(data.message || data.error);
  return data;
}

export async function analyzeVideo(videoUrl: string): Promise<VideoAnalysis> {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: { videoUrl, action: "analyze" },
  });

  if (error) throw new Error(error.message || "Failed to analyze video");
  if (data?.error) throw new Error(data.message || data.error);

  return {
    id: data.id || crypto.randomUUID(),
    video_url: videoUrl,
    video_title: data.title || "Untitled Video",
    duration: data.duration || null,
    summary: data.summary || [],
    notes: data.notes || [],
    transcript: data.transcript || [],
    created_at: new Date().toISOString(),
  };
}

export async function generateQuiz(transcript: TranscriptSegment[]): Promise<QuizQuestion[]> {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: {
      videoUrl: "",
      action: "generate-quiz",
      transcript: transcript.map((s) => s.text).join(" "),
    },
  });

  if (error) throw new Error(error.message || "Failed to generate quiz");
  if (data?.error) throw new Error(data.message || data.error);
  return data.questions || [];
}

export async function generateFlashcards(transcript: TranscriptSegment[]): Promise<Flashcard[]> {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: {
      videoUrl: "",
      action: "generate-flashcards",
      transcript: transcript.map((s) => s.text).join(" "),
    },
  });

  if (error) {
    const fb = buildFallbackFlashcards(transcript);
    if (fb.length) return fb;
    throw new Error(error.message || "Failed to generate flashcards");
  }
  if (data?.error) {
    const fb = buildFallbackFlashcards(transcript);
    if (fb.length) return fb;
    throw new Error(data.message || data.error);
  }
  const cards: Flashcard[] = data?.flashcards || [];
  if (cards.length === 0) return buildFallbackFlashcards(transcript);
  return cards;
}

// Client-side fallback: build simple Q/A flashcards from transcript sentences
// so the panel is never empty when AI is rate-limited or offline.
function buildFallbackFlashcards(transcript: TranscriptSegment[]): Flashcard[] {
  if (!transcript || transcript.length === 0) return [];
  const sentences = transcript
    .map((s) => s.text.trim())
    .filter((t) => t.length > 40 && t.length < 240)
    .slice(0, 12);
  return sentences.map((text, i) => {
    const words = text.split(/\s+/);
    const keyword = words.find((w) => w.length > 5 && /^[A-Za-z]+$/.test(w)) || words[0] || `Key #${i + 1}`;
    return {
      front: `What is meant by "${keyword}" here?`,
      back: text,
    };
  });
}

export async function generateInfographic(chapterTitle: string, summary: string[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: { videoUrl: "", action: "generate-infographic", chapterTitle, summary },
  });
  if (error) throw new Error(error.message || "Failed to generate infographic");
  if (data?.error) throw new Error(data.message || data.error);
  return data.imageUrl;
}

export async function generatePYQ(
  chapterTitle: string,
  transcript: TranscriptSegment[],
  exam: string,
): Promise<{ board: string; questions: PYQQuestion[] }> {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: {
      videoUrl: "",
      action: "generate-pyq",
      chapterTitle,
      transcript: transcript.map((s) => s.text).join(" "),
      exam,
    },
  });
  if (error) throw new Error(error.message || "Failed to generate PYQ");
  if (data?.error) throw new Error(data.message || data.error);
  return data;
}

export async function generateTeacherNotes(
  chapterTitle: string,
  transcript: TranscriptSegment[],
): Promise<TeacherNoteBlock[]> {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: {
      videoUrl: "",
      action: "teacher-notes",
      chapterTitle,
      transcript: transcript.map((s) => `[${s.timestamp}] ${s.text}`).join("\n"),
    },
  });
  if (error) throw new Error(error.message || "Failed to extract teacher notes");
  if (data?.error) throw new Error(data.message || data.error);
  return data.blocks || [];
}

export async function recordQuizAttempt(payload: {
  analysisId?: string;
  videoTitle: string;
  topic?: string;
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    analysis_id: payload.analysisId || null,
    video_title: payload.videoTitle,
    topic: payload.topic || payload.videoTitle,
    question: payload.question,
    selected_answer: payload.selectedAnswer,
    correct_answer: payload.correctAnswer,
    is_correct: payload.isCorrect,
  });
}

export async function fetchHistory(): Promise<VideoAnalysis[]> {
  const { data, error } = await supabase
    .from("video_analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    video_url: row.video_url,
    video_title: row.video_title,
    duration: row.duration,
    summary: row.summary || [],
    notes: row.notes || [],
    transcript: row.transcript || [],
    quiz_score: row.quiz_score,
    quiz_total: row.quiz_total,
    created_at: row.created_at,
  }));
}

export async function updateQuizScore(analysisId: string, score: number, total: number): Promise<void> {
  const { error } = await supabase
    .from("video_analyses")
    .update({ quiz_score: score, quiz_total: total })
    .eq("id", analysisId);
  if (error) throw error;
}

export function searchTopic(query: string, transcript: TranscriptSegment[]): TranscriptSegment[] {
  const q = query.toLowerCase();
  return transcript.filter((seg) => seg.text.toLowerCase().includes(q));
}
