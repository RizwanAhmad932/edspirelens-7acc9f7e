import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, CalendarDays, CalendarPlus, ChevronDown, Loader2, Sparkles,
  BookOpen, Layers, FileText, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  generateStudySchedule, generatePYQ, generateFlashcards, generateShortNotes,
  StudySchedule as Schedule, ScheduleDay, PYQQuestion, Flashcard, ShortNotes,
} from "@/lib/mockData";
import { buildScheduleIcs, downloadIcs } from "@/lib/exportIcs";
import { saveExamTarget } from "@/lib/examTarget";

const EXAMS = ["CBSE Board", "ICSE Board", "State Board", "JEE Main", "JEE Advanced", "NEET", "UPSC"];

interface DayMaterial {
  loading?: boolean;
  pyq?: PYQQuestion[];
  flashcards?: Flashcard[];
  notes?: ShortNotes;
}

const ConfidenceBadge = ({ value }: { value: number }) => {
  const tone =
    value >= 80 ? "text-emerald-500 border-emerald-500/40 bg-emerald-500/10"
      : value >= 55 ? "text-amber-500 border-amber-500/40 bg-amber-500/10"
        : "text-destructive border-destructive/40 bg-destructive/10";
  return (
    <span
      title={value >= 80 ? "Well supported — reliable" : value >= 55 ? "Reasonable — worth a quick check" : "Low support — double-check this"}
      className={cn("inline-flex items-center gap-1 text-[9px] font-mono-hud uppercase tracking-wider px-2 py-0.5 rounded-full border", tone)}
    >
      <ShieldCheck className="h-3 w-3" /> {Math.round(value)}%
    </span>
  );
};

