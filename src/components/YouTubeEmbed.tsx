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

const YouTubeEmbed = ({ videoUrl, videoTitle }: YouTubeEmbedProps) => {
  const videoId = extractVideoId(videoUrl);

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
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title={videoTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};

export default YouTubeEmbed;
