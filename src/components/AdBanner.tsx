import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  ad_type: string;
  media_url: string;
  media_type: string;
  link_url: string | null;
  placement: string;
}

interface AdBannerProps {
  placement: "home" | "between_content";
}

const AdBanner = ({ placement }: AdBannerProps) => {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    loadAd();
  }, [placement]);

  const loadAd = async () => {
    const { data } = await supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .eq("placement", placement)
      .eq("ad_type", "banner")
      .limit(1);
    if (data && data.length > 0) {
      setAd(data[0] as Ad);
      trackEvent(data[0].id, "view");
    }
  };

  const trackEvent = async (adId: string, eventType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("ad_events").insert({ ad_id: adId, user_id: user.id, event_type: eventType });
  };

  const handleClick = () => {
    if (!ad) return;
    trackEvent(ad.id, "click");
    if (ad.link_url) window.open(ad.link_url, "_blank", "noopener");
  };

  if (!ad) return null;

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div
        onClick={handleClick}
        className="relative rounded-2xl overflow-hidden border border-border shadow-card cursor-pointer hover:shadow-elevated transition-shadow"
      >
        {ad.media_type === "video" ? (
          <video src={ad.media_url} autoPlay muted loop playsInline className="w-full h-auto max-h-32 object-cover" />
        ) : (
          <img src={ad.media_url} alt={ad.title} className="w-full h-auto max-h-32 object-cover" />
        )}
        <span className="absolute top-1 right-1 text-[9px] bg-background/70 text-muted-foreground px-1.5 py-0.5 rounded">Ad</span>
      </div>
    </div>
  );
};

export default AdBanner;

export const AdPopup = () => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => loadAd(), 10000); // show after 10s
    return () => clearTimeout(timer);
  }, []);

  const loadAd = async () => {
    const { data } = await supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .eq("ad_type", "popup")
      .limit(1);
    if (data && data.length > 0) {
      setAd(data[0] as Ad);
      setVisible(true);
      trackEvent(data[0].id, "view");
    }
  };

  const trackEvent = async (adId: string, eventType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("ad_events").insert({ ad_id: adId, user_id: user.id, event_type: eventType });
  };

  const handleClick = () => {
    if (!ad) return;
    trackEvent(ad.id, "click");
    if (ad.link_url) window.open(ad.link_url, "_blank", "noopener");
  };

  if (!visible || !ad) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setVisible(false)} />
      <div className="relative z-10 max-w-sm w-full mx-4 rounded-2xl overflow-hidden bg-card border border-border shadow-lens animate-scale-in">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-2 right-2 z-20 bg-background/80 rounded-full p-1.5 hover:bg-background transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div onClick={handleClick} className="cursor-pointer">
          {ad.media_type === "video" ? (
            <video src={ad.media_url} autoPlay muted loop playsInline className="w-full h-auto" />
          ) : (
            <img src={ad.media_url} alt={ad.title} className="w-full h-auto" />
          )}
        </div>
      </div>
    </div>
  );
};
