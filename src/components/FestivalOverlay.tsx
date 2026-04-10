import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

type ThemeName = "none" | "republic_day" | "eid" | "diwali" | "dussehra" | "holi" | "christmas" | "independence_day" | "navratri" | "new_year";

const useActiveTheme = () => {
  const [theme, setTheme] = useState<ThemeName>("none");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("app_themes").select("theme_name").eq("is_active", true).single();
      if (data) setTheme(data.theme_name as ThemeName);
    };
    load();

    // Use realtime for instant theme changes
    const channel = supabase.channel("theme-changes").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_themes" },
      () => load()
    ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return theme;
};

const particleStyle = { willChange: "transform", backfaceVisibility: "hidden" as const };

function Snowfall() {
  const flakes = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 8,
    duration: 4 + Math.random() * 6, size: 4 + Math.random() * 8, opacity: 0.4 + Math.random() * 0.6,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {flakes.map(f => (
        <div key={f.id} className="absolute rounded-full bg-white" style={{
          ...particleStyle, left: `${f.left}%`, top: -20, width: f.size, height: f.size, opacity: f.opacity,
          animation: `snowfall ${f.duration}s linear ${f.delay}s infinite`,
        }} />
      ))}
      <div className="absolute text-3xl sm:text-5xl" style={{ top: "8%", animation: "santaFly 12s linear infinite" }}>🎅🛷</div>
      <style>{`
        @keyframes snowfall { 0% { transform: translateY(-20px) rotate(0deg); } 100% { transform: translateY(100vh) rotate(360deg); } }
        @keyframes santaFly { 0% { left: -15%; } 100% { left: 115%; } }
      `}</style>
    </div>
  );
}

