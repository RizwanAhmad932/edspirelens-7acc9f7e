import { useState } from "react";
import { Search, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TranscriptSegment, searchTopic } from "@/lib/mockData";

interface TopicSearchProps {
  transcript: TranscriptSegment[];
}

const TopicSearch = ({ transcript }: TopicSearchProps) => {
  const [query, setQuery] = useState("");
  const results = query.length > 1 ? searchTopic(query, transcript) : [];

  return (
    <div className="space-y-3">
      <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
        Find a Topic
      </h3>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="e.g. neural networks, clustering..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-10 rounded-lg bg-secondary/50 border-border text-sm"
        />
      </div>
      {query.length > 1 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No mentions found for "{query}"</p>
          ) : (
            results.map((seg, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/70 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1 text-xs font-mono text-accent shrink-0 mt-0.5">
                  <Clock className="h-3 w-3" />
                  {seg.timestamp}
                </span>
                <p className="text-xs text-foreground/80 leading-relaxed">{seg.text}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TopicSearch;
