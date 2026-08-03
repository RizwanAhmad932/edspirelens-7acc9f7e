import { useState } from "react";
import { Play, Link, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface VideoInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

const VideoInput = ({ onSubmit, isLoading }: VideoInputProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto px-1 sm:px-0">
      <div className="relative group">
        <div className="absolute -inset-[3px] rounded-[1.4rem] gradient-accent blur-md opacity-20 group-focus-within:opacity-50 transition-opacity duration-500 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-[1.25rem] border border-foreground/10 bg-card/80 backdrop-blur-xl p-2 shadow-card">
          <div className="relative flex-1">
            <Link className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="url"
              placeholder="Paste a YouTube URL to analyze..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10 sm:pl-11 pr-4 h-11 sm:h-12 text-sm sm:text-base rounded-xl border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="h-11 sm:h-12 px-6 sm:px-8 rounded-xl bg-accent text-accent-foreground font-semibold text-sm sm:text-base shadow-glow hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default VideoInput;
