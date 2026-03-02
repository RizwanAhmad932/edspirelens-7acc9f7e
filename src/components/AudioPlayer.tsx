import { useState } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioPlayerProps {
  videoUrl: string;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

const AudioPlayer = ({ videoUrl }: AudioPlayerProps) => {
  const [audioMode, setAudioMode] = useState(false);
  const videoId = extractVideoId(videoUrl);

  if (!videoId) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {audioMode ? (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-card animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <Volume2 className="h-5 w-5 text-accent" />
            <span className="text-sm font-semibold text-foreground">Audio Mode</span>
            <Button variant="ghost" size="sm" onClick={() => setAudioMode(false)} className="ml-auto text-xs">
              <VolumeX className="h-3.5 w-3.5 mr-1" /> Back to Video
            </Button>
          </div>
          <div className="rounded-xl overflow-hidden bg-primary" style={{ height: 0 }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              allow="autoplay"
              className="w-full"
              style={{ height: 0 }}
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full w-1/3 rounded-full gradient-accent animate-shimmer" />
            </div>
            <span className="text-[10px] text-muted-foreground">Audio playing in background</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            🎧 The video is playing with screen hidden — you can listen like a podcast. Switch back anytime.
          </p>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAudioMode(true)}
          className="gap-2 rounded-xl"
        >
          <Volume2 className="h-4 w-4" />
          Listen as Audio
        </Button>
      )}
    </div>
  );
};

export default AudioPlayer;
