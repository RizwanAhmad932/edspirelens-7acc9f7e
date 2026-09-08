/**
 * The student's active exam target (name + real calendar date), shared
 * between the study schedule page and the live poll orb so revision
 * intensity follows the real exam calendar rather than arbitrary days.
 */
const KEY = "edspire:exam-target:v1";

export interface ExamTarget {
  exam: string;
  examDate: string; // ISO YYYY-MM-DD
  confidence?: number;
  savedAt: number;
}

export function saveExamTarget(t: Omit<ExamTarget, "savedAt">) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...t, savedAt: Date.now() }));
  } catch { /* ignore */ }
}

export function getExamTarget(): ExamTarget | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as ExamTarget;
    if (!t?.examDate) return null;
    return t;
  } catch {
    return null;
  }
}

/** Whole days until the exam (negative once it has passed). */
export function daysUntilExam(t: ExamTarget | null): number | null {
  if (!t?.examDate) return null;
  const then = new Date(t.examDate + "T00:00:00").getTime();
  if (Number.isNaN(then)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((then - today.getTime()) / 86400000);
}

/**
 * Poll cadence multiplier: the closer the exam, the more often the orb
 * checks understanding. 1 = normal spacing, <1 = more frequent.
 */
export function examUrgencyFactor(days: number | null): number {
  if (days === null || days < 0) return 1;
  if (days <= 7) return 0.5;
  if (days <= 21) return 0.7;
  if (days <= 60) return 0.85;
  return 1;
}
