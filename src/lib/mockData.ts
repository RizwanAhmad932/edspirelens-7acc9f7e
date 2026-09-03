import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ *
 * Study-material cache — keeps the last summaries, notes, quizzes,
 * flashcards, PYQs and diagram MCQs in localStorage so panels open
 * instantly (and keep working) on slow or offline connections.
 * ------------------------------------------------------------------ */
const ARTIFACT_PREFIX = "edspire:artifact:v1:";
const ARTIFACT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashKey(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function artifactKey(kind: string, seed: string) {
  return `${ARTIFACT_PREFIX}${kind}:${hashKey(seed)}`;
}

export function readArtifact<T>(kind: string, seed: string): T | null {
  try {
    const raw = localStorage.getItem(artifactKey(kind, seed));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - (parsed.ts || 0) > ARTIFACT_TTL) return null;
    return parsed.value as T;
  } catch { return null; }
}

export function writeArtifact<T>(kind: string, seed: string, value: T) {
  try {
    localStorage.setItem(artifactKey(kind, seed), JSON.stringify({ ts: Date.now(), value }));
  } catch {
    // Storage full → drop the oldest cached artifacts and retry once.
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(ARTIFACT_PREFIX));
      keys
        .map((k) => ({ k, ts: JSON.parse(localStorage.getItem(k) || "{}").ts || 0 }))
        .sort((a, b) => a.ts - b.ts)
        .slice(0, Math.ceil(keys.length / 2))
        .forEach(({ k }) => localStorage.removeItem(k));
      localStorage.setItem(artifactKey(kind, seed), JSON.stringify({ ts: Date.now(), value }));
    } catch { /* give up silently */ }
  }
}

/** Cache-first wrapper: returns cached material instantly, otherwise generates. */
async function cached<T>(kind: string, seed: string, run: () => Promise<T>): Promise<T> {
  const hit = readArtifact<T>(kind, seed);
  if (hit) return hit;
  const value = await run();
  writeArtifact(kind, seed, value);
  return value;
}

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
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard" | string;
  topic?: string;
  timestamp?: string;
}

export interface Flashcard {
  front: string;
  back: string;
  hint?: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard" | string;
}

export interface PYQQuestion {
  year: string;
  marks: number;
  question: string;
  answer: string;
  topic?: string;
  type?: string;
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
  mnemonics?: string[];
  commonMistakes?: string[];
}

export interface DiagramQuizQuestion {
  label: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface DiagramQuiz {
  imageUrl: string;
  questions: DiagramQuizQuestion[];
}

export interface RevisionPlan {
  headline: string;
  focusTopics: { topic: string; accuracy: number; rootCause: string; fix: string }[];
  days: { day: number; focus: string; minutes: number; tasks: string[] }[];
  weeklyGoal: string;
}

export async function generateRevisionPlan(days = 7): Promise<RevisionPlan> {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: { videoUrl: "", action: "generate-revision-plan", days },
  });
  if (error) throw new Error(error.message || "Failed to build revision plan");
  if (data?.error) throw new Error(data.message || data.error);
  return data;
}

export async function generateShortNotes(chapterTitle: string, transcript: TranscriptSegment[]): Promise<ShortNotes> {
  const seed = chapterTitle + "|" + transcript.map((s) => s.text).join(" ");
  return cached("short-notes", seed, async () => {
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
  return data as ShortNotes;
  });
}

export async function generateDiagramQuiz(chapterTitle: string, transcript: TranscriptSegment[], exam: string): Promise<DiagramQuiz> {
  const seed = chapterTitle + "|" + exam + "|" + transcript.map((s) => s.text).join(" ");
  return cached("diagram-quiz", seed, async () => {
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
  return data as DiagramQuiz;
  });
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
  const seed = transcript.map((s) => s.text).join(" ");
  return cached("quiz", seed, async () => {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: {
      videoUrl: "",
      action: "generate-quiz",
      transcript: transcript.map((s) => s.text).join(" "),
    },
  });

  if (error) throw new Error(error.message || "Failed to generate quiz");
  if (data?.error) throw new Error(data.message || data.error);
  return (data.questions || []) as QuizQuestion[];
  });
}

