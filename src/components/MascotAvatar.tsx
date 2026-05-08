import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MascotProps {
  size?: number;
  level?: number;
  className?: string;
}

/**
 * Lightweight 2D animated mascot — replaces the heavy Three.js avatar.
 * Uses pure SVG + CSS animation, no extra deps, no canvas.
 */
export const MascotAvatar = ({ size = 96, level = 1, className = "" }: MascotProps) => {
  // Color shifts with level for a sense of progression
  const hue = ((level - 1) * 25) % 360;
  const bodyColor = `hsl(${hue}, 70%, 55%)`;
  const accentColor = `hsl(${hue}, 70%, 40%)`;

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} className="mascot-float">
        <defs>
          <radialGradient id="bg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={bodyColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={bodyColor} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#bg)" />
        {/* Body */}
        <ellipse cx="60" cy="78" rx="28" ry="22" fill={accentColor} />
        {/* Head */}
        <circle cx="60" cy="48" r="26" fill={bodyColor} />
        {/* Hair */}
        <path d="M34 44 Q60 18 86 44 Q86 30 60 22 Q34 30 34 44 Z" fill={accentColor} />
        {/* Eyes (with blink animation) */}
        <g className="mascot-eyes">
          <ellipse cx="50" cy="50" rx="3" ry="4" fill="#1f2937" />
          <ellipse cx="70" cy="50" rx="3" ry="4" fill="#1f2937" />
          <circle cx="51" cy="49" r="1" fill="#fff" />
          <circle cx="71" cy="49" r="1" fill="#fff" />
        </g>
        {/* Smile */}
        <path d="M52 60 Q60 66 68 60" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Cheeks */}
        <circle cx="44" cy="58" r="3" fill="#fda4af" opacity="0.6" />
        <circle cx="76" cy="58" r="3" fill="#fda4af" opacity="0.6" />
        {/* Graduation cap */}
        <rect x="38" y="22" width="44" height="6" rx="1" fill="#1f2937" />
        <polygon points="60,12 88,22 60,32 32,22" fill="#1f2937" />
        <circle cx="60" cy="22" r="2" fill="#fbbf24" />
        <line x1="60" y1="22" x2="78" y2="30" stroke="#fbbf24" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

/**
 * Tiny header version that also shows the user's level.
 */
export const MiniMascot = ({ className = "" }: { className?: string }) => {
  const [level, setLevel] = useState(1);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      const { data } = await supabase.from("profiles").select("level").eq("id", user.id).maybeSingle();
      if (mounted && data?.level) setLevel(data.level);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <MascotAvatar size={36} level={level} />
      <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-accent text-accent-foreground rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-sm">
        {level}
      </span>
    </div>
  );
};

export default MascotAvatar;