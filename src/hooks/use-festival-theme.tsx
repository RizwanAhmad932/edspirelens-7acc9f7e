import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeTheme, type ThemeName } from "@/lib/festivalThemes";

const ThemeContext = createContext<{ theme: ThemeName; refresh: () => Promise<void> }>({ theme: "none", refresh: async () => {} });
export function FestivalThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>("none");
  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from("app_themes").select("theme_name").eq("is_active", true).limit(1).maybeSingle();
    if (!error) setTheme(normalizeTheme(data?.theme_name));
  }, []);
  useEffect(() => {
    void refresh();
    const channel = supabase.channel("global-festival-theme").on("postgres_changes", { event: "*", schema: "public", table: "app_themes" }, () => { void refresh(); }).subscribe();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 30000);
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { window.setTimeout(() => { void refresh(); }, 0); });
    return () => { void supabase.removeChannel(channel); clearInterval(interval); window.removeEventListener("focus", onFocus); subscription.unsubscribe(); };
  }, [refresh]);
  useEffect(() => {
    if (theme === "none") delete document.documentElement.dataset.festival;
    else document.documentElement.dataset.festival = theme;
    return () => { delete document.documentElement.dataset.festival; };
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, refresh }}>{children}</ThemeContext.Provider>;
}
export const useFestivalTheme = () => useContext(ThemeContext);