function RepublicDay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 flex">
        <div className="flex-1 bg-[#FF9933]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#138808]" />
      </div>
      {[10, 30, 55, 75, 90].map((l, i) => (
        <div key={i} className="absolute text-2xl sm:text-3xl" style={{ ...particleStyle, left: `${l}%`, top: `${10 + i * 12}%`, animation: `flagWave 3s ease-in-out ${i * 0.5}s infinite`, opacity: 0.7 }}>🇮🇳</div>
      ))}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 text-4xl sm:text-6xl opacity-10" style={{ animation: "spin 8s linear infinite" }}>☸️</div>
      <style>{`
        @keyframes flagWave { 0%, 100% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-15px) rotate(5deg); } }
        @keyframes spin { from { transform: translateX(-50%) rotate(0deg); } to { transform: translateX(-50%) rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Eid() {
  const stars = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i, left: Math.random() * 100, top: Math.random() * 60, delay: Math.random() * 4, size: 8 + Math.random() * 16,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="absolute top-[5%] right-[10%] text-5xl sm:text-7xl opacity-30" style={{ animation: "gentleGlow 3s ease-in-out infinite" }}>🌙</div>
      {stars.map(s => (
        <div key={s.id} className="absolute text-yellow-300" style={{ ...particleStyle, left: `${s.left}%`, top: `${s.top}%`, fontSize: s.size, animation: `twinkle 2s ease-in-out ${s.delay}s infinite`, opacity: 0.5 }}>✦</div>
      ))}
      <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
        <p className="text-lg sm:text-2xl font-bold text-center" style={{ background: "linear-gradient(135deg, #c4a35a, #f0d68a, #c4a35a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "gentleGlow 3s ease-in-out infinite" }}>✨ Eid Mubarak ✨</p>
      </div>
      {[15, 40, 65, 85].map((l, i) => (
        <div key={i} className="absolute text-2xl sm:text-3xl" style={{ ...particleStyle, left: `${l}%`, top: 0, animation: `lanternSwing 4s ease-in-out ${i * 0.7}s infinite`, transformOrigin: "top center" }}>🏮</div>
      ))}
      <style>{`
        @keyframes gentleGlow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
        @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.3); } }
        @keyframes lanternSwing { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
      `}</style>
    </div>
  );
}

function Diwali() {
  const diyas = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i, left: Math.random() * 100, top: 40 + Math.random() * 55, delay: Math.random() * 5, size: 10 + Math.random() * 14,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 opacity-60" style={{ animation: "shimmerBg 3s linear infinite", backgroundSize: "200% 100%" }} />
      {diyas.map(d => (
        <div key={d.id} className="absolute" style={{ ...particleStyle, left: `${d.left}%`, top: `${d.top}%`, fontSize: d.size, animation: `diyaFlicker 2s ease-in-out ${d.delay}s infinite` }}>🪔</div>
      ))}
      {[20, 50, 80].map((l, i) => (
        <div key={i} className="absolute text-3xl sm:text-5xl" style={{ ...particleStyle, left: `${l}%`, top: "5%", animation: `fireworkPop 4s ease-out ${i * 1.5}s infinite`, opacity: 0 }}>🎆</div>
      ))}
      <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2">
        <p className="text-lg sm:text-2xl font-bold text-center" style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🪔 Happy Diwali 🪔</p>
      </div>
      <style>{`
        @keyframes shimmerBg { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes diyaFlicker { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.9; transform: scale(1.15); } }
        @keyframes fireworkPop { 0% { opacity: 0; transform: scale(0.3) translateY(30px); } 20% { opacity: 1; transform: scale(1.2) translateY(-10px); } 60% { opacity: 0.8; } 100% { opacity: 0; transform: scale(0.5) translateY(-20px); } }
      `}</style>
    </div>
  );
}

function Dussehra() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-red-600 to-orange-500 opacity-60" />
      {[20, 50, 80].map((l, i) => (
        <div key={i} className="absolute text-3xl sm:text-4xl" style={{ ...particleStyle, left: `${l}%`, bottom: "10%", animation: `fireRise 3s ease-in-out ${i * 0.8}s infinite` }}>🔥</div>
      ))}
      <div className="absolute top-[10%] left-[8%] text-4xl sm:text-5xl opacity-25 rotate-[-20deg]">🏹</div>
      <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
        <p className="text-base sm:text-xl font-bold text-center" style={{ background: "linear-gradient(135deg, #ea580c, #dc2626)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🏹 Happy Dussehra 🏹</p>
      </div>
      <style>{`@keyframes fireRise { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; } 50% { transform: translateY(-20px) scale(1.3); opacity: 0.9; } }`}</style>
    </div>
  );
}

function Holi() {
  const colors = ["#e11d48", "#7c3aed", "#2563eb", "#16a34a", "#f59e0b", "#ec4899", "#06b6d4"];
  const splats = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    id: i, left: Math.random() * 100, top: Math.random() * 100,
    color: colors[i % colors.length], size: 20 + Math.random() * 60, delay: Math.random() * 6, duration: 4 + Math.random() * 4,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {splats.map(s => (
        <div key={s.id} className="absolute rounded-full" style={{ ...particleStyle, left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, backgroundColor: s.color, opacity: 0, animation: `colorSplash ${s.duration}s ease-in-out ${s.delay}s infinite`, filter: "blur(8px)" }} />
      ))}
      <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
        <p className="text-lg sm:text-2xl font-bold text-center" style={{ background: "linear-gradient(135deg, #e11d48, #7c3aed, #2563eb, #16a34a, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🎨 Happy Holi 🎨</p>
      </div>
      <style>{`@keyframes colorSplash { 0% { opacity: 0; transform: scale(0.3); } 30% { opacity: 0.15; transform: scale(1); } 70% { opacity: 0.1; } 100% { opacity: 0; transform: scale(0.5); } }`}</style>
    </div>
  );
}

function IndependenceDay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-2 flex">
        <div className="flex-1 bg-[#FF9933]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#138808]" />
      </div>
      <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
        <p className="text-lg sm:text-2xl font-bold text-center" style={{ background: "linear-gradient(135deg, #FF9933, #138808)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🇮🇳 Jai Hind 🇮🇳</p>
      </div>
      {[5, 25, 50, 75, 95].map((l, i) => (
        <div key={i} className="absolute text-xl sm:text-2xl" style={{ ...particleStyle, left: `${l}%`, top: `${15 + i * 10}%`, animation: `flagWaveI 4s ease-in-out ${i * 0.6}s infinite`, opacity: 0.5 }}>🇮🇳</div>
      ))}
      {/* Kite flying */}
      <div className="absolute text-3xl" style={{ top: "12%", animation: "kiteFly 10s ease-in-out infinite" }}>🪁</div>
      <style>{`
        @keyframes flagWaveI { 0%, 100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-12px) rotate(3deg); } }
        @keyframes kiteFly { 0% { left: -5%; transform: translateY(0); } 50% { left: 50%; transform: translateY(-30px); } 100% { left: 105%; transform: translateY(10px); } }
      `}</style>
    </div>
  );
}

function Navratri() {
  const dandiyaColors = ["#e11d48", "#f59e0b", "#16a34a", "#7c3aed", "#ec4899"];
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i, left: Math.random() * 100, top: 20 + Math.random() * 70,
    color: dandiyaColors[i % dandiyaColors.length], delay: Math.random() * 5, size: 12 + Math.random() * 14,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-500 via-yellow-400 to-green-500 opacity-50" />
      {particles.map(p => (
        <div key={p.id} className="absolute" style={{ ...particleStyle, left: `${p.left}%`, top: `${p.top}%`, fontSize: p.size, animation: `dandiyaSpin 3s ease-in-out ${p.delay}s infinite` }}>💃</div>
      ))}
      <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
        <p className="text-lg sm:text-2xl font-bold text-center" style={{ background: "linear-gradient(135deg, #e11d48, #f59e0b, #16a34a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🪔 Happy Navratri 🪔</p>
      </div>
      <style>{`@keyframes dandiyaSpin { 0%, 100% { transform: rotate(-10deg) scale(1); opacity: 0.4; } 50% { transform: rotate(10deg) scale(1.2); opacity: 0.8; } }`}</style>
    </div>
  );
}

function NewYear() {
  const confetti = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 6,
    color: ["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#ec4899"][i % 5],
    size: 6 + Math.random() * 8, duration: 3 + Math.random() * 4,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map(c => (
        <div key={c.id} className="absolute" style={{ ...particleStyle, left: `${c.left}%`, top: -10, width: c.size, height: c.size * 0.6, backgroundColor: c.color, borderRadius: "1px", animation: `confettiFall ${c.duration}s linear ${c.delay}s infinite` }} />
      ))}
      <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
        <p className="text-lg sm:text-2xl font-bold text-center" style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🎉 Happy New Year 🎉</p>
      </div>
      {[20, 50, 80].map((l, i) => (
        <div key={i} className="absolute text-3xl" style={{ left: `${l}%`, top: "10%", animation: `fireworkPop2 5s ease-out ${i * 1.5}s infinite`, opacity: 0 }}>🎆</div>
      ))}
      <style>{`
        @keyframes confettiFall { 0% { transform: translateY(-10px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
        @keyframes fireworkPop2 { 0% { opacity: 0; transform: scale(0.3); } 15% { opacity: 1; transform: scale(1.3); } 50% { opacity: 0.6; } 100% { opacity: 0; } }
      `}</style>
    </div>
  );
}

export default function FestivalOverlay() {
  const theme = useActiveTheme();
  if (theme === "none") return null;
  const map: Record<string, JSX.Element> = {
    christmas: <Snowfall />, republic_day: <RepublicDay />, eid: <Eid />,
    diwali: <Diwali />, dussehra: <Dussehra />, holi: <Holi />,
    independence_day: <IndependenceDay />, navratri: <Navratri />, new_year: <NewYear />,
  };
  return map[theme] || null;
}

export { useActiveTheme };
