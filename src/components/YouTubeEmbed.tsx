import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface YouTubeEmbedHandle {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
}

interface YouTubeEmbedProps {
  videoUrl: string;
  videoTitle: string;
  onTimeUpdate?: (seconds: number) => void;
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

const YouTubeEmbed = forwardRef<YouTubeEmbedHandle, YouTubeEmbedProps>(({ videoUrl, videoTitle, onTimeUpdate }, ref) => {
  const videoId = extractVideoId(videoUrl);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentTimeRef = useRef(0);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      win.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
      win.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [Math.max(0, seconds), true] }), "*");
      iframeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    getCurrentTime: () => currentTimeRef.current,
  }), []);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    // Subscribe to YT iframe API events
    const onLoad = () => {
      win.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*");
      win.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }), "*");
    };
    const iframe = iframeRef.current;
    iframe?.addEventListener("load", onLoad);

    const onMsg = (e: MessageEvent) => {
      if (typeof e.data !== "string") return;
      try {
        const data = JSON.parse(e.data);
        const t = data?.info?.currentTime;
        if (typeof t === "number") {
          currentTimeRef.current = t;
          onTimeUpdate?.(t);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener("message", onMsg);

    // Poll for current time
    const poll = window.setInterval(() => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "getCurrentTime", args: [] }), "*"
      );
    }, 1500);

    return () => {
      iframe?.removeEventListener("load", onLoad);
      window.removeEventListener("message", onMsg);
      window.clearInterval(poll);
    };
  }, [videoId, onTimeUpdate]);

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
