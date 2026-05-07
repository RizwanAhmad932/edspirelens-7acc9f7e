import { useState } from "react";
import { Loader2, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInfographic } from "@/lib/mockData";
import { toast } from "sonner";

interface Props {
  chapterTitle: string;
  summary: string[];
}

const InfographicPanel = ({ chapterTitle, summary }: Props) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const url = await generateInfographic(chapterTitle, summary);
      setImageUrl(url);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate infographic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider">Infographic</h3>
        {imageUrl && (
          <a href={imageUrl} download={`${chapterTitle}.png`} className="text-xs text-accent flex items-center gap-1">
            <Download className="h-3 w-3" /> Save
          </a>
        )}
      </div>

      {!imageUrl && !loading && (
        <div className="text-center py-6 space-y-3">
          <p className="text-xs text-muted-foreground">
            AI will create a colorful chapter infographic poster.
          </p>
          <Button size="sm" onClick={handleGenerate} className="gap-2 gradient-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Generate Infographic
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-10 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-xs text-muted-foreground">Painting your infographic…</p>
        </div>
      )}

      {imageUrl && (
        <div className="rounded-xl overflow-hidden border border-border bg-card">
          <img src={imageUrl} alt={`${chapterTitle} infographic`} className="w-full h-auto" />
        </div>
      )}

      {imageUrl && (
        <Button variant="outline" size="sm" onClick={handleGenerate} className="w-full">
          Regenerate
        </Button>
      )}
    </div>
  );
};

export default InfographicPanel;