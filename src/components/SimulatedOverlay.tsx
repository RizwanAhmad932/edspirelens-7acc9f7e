import { Play, Pause, Volume2, Maximize, Sparkles, MessageCircle, FileText, Zap, X } from "lucide-react";
import { useState } from "react";

interface SimulatedOverlayProps {
  videoTitle?: string;
}

/**
 * Preview of the Lens widget floating over a mock YouTube player layout.
 * Used on the landing hero to demo what students get after pasting a link.
 */
const SimulatedOverlay = ({ videoTitle = "Cell Division — Mitosis Explained" }: SimulatedOverlayProps) => {
  const [lensOpen, setLensOpen] = useState(true);
  const [tab, setTab] = useState<"chat" | "notes" | "quiz">("chat");

  return (
    <div className="w-full animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="hud-label inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" /> Live Preview — Lens Over YouTube
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono-hud text-[10px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" /> LIVE
        </span>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-black shadow-elevated aspect-video border border-foreground/10 scanline">
        {/* CRT scan lines */}
        <div className="absolute inset-0 scan-lines pointer-events-none z-10" />
        {/* Fake YouTube player */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Play className="h-6 w-6 sm:h-9 sm:w-9 text-white ml-1" fill="white" />
            </div>
            <p className="text-white/80 font-medium text-xs sm:text-base px-4">{videoTitle}</p>
          </div>
        </div>

        {/* Fake YouTube controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3">
          <div className="h-1 bg-white/20 rounded-full mb-2">
            <div className="h-full w-1/3 bg-red-600 rounded-full relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-red-600 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-white/90 text-[10px] sm:text-xs">
            <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
            <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>2:45 / 8:30</span>
            <span className="ml-auto"><Maximize className="h-3 w-3 sm:h-4 sm:w-4" /></span>
          </div>
        </div>

        {/* Floating Lens widget overlay */}
        {lensOpen && (
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-[62%] sm:w-[45%] max-w-[300px] rounded-xl bg-card/95 glass border border-border shadow-elevated overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border bg-gradient-to-r from-accent/20 to-transparent">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-accent" />
                <span className="text-[10px] font-semibold text-foreground">Edspire Lens</span>
              </div>
              <button onClick={() => setLensOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="flex border-b border-border text-[9px] sm:text-[10px]">
              {([
                { id: "chat", icon: MessageCircle, label: "Chat" },
                { id: "notes", icon: FileText, label: "Notes" },
                { id: "quiz", icon: Zap, label: "Quiz" },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 transition-colors ${
                    tab === t.id ? "bg-accent/10 text-accent border-b-2 border-accent" : "text-muted-foreground"
                  }`}
                >
                  <t.icon className="h-2.5 w-2.5" />
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-2.5 text-[10px] leading-snug text-foreground min-h-[80px]">
              {tab === "chat" && (
                <div className="space-y-1.5">
                  <div className="bg-secondary/60 rounded-lg px-2 py-1">What is prophase?</div>
                  <div className="text-muted-foreground">
                    Prophase is stage 1 — chromosomes condense.{" "}
                    <span className="inline-flex items-center gap-0.5 px-1 rounded bg-accent/20 text-accent font-medium">
                      <Play className="h-2 w-2" />1:24
                    </span>
                  </div>
                </div>
              )}
              {tab === "notes" && (
                <ul className="space-y-1 list-disc pl-3 text-muted-foreground">
                  <li>Mitosis has 4 phases</li>
                  <li>Produces 2 identical daughter cells</li>
                  <li>Occurs in somatic cells</li>
                </ul>
              )}
              {tab === "quiz" && (
                <div className="space-y-1">
                  <p className="font-medium">Which phase separates chromatids?</p>
                  <div className="space-y-0.5 text-muted-foreground">
                    <div>○ Prophase</div>
                    <div className="text-accent">● Anaphase</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!lensOpen && (
          <button
            onClick={() => setLensOpen(true)}
            className="absolute top-3 right-3 h-8 px-3 rounded-full gradient-accent text-accent-foreground text-[10px] font-medium shadow-lg flex items-center gap-1 animate-scale-in"
          >
            <Sparkles className="h-3 w-3" /> Open Lens
          </button>
        )}
      </div>
      <p className="text-center text-[10px] sm:text-xs text-muted-foreground mt-2">
        Tap the tabs above to preview Chat, Notes, and Quiz overlays.
      </p>
    </div>
  );
};

export default SimulatedOverlay;
