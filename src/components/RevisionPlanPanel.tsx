import { useState } from "react";
import { CalendarDays, CalendarPlus, Loader2, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateRevisionPlan, RevisionPlan } from "@/lib/mockData";
import { PanelHeader, ExportButton } from "@/components/panel/PanelFrame";
import { buildRevisionIcs, downloadIcs } from "@/lib/exportIcs";

const RevisionPlanPanel = () => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<RevisionPlan | null>(null);
  const [days, setDays] = useState(7);
  const [startHour, setStartHour] = useState(18);
  const [reminder, setReminder] = useState(30);

  const build = async () => {
    setLoading(true);
    try {
      setPlan(await generateRevisionPlan(days));
    } catch (e: any) {
      toast.error(e.message || "Could not build your plan");
    } finally {
      setLoading(false);
    }
  };

  const exportCalendar = () => {
    if (!plan) return;
    try {
      const ics = buildRevisionIcs({
        title: "Adaptive Revision Plan",
        days: plan.days,
        startHour,
        reminderMinutes: reminder,
      });
      downloadIcs("adaptive-revision-plan.ics", ics);
      toast.success("Calendar file downloaded — open it to add reminders");
    } catch {
      toast.error("Could not create calendar file");
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-4">
      <PanelHeader
        label="Adaptive Revision Plan"
        icon={<CalendarDays className="h-3.5 w-3.5" />}
        meta={plan ? `${plan.days.length} days` : undefined}
        actions={
          plan && (
            <ExportButton
              title="Adaptive Revision Plan"
              subtitle={plan.headline}
              sections={[
                { heading: "Focus Topics", type: "list", items: plan.focusTopics.map((t) => `${t.topic} (${t.accuracy}%) — ${t.rootCause} → ${t.fix}`) },
                ...plan.days.map((d) => ({
                  heading: `Day ${d.day} — ${d.focus} (${d.minutes} min)`,
                  type: "list" as const,
                  items: d.tasks,
                })),
                { heading: "Weekly Goal", type: "text", items: [plan.weeklyGoal] },
              ]}
            />
          )
        }
      />

      {!plan && !loading && (
        <div className="text-center py-5 space-y-3">
          <p className="text-xs text-muted-foreground">
            The AI reads your quiz mistakes and builds a day-by-day plan that fixes your weakest topics first.
          </p>
          <div className="flex items-center justify-center gap-2">
            {[3, 7, 14].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-[11px] border transition-colors ${
                  days === d ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent/40"
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
          <Button size="sm" onClick={build} className="gap-2 gradient-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Build my plan
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-8 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-xs text-muted-foreground">Analysing your mistakes…</p>
        </div>
      )}

      {plan && (
        <div className="space-y-4">
          <p className="text-xs text-foreground/85 leading-relaxed">{plan.headline}</p>

          <div className="space-y-2">
            {plan.focusTopics.map((t) => (
              <div key={t.topic} className="rounded-xl border border-destructive/25 bg-destructive/[0.05] p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{t.topic}</span>
                  <span className="text-[10px] font-mono-hud text-destructive">{t.accuracy}%</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Why: {t.rootCause}</p>
                <p className="text-[11px] text-accent">Fix: {t.fix}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {plan.days.map((d) => (
              <div key={d.day} className="rounded-xl border border-foreground/[0.07] bg-secondary/25 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Day {d.day} · {d.focus}</span>
                  <span className="text-[10px] font-mono-hud text-accent">{d.minutes} min</span>
                </div>
                <ul className="text-[11px] text-foreground/85 list-disc pl-4 space-y-1">
                  {d.tasks.map((task, i) => <li key={i}>{task}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-[11px] text-foreground/90 flex gap-2">
            <Target className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
            <span>{plan.weeklyGoal}</span>
          </div>

          <div className="rounded-xl border border-foreground/[0.07] bg-secondary/25 p-3 space-y-3">
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
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
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
              <CalendarPlus className="h-3.5 w-3.5" /> Export .ics with reminders
            </Button>
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={build}>
            Rebuild plan
          </Button>
        </div>
      )}
    </div>
  );
};

export default RevisionPlanPanel;