export async function generateFlashcards(transcript: TranscriptSegment[]): Promise<Flashcard[]> {
  const seed = transcript.map((s) => s.text).join(" ");
  const hit = readArtifact<Flashcard[]>("flashcards", seed);
  if (hit?.length) return hit;
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
  writeArtifact("flashcards", seed, cards);
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
  const seed = chapterTitle + "|" + (summary || []).join("|");
  return cached("infographic", seed, async () => {
    const { data, error } = await supabase.functions.invoke("analyze-video", {
      body: { videoUrl: "", action: "generate-infographic", chapterTitle, summary },
    });
    if (error) throw new Error(error.message || "Failed to generate infographic");
    if (data?.error) throw new Error(data.message || data.error);
    return data.imageUrl as string;
  });
}

export async function generatePYQ(
  chapterTitle: string,
  transcript: TranscriptSegment[],
  exam: string,
  page = 1,
  seenQuestions: string[] = [],
): Promise<{ board: string; questions: PYQQuestion[] }> {
  const seed = chapterTitle + "|" + exam + "|p" + page + "|" + transcript.map((s) => s.text).join(" ");
  return cached("pyq", seed, async () => {
  const { data, error } = await supabase.functions.invoke("analyze-video", {
    body: {
      videoUrl: "",
      action: "generate-pyq",
      chapterTitle,
      transcript: transcript.map((s) => s.text).join(" "),
      exam,
      page,
      seenQuestions: seenQuestions.slice(-40),
    },
  });
  if (error) throw new Error(error.message || "Failed to generate PYQ");
  if (data?.error) throw new Error(data.message || data.error);
  return data as { board: string; questions: PYQQuestion[] };
  });
}


export async function generateTeacherNotes(
  chapterTitle: string,
  transcript: TranscriptSegment[],
): Promise<TeacherNoteBlock[]> {
  const seed = chapterTitle + "|" + transcript.map((s) => s.text).join(" ");
  return cached("teacher-notes", seed, async () => {
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
  return (data.blocks || []) as TeacherNoteBlock[];
  });
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

const HISTORY_CACHE_KEY = "edspire:history-cache:v1";
let historyInflight: Promise<VideoAnalysis[]> | null = null;

/** Instantly readable cached history (up to 24h old) for first paint. */
export function getCachedHistory(): VideoAnalysis[] | null {
  try {
    const raw = localStorage.getItem(HISTORY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const age = Date.now() - (parsed.ts || 0);
    if (age < 24 * 60 * 60 * 1000 && Array.isArray(parsed.items)) {
      return parsed.items as VideoAnalysis[];
    }
  } catch { /* ignore */ }
  return null;
}

export function fetchHistory(): Promise<VideoAnalysis[]> {
  // Dedupe concurrent callers so a burst of renders makes one request.
  if (historyInflight) return historyInflight;
  historyInflight = fetchHistoryUncached().finally(() => { historyInflight = null; });
  return historyInflight;
}

async function fetchHistoryUncached(): Promise<VideoAnalysis[]> {
  try {
    const { data, error } = await supabase
      .from("video_analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    const mapped: VideoAnalysis[] = (data || []).map((row: any) => ({
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
    try {
      localStorage.setItem(
        HISTORY_CACHE_KEY,
        JSON.stringify({ ts: Date.now(), items: mapped }),
      );
    } catch { /* quota */ }
    return mapped;
  } catch (e) {
    // Offline / network error → return cached history (valid for 24h) so
    // the dashboard keeps working without connectivity.
    const cached = getCachedHistory();
    if (cached) return cached;
    throw e;
  }
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
