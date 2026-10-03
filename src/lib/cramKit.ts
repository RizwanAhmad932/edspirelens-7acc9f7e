import { exportDocPdf, DocSection } from "@/lib/exportDoc";
import type { QuizQuestion, Flashcard } from "@/lib/mockData";

/** Scan localStorage for any cached PYQs / short notes generated for this chapter. */
function findCached(chapter: string, needle: string): any[] {
  const out: any[] = [];
  const key = chapter.toLowerCase().slice(0, 40);
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (!k.toLowerCase().includes(needle) || !k.toLowerCase().includes(key.slice(0, 15))) continue;
      const v = JSON.parse(localStorage.getItem(k) || "null");
      const data = v?.data ?? v;
      if (Array.isArray(data)) out.push(...data);
      else if (Array.isArray(data?.questions)) out.push(...data.questions);
      else if (data) out.push(data);
    }
  } catch { /* ignore */ }
  return out;
}

export async function downloadCramKit(o: {
  title: string; summary: string[]; notes: string[]; quiz: QuizQuestion[]; flashcards: Flashcard[];
}) {
  const pyqs = findCached(o.title, "pyq").filter((q) => q?.question).slice(0, 15);
  const sections: DocSection[] = [
    { heading: "1. Chapter summary", type: "list", items: o.summary },
    { heading: "2. Key notes", type: "list", items: o.notes },
    {
      heading: "3. Rapid-recall flashcards", type: "kv",
      items: o.flashcards.slice(0, 40).map((c) => ({ term: c.front, definition: " - " + c.back })),
    },
    {
      heading: "4. Past-year questions", type: "qa",
      items: pyqs.map((q) => ({
        question: q.question, answer: q.answer || "",
        meta: [q.exam, q.year, q.marks ? `${q.marks} mark` : ""].filter(Boolean).join(" | "),
      })),
    },
    {
      heading: "5. Practice questions (with answers)", type: "qa",
      items: o.quiz.slice(0, 25).map((q) => ({
        question: `${q.question}\n${q.options.map((op, i) => `(${String.fromCharCode(65 + i)}) ${op}`).join("   ")}`,
        answer: `(${String.fromCharCode(65 + q.correctIndex)}) ${q.options[q.correctIndex] ?? ""}${q.explanation ? " - " + q.explanation : ""}`,
        meta: [q.topic, q.difficulty].filter(Boolean).join(" | "),
      })),
    },
  ];
  await exportDocPdf({
    title: `Cram Kit: ${o.title}`,
    subtitle: "Edspire Lens - complete chapter revision booklet",
    sections: sections.filter((s) => s.items.length > 0),
  });
}
