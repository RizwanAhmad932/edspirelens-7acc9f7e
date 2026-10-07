import { useState } from "react";
import { Check, Eye, Loader2, Palette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FESTIVAL_THEMES, getFestivalTheme, type ThemeName } from "@/lib/festivalThemes";
import { FestivalBannerContent } from "@/components/FestivalBanner";
import { useFestivalTheme } from "@/hooks/use-festival-theme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function FestivalThemePanel() {
  const { theme, refresh } = useFestivalTheme();
  const [selected, setSelected] = useState<ThemeName>(theme);
  const [saving, setSaving] = useState(false);
  const activate = async (name: ThemeName) => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc("activate_theme", { _theme_name: name });
      if (error) throw error;
      await refresh();
      setSelected(name);
      toast.success(name === "none" ? "Original appearance restored" : `${getFestivalTheme(name).label} is now live`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not apply theme"); }
    finally { setSaving(false); }
  };
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-lg font-bold"><Palette className="h-5 w-5 text-primary" /> Festival studio</h3>
      <span className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-success" /> Live: {getFestivalTheme(theme).label}</span>
    </div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {FESTIVAL_THEMES.map(festival => <Button key={festival.name} variant="outline" aria-pressed={selected === festival.name} aria-label={`Preview ${festival.label}`} onClick={() => setSelected(festival.name)} className={`festival-choice h-auto flex-col items-stretch gap-0 overflow-hidden p-0 whitespace-normal text-left ${selected === festival.name ? "ring-2 ring-primary" : ""}`}>
        {festival.art ? <img src={festival.art} alt="" loading="lazy" width={512} height={512} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-muted text-4xl text-muted-foreground"><RotateCcw className="h-8 w-8" /></div>}
        <span className="flex w-full items-center justify-between gap-1 p-3 text-sm">{festival.label}{theme === festival.name && <Check className="h-4 w-4 shrink-0 text-success" />}</span>
      </Button>)}
    </div>
    <div className="flex items-center gap-2 text-sm font-medium"><Eye className="h-4 w-4 text-primary" /> Preview · {getFestivalTheme(selected).label}</div>
    <div data-festival={selected === "none" ? undefined : selected} className="festival-preview overflow-hidden rounded-lg border border-border bg-background text-foreground">
      {selected !== "none" && <FestivalBannerContent theme={selected} />}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div><h4 className="font-bold">Your next chapter</h4><p className="mt-1 text-sm text-muted-foreground">Notes · Flashcards · Past papers</p></div>
        <Button tabIndex={-1} className="pointer-events-none">Continue learning</Button>
      </div>
    </div>
    <div className="flex flex-wrap gap-3">
      <Button disabled={saving || selected === theme} onClick={() => activate(selected)}>{saving ? <Loader2 className="animate-spin" /> : <Check />} {selected === "none" ? "Restore original" : "Apply across app"}</Button>
      {theme !== "none" && <Button variant="outline" disabled={saving} onClick={() => activate("none")}><RotateCcw /> Turn off theme</Button>}
    </div>
  </div>;
}