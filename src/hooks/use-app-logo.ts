import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import edspireLogo from "@/assets/edspire-logo.png";

let cache: { light?: string | null; dark?: string | null } | null = null;
const subscribers = new Set<() => void>();

async function fetchLogos() {
  const { data } = await supabase
    .from("app_settings")
    .select("logo_light_url, logo_dark_url")
    .eq("id", "global")
    .maybeSingle();
  cache = { light: data?.logo_light_url || null, dark: data?.logo_dark_url || null };
  subscribers.forEach((cb) => cb());
}

/** Returns current app logo url respecting current theme. Falls back to bundled logo. */
export function useAppLogo() {
  const [, force] = useState(0);
  useEffect(() => {
    const cb = () => force((n) => n + 1);
    subscribers.add(cb);
    if (!cache) fetchLogos();
    return () => { subscribers.delete(cb); };
  }, []);

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const url = (isDark ? cache?.dark : cache?.light) || cache?.light || cache?.dark || edspireLogo;
  return url;
}

export function refreshAppLogos() { return fetchLogos(); }