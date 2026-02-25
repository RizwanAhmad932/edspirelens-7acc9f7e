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
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            placeholder="Paste a YouTube URL or video link..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-11 pr-4 h-14 text-base rounded-xl border-2 border-border bg-card shadow-card focus:border-accent focus:ring-accent/20 transition-all"
          />
        </div>
        <Button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="h-14 px-8 rounded-xl gradient-primary text-primary-foreground font-semibold text-base shadow-elevated hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Analyze
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default VideoInput;
