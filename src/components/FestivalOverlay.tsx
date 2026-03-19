import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

type ThemeName = "none" | "republic_day" | "eid" | "diwali" | "dussehra" | "holi" | "christmas";

const useActiveTheme = () => {
  const [theme, setTheme] = useState<ThemeName>("none");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_themes")
        .select("theme_name")
        .eq("is_active", true)
        .single();
      if (data) setTheme(data.theme_name as ThemeName);
    };
    load();

    // Refresh every 30s to pick up admin changes
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return theme;
};

// ── Snowflakes for Christmas ──
function Snowfall() {
  const flakes = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 4 + Math.random() * 6,
      size: 4 + Math.random() * 8,
      opacity: 0.4 + Math.random() * 0.6,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {flakes.map(f => (
        <div
          key={f.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${f.left}%`,
            top: -20,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animation: `snowfall ${f.duration}s linear ${f.delay}s infinite`,
          }}
        />
      ))}
      {/* Santa flying */}
      <div
        className="absolute text-3xl sm:text-5xl"
        style={{
          top: "8%",
          animation: "santaFly 12s linear infinite",
        }}
      >
        🎅🛷
      </div>
      <style>{`
        @keyframes snowfall {
          0% { transform: translateY(-20px) rotate(0deg); }
          100% { transform: translateY(100vh) rotate(360deg); }
        }
        @keyframes santaFly {
          0% { left: -15%; }
          100% { left: 115%; }
        }
      `}</style>
    </div>
  );
}

// ── Republic Day ──
function RepublicDay() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Tricolor stripes at top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>
      {/* Floating flags */}
      {[10, 30, 55, 75, 90].map((l, i) => (
        <div
          key={i}
          className="absolute text-2xl sm:text-3xl"
          style={{
            left: `${l}%`,
            top: `${10 + i * 12}%`,
            animation: `flagWave 3s ease-in-out ${i * 0.5}s infinite`,
            opacity: 0.7,
          }}
        >
          🇮🇳
        </div>
      ))}
      {/* Ashoka Chakra spinning */}
      <div
        className="absolute top-[15%] left-1/2 -translate-x-1/2 text-4xl sm:text-6xl opacity-10"
        style={{ animation: "spin 8s linear infinite" }}
      >
        ☸️
      </div>
      <style>{`
        @keyframes flagWave {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes spin { from { transform: translateX(-50%) rotate(0deg); } to { transform: translateX(-50%) rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Eid ──
function Eid() {
  const stars = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 60,
      delay: Math.random() * 4,
      size: 8 + Math.random() * 16,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Crescent Moon */}
      <div className="absolute top-[5%] right-[10%] text-5xl sm:text-7xl opacity-30" style={{ animation: "gentleGlow 3s ease-in-out infinite" }}>
        🌙
      </div>
      {/* Stars twinkling */}
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute text-yellow-300"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            fontSize: s.size,
            animation: `twinkle 2s ease-in-out ${s.delay}s infinite`,
            opacity: 0.5,
          }}
        >
          ✦
        </div>
      ))}
      {/* Eid Mubarak text */}
      <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
        <p
          className="text-lg sm:text-2xl font-bold text-center"
          style={{
            background: "linear-gradient(135deg, #c4a35a, #f0d68a, #c4a35a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "gentleGlow 3s ease-in-out infinite",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          ✨ Eid Mubarak ✨
        </p>
      </div>
      {/* Lanterns */}
      {[15, 40, 65, 85].map((l, i) => (
        <div
          key={i}
          className="absolute text-2xl sm:text-3xl"
          style={{
            left: `${l}%`,
            top: 0,
            animation: `lanternSwing 4s ease-in-out ${i * 0.7}s infinite`,
            transformOrigin: "top center",
          }}
        >
          🏮
        </div>
      ))}
      <style>{`
        @keyframes gentleGlow {
          0%, 100% { opacity: 0.3; filter: brightness(1); }
          50% { opacity: 0.6; filter: brightness(1.3); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.3); }
        }
        @keyframes lanternSwing {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
}

// ── Diwali ──
function Diwali() {
  const diyas = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: 40 + Math.random() * 55,
      delay: Math.random() * 5,
      size: 10 + Math.random() * 14,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Top sparkle banner */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 opacity-60" style={{ animation: "shimmerBg 3s linear infinite", backgroundSize: "200% 100%" }} />
      {/* Floating diyas/lights */}
      {diyas.map(d => (
        <div
          key={d.id}
          className="absolute"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            fontSize: d.size,
            animation: `diyaFlicker 2s ease-in-out ${d.delay}s infinite`,
          }}
        >
          🪔
        </div>
      ))}
      {/* Fireworks emojis */}
      {[20, 50, 80].map((l, i) => (
        <div
          key={i}
          className="absolute text-3xl sm:text-5xl"
          style={{
            left: `${l}%`,
            top: "5%",
            animation: `fireworkPop 4s ease-out ${i * 1.5}s infinite`,
            opacity: 0,
          }}
        >
          🎆
        </div>
      ))}
      {/* Happy Diwali text */}
      <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2">
        <p className="text-lg sm:text-2xl font-bold text-center" style={{
          background: "linear-gradient(135deg, #f59e0b, #ef4444, #f59e0b)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "gentleGlow 3s ease-in-out infinite",
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          🪔 Happy Diwali 🪔
        </p>
      </div>
      <style>{`
        @keyframes shimmerBg {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes diyaFlicker {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.15); }
        }
        @keyframes fireworkPop {
          0% { opacity: 0; transform: scale(0.3) translateY(30px); }
          20% { opacity: 1; transform: scale(1.2) translateY(-10px); }
          60% { opacity: 0.8; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.5) translateY(-20px); }
        }
        @keyframes gentleGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Dussehra ──
function Dussehra() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-red-600 to-orange-500 opacity-60" />
      {/* Ravan burning effect */}
      {[20, 50, 80].map((l, i) => (
        <div
          key={i}
          className="absolute text-3xl sm:text-4xl"
          style={{
            left: `${l}%`,
            bottom: "10%",
            animation: `fireRise 3s ease-in-out ${i * 0.8}s infinite`,
          }}
        >
          🔥
        </div>
      ))}
      {/* Bow and arrow */}
      <div className="absolute top-[10%] left-[8%] text-4xl sm:text-5xl opacity-25 rotate-[-20deg]">
        🏹
      </div>
      {/* Victory text */}
      <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
        <p className="text-base sm:text-xl font-bold text-center" style={{
          background: "linear-gradient(135deg, #ea580c, #dc2626)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "'Space Grotesk', sans-serif",
          animation: "gentleGlow2 3s ease-in-out infinite",
        }}>
          🏹 Happy Dussehra 🏹
        </p>
      </div>
      <style>{`
        @keyframes fireRise {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-20px) scale(1.3); opacity: 0.9; }
        }
        @keyframes gentleGlow2 {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Holi ──
function Holi() {
  const colors = ["#e11d48", "#7c3aed", "#2563eb", "#16a34a", "#f59e0b", "#ec4899", "#06b6d4"];
  const splats = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      color: colors[i % colors.length],
      size: 20 + Math.random() * 60,
      delay: Math.random() * 6,
      duration: 4 + Math.random() * 4,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {splats.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            opacity: 0,
            animation: `colorSplash ${s.duration}s ease-in-out ${s.delay}s infinite`,
            filter: "blur(8px)",
          }}
        />
      ))}
      {/* Happy Holi text */}
      <div className="absolute top-[3%] left-1/2 -translate-x-1/2">
        <p className="text-lg sm:text-2xl font-bold text-center" style={{
          background: "linear-gradient(135deg, #e11d48, #7c3aed, #2563eb, #16a34a, #f59e0b)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          🎨 Happy Holi 🎨
        </p>
      </div>
      <style>{`
        @keyframes colorSplash {
          0% { opacity: 0; transform: scale(0.3); }
          30% { opacity: 0.15; transform: scale(1); }
          70% { opacity: 0.1; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(0.5); }
        }
      `}</style>
    </div>
  );
}

// ── Main Overlay ──
export default function FestivalOverlay() {
  const theme = useActiveTheme();
  if (theme === "none") return null;
  
  switch (theme) {
    case "christmas": return <Snowfall />;
    case "republic_day": return <RepublicDay />;
    case "eid": return <Eid />;
    case "diwali": return <Diwali />;
    case "dussehra": return <Dussehra />;
    case "holi": return <Holi />;
    default: return null;
  }
}

export { useActiveTheme };
