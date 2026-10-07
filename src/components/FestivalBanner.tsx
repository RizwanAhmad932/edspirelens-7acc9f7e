import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFestivalTheme, type ThemeName } from "@/lib/festivalThemes";
import { useFestivalTheme } from "@/hooks/use-festival-theme";

export function FestivalBannerContent({ theme, onDismiss }: { theme: ThemeName; onDismiss?: () => void }) {
  const festival = getFestivalTheme(theme);
  if (theme === "none") return null;
  return <section className="festival-banner" aria-label={`${festival.label} celebration`}>
    <div className="festival-banner-inner">
      <div className="festival-banner-copy">
        <p className="festival-eyebrow">EDSPIRE LENS · CELEBRATES</p>
        <h2>{festival.greeting}</h2>
        <p className="festival-message">{festival.message}</p>
      </div>
      <img src={festival.art} alt="" width={512} height={512} className="festival-banner-art" />
    </div>
    {onDismiss && <Button size="icon" variant="ghost" className="festival-dismiss" onClick={onDismiss} aria-label="Dismiss celebration banner"><X /></Button>}
  </section>;
}
export default function FestivalBanner() {
  const { theme } = useFestivalTheme();
  const [dismissed, setDismissed] = useState<ThemeName | null>(null);
  return theme !== dismissed ? <FestivalBannerContent theme={theme} onDismiss={() => setDismissed(theme)} /> : null;
}