import { useFestivalTheme } from "@/hooks/use-festival-theme";
import { getFestivalTheme } from "@/lib/festivalThemes";

export default function FestivalOverlay() {
  const { theme } = useFestivalTheme();
  if (theme === "none") return null;
  const festival = getFestivalTheme(theme);
  return <div className="festival-decorations" aria-hidden="true">
    {Array.from({ length: 6 }, (_, i) => <span key={i} className={`festival-motif festival-motif-${i}`}>{festival.motif}</span>)}
  </div>;
}