const StudySchedulePage = () => {
  const navigate = useNavigate();
  const [exam, setExam] = useState("CBSE Board");
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [material, setMaterial] = useState<Record<number, DayMaterial>>({});
  const [startHour, setStartHour] = useState(18);
  const [reminder, setReminder] = useState(30);
  // Topic map: topic -> assigned day number (0 = unassigned pool).
  const [plan, setPlan] = useState<Record<string, number>>({});
  const [dragging, setDragging] = useState<string | null>(null);

  const allTopics = schedule ? Array.from(new Set(schedule.days.flatMap((d) => d.topics || []))) : [];
  const dayOf = (t: string) =>
    plan[t] ?? schedule?.days.find((d) => (d.topics || []).includes(t))?.day ?? 0;
  const topicsFor = (day: number) => allTopics.filter((t) => dayOf(t) === day);
  const assign = (day: number) => {
    if (!dragging) return;
    setPlan((p) => ({ ...p, [dragging]: day }));
    setDragging(null);
  };

  const build = async () => {
    setLoading(true);
    setSchedule(null);
    setMaterial({});
    try {
      const s = await generateStudySchedule(exam, days);
      setSchedule(s);
      setPlan({});
      if (s.examDate) {
        saveExamTarget({ exam: s.exam || exam, examDate: s.examDate, confidence: s.examDateConfidence });
      }
    } catch (e: any) {
      toast.error(e.message || "Could not build your schedule");
    } finally {
      setLoading(false);
    }
  };

  const pullMaterial = async (d: ScheduleDay) => {
    if (material[d.day]?.pyq || material[d.day]?.loading) return;
    const topic = d.topics?.[0] || d.focus;
    setMaterial((m) => ({ ...m, [d.day]: { ...m[d.day], loading: true } }));
    const seg = [{ timestamp: "0:00", seconds: 0, text: `${topic}. ${d.tasks.join(" ")}` }];
    const [pyq, cards, notes] = await Promise.allSettled([
      generatePYQ(topic, [], exam, 1),
      generateFlashcards(seg),
      generateShortNotes(topic, seg),
    ]);
    setMaterial((m) => ({
      ...m,
      [d.day]: {
        loading: false,
        pyq: pyq.status === "fulfilled" ? pyq.value.questions?.slice(0, 4) : [],
        flashcards: cards.status === "fulfilled" ? cards.value.slice(0, 5) : [],
        notes: notes.status === "fulfilled" ? notes.value : undefined,
      },
    }));
  };

  const exportCalendar = () => {
    if (!schedule) return;
    try {
      downloadIcs(
        "edspire-study-schedule.ics",
        buildScheduleIcs({
          title: `${schedule.exam} Study Schedule`,
          days: schedule.days,
          startHour,
          reminderMinutes: reminder,
          examDate: schedule.examDate,
          examName: schedule.exam,
        }),
      );
      toast.success("Calendar file downloaded — open it to add reminders");
    } catch {
      toast.error("Could not create calendar file");
    }
  };

  const daysLeft = schedule?.examDate
    ? Math.ceil((new Date(schedule.examDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-accent" /> Study Schedule
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <section className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-card">
          <p className="text-xs text-muted-foreground">
            Pick your exam — the app looks up the real exam date on the web and maps every day to topics,
            with past-paper questions, flashcards and notes pulled in for you.
          </p>
          <div className="flex flex-wrap gap-1">
            {EXAMS.map((e) => (
              <button
                key={e}
                onClick={() => setExam(e)}
                className={cn(
                  "text-[9px] font-mono-hud uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors",
                  exam === e ? "bg-accent/15 text-accent border-accent/50" : "border-foreground/10 text-muted-foreground hover:border-accent/40",
                )}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {[7, 14, 21, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] border transition-colors",
                  days === d ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent/40",
                )}
              >
                {d} days
              </button>
            ))}
          </div>
          <Button size="sm" onClick={build} disabled={loading} className="gap-2 gradient-primary text-primary-foreground">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Build my schedule
          </Button>
        </section>

        {loading && (
          <div className="flex flex-col items-center py-12 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p className="text-xs text-muted-foreground">Checking real exam dates and planning your days…</p>
          </div>
        )}

        {schedule && (
          <>
            <section className="bg-card border border-border rounded-2xl p-4 space-y-2 shadow-card">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-semibold">{schedule.exam}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Exam date {schedule.examDate}
                    {daysLeft !== null && daysLeft >= 0 ? ` · ${daysLeft} days left` : ""}
                  </p>
                </div>
                <ConfidenceBadge value={schedule.examDateConfidence} />
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed">{schedule.headline}</p>
              {!!schedule.sources?.length && (
                <div className="pt-1 space-y-0.5">
                  <p className="text-[9px] font-mono-hud uppercase tracking-wider text-muted-foreground">Date sources</p>
                  {schedule.sources.slice(0, 4).map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer noopener" className="block text-[11px] text-accent truncate hover:underline">
                      {s.title || s.url}
                    </a>
                  ))}
                </div>
              )}
            </section>

            <div className="space-y-2">
              {schedule.days.map((d) => {
                const mat = material[d.day];
                const isOpen = open === d.day;
                return (
                  <div key={d.day} className="rounded-xl border border-foreground/[0.07] bg-secondary/25 p-3 space-y-2">
                    <button
                      className="w-full text-left"
                      onClick={() => {
                        const next = isOpen ? null : d.day;
                        setOpen(next);
                        if (next !== null) pullMaterial(d);
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">Day {d.day} · {d.date}</span>
                        <div className="flex items-center gap-2">
                          <ConfidenceBadge value={d.confidence} />
                          <span className="text-[10px] font-mono-hud text-accent">{d.minutes} min</span>
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{d.focus}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {d.topics?.map((t) => (
                          <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25">{t}</span>
                        ))}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="space-y-3 animate-fade-in">
                        <ul className="text-[11px] text-foreground/85 list-disc pl-4 space-y-1">
                          {d.tasks.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>

                        {mat?.loading && (
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" /> Pulling PYQs, flashcards and notes…
                          </div>
                        )}

                        {!!mat?.pyq?.length && (
                          <div className="rounded-lg border border-foreground/[0.07] bg-background/50 p-2.5 space-y-1.5">
                            <p className="hud-label flex items-center gap-1.5"><BookOpen className="h-3 w-3 text-accent" /> Past-paper questions</p>
                            {mat.pyq.map((q, i) => (
                              <p key={i} className="text-[11px] text-foreground/85">
                                <span className="text-accent font-mono-hud text-[9px] mr-1">{q.year} · {q.marks}M</span>{q.question}
                              </p>
                            ))}
                          </div>
                        )}

                        {!!mat?.flashcards?.length && (
                          <div className="rounded-lg border border-foreground/[0.07] bg-background/50 p-2.5 space-y-1.5">
                            <p className="hud-label flex items-center gap-1.5"><Layers className="h-3 w-3 text-accent" /> Flashcards</p>
                            {mat.flashcards.map((c, i) => (
                              <p key={i} className="text-[11px] text-foreground/85"><span className="font-semibold">{c.front}</span> — {c.back}</p>
                            ))}
                          </div>
                        )}

                        {mat?.notes && (
                          <div className="rounded-lg border border-foreground/[0.07] bg-background/50 p-2.5 space-y-1">
                            <p className="hud-label flex items-center gap-1.5"><FileText className="h-3 w-3 text-accent" /> Quick notes</p>
                            {mat.notes.keyPoints?.slice(0, 5).map((k, i) => (
                              <p key={i} className="text-[11px] text-foreground/85">• {k}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <section className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-card">
              <p className="hud-label flex items-center gap-1.5">
                <CalendarPlus className="h-3.5 w-3.5 text-accent" /> Add to calendar
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">Daily start time</span>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="w-full h-8 rounded-lg bg-background/60 border border-foreground/10 text-[11px] px-2 outline-none focus:border-accent/50"
                  >
                    {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">Remind me before</span>
                  <select
                    value={reminder}
                    onChange={(e) => setReminder(Number(e.target.value))}
                    className="w-full h-8 rounded-lg bg-background/60 border border-foreground/10 text-[11px] px-2 outline-none focus:border-accent/50"
                  >
                    {[0, 10, 15, 30, 60].map((m) => (
                      <option key={m} value={m}>{m === 0 ? "At start" : `${m} min`}</option>
                    ))}
                  </select>
                </label>
              </div>
              <Button size="sm" onClick={exportCalendar} className="w-full gap-2 gradient-primary text-primary-foreground">
                <CalendarPlus className="h-3.5 w-3.5" /> Export calendar (.ics)
              </Button>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default StudySchedulePage;
