import { useState } from "react";
import { Search, Loader2, Play, Eye, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Video {
  videoId: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  published: string;
  thumbnail: string;
  url: string;
}

interface Props {
  onSelect: (url: string) => void;
}

const YouTubeSearch = ({ onSelect }: Props) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setVideos([]);
    try {
      const { data, error } = await supabase.functions.invoke("youtube-search", { body: { query: q } });
      if (error) throw error;
      if (!data?.videos?.length) {
        toast.info("No videos found. Try a different query.");
      }
      setVideos(data?.videos ?? []);
    } catch (err: any) {
      toast.error(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search lectures..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={200}
            className="pl-10 h-11 rounded-xl border border-foreground/10 bg-background/60"
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()} className="h-11 px-4 rounded-xl gradient-accent text-accent-foreground font-semibold shrink-0 disabled:opacity-40">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      {videos.length > 0 && (
        <div className="space-y-2 animate-fade-in max-h-[22rem] overflow-y-auto pr-1">
          <p className="font-mono-hud text-[10px] uppercase tracking-widest text-muted-foreground px-1">
            Top {videos.length} results — tap to analyze
          </p>
          {videos.map((v) => (
            <button
              key={v.videoId}
              onClick={() => onSelect(v.url)}
              className="w-full flex gap-3 p-2 rounded-2xl bg-background/50 border border-foreground/10 hover:border-accent/50 transition-all text-left group"
            >
              <div className="relative shrink-0 w-24 aspect-video rounded-lg overflow-hidden bg-muted">
                <img src={v.thumbnail} alt={v.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                {v.duration && (
                  <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 text-white px-1.5 py-0.5 rounded">
                    {v.duration}
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                  <Play className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <h3 className="font-semibold text-xs text-foreground line-clamp-2 leading-snug group-hover:text-accent transition-colors">{v.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{v.channel}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  {v.views && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{v.views}</span>}
                  {v.published && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{v.published}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default YouTubeSearch;