import { Play } from "lucide-react";

interface SimulatedOverlayProps {
  videoTitle: string;
}

const SimulatedOverlay = ({ videoTitle }: SimulatedOverlayProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="relative rounded-2xl overflow-hidden bg-primary shadow-elevated aspect-video">
        {/* Simulated video player */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gradient-primary opacity-90">
          <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-4 backdrop-blur-sm">
            <Play className="h-7 w-7 text-primary-foreground ml-1" />
          </div>
          <p className="text-primary-foreground font-display font-semibold text-lg">{videoTitle}</p>
          <p className="text-primary-foreground/60 text-sm mt-1">Simulated Video Player</p>
        </div>

        {/* Fake progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground/10">
          <div className="h-full w-1/3 bg-accent rounded-r-full" />
        </div>

        {/* Fake controls */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-primary-foreground/50 text-xs">
          <span>2:45</span>
          <span>8:30</span>
        </div>
      </div>
    </div>
  );
};

export default SimulatedOverlay;
