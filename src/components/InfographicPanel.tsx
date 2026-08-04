import { useState } from "react";
import { Loader2, Sparkles, Download, Image as ImageIcon, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInfographic } from "@/lib/mockData";
import { PanelHeader } from "@/components/panel/PanelFrame";
import { toast } from "sonner";

interface Props {
  chapterTitle: string;
  summary: string[];
}

const InfographicPanel = ({ chapterTitle, summary }: Props) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      setImageUrl(await generateInfographic(chapterTitle, summary));
    } catch (e: any) {
      toast.error(e.message || "Failed to generate infographic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <PanelHeader
        label="Infographic"
        icon={<ImageIcon className="h-3.5 w-3.5" />}
        actions={
          imageUrl && (
            <a
              href={imageUrl}
              download={`${chapterTitle}-infographic.png`}
              className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 text-accent font-mono-hud uppercase tracking-[0.14em] text-[9px] px-2 py-1 hover:bg-accent/20 transition-colors"
            >
              <Download className="h-3 w-3" /> Save
            </a>
          )
        }
      />

      {!imageUrl && !loading && (
        <div className="text-center py-6 space-y-3">
          <p className="text-xs text-muted-foreground">
            A print-quality revision poster of this chapter, generated from your notes.
          </p>
          <Button size="sm" onClick={handleGenerate} className="gap-2 gradient-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Generate infographic
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-12 gap-2 rounded-2xl border border-accent/20 bg-accent/[0.04] scan-lines">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-xs text-muted-foreground">Rendering your poster…</p>
        </div>
      )}

      {imageUrl && (
        <>
          <button
            onClick={() => setZoom((z) => !z)}
            className="relative w-full rounded-2xl overflow-hidden border border-accent/25 bg-card scanline"
          >
            <img src={imageUrl} alt={`${chapterTitle} infographic`} className="w-full h-auto" />
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur px-2 py-1 text-[9px] font-mono-hud uppercase text-accent">
              <Maximize2 className="h-3 w-3" /> View
            </span>
          </button>
          <Button variant="outline" size="sm" onClick={handleGenerate} className="w-full">
            Regenerate
          </Button>
        </>
      )}

      {zoom && imageUrl && (
        <div
          className="fixed inset-0 z-[80] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoom(false)}
        >
          <img src={imageUrl} alt={`${chapterTitle} infographic full`} className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </div>
  );
};

export default InfographicPanel;
