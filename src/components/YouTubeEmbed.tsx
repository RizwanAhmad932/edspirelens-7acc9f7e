import { forwardRef, useImperativeHandle, useRef } from "react";

export interface YouTubeEmbedHandle {
  seekTo: (seconds: number) => void;
}

interface YouTubeEmbedProps {
  videoUrl: string;
  videoTitle: string;
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

const YouTubeEmbed = forwardRef<YouTubeEmbedHandle, YouTubeEmbedProps>(({ videoUrl, videoTitle }, ref) => {
  const videoId = extractVideoId(videoUrl);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      win.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
      win.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [Math.max(0, seconds), true] }), "*");
      iframeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  }), []);

  if (!videoId) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="rounded-2xl overflow-hidden bg-muted aspect-video flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Unable to embed video</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="relative rounded-2xl overflow-hidden shadow-elevated aspect-video bg-primary">
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1`}
          title={videoTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
});

YouTubeEmbed.displayName = "YouTubeEmbed";

export default YouTubeEmbed;
