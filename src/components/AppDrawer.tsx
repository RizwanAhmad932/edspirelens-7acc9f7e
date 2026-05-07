import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LayoutGrid, ExternalLink, Loader2 } from "lucide-react";

interface Shortcut {
  id: string;
  name: string;
  icon_url: string;
  app_url: string;
  category: string;
  sort_order: number;
}

const AppDrawer = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("app_shortcuts")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [open]);

  const grouped = items.reduce<Record<string, Shortcut[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="fixed bottom-4 right-4 z-30 h-14 w-14 rounded-full gradient-primary text-primary-foreground shadow-lens flex items-center justify-center hover:scale-105 active:scale-95 transition-transform animate-scale-in safe-bottom"
          aria-label="Open app drawer"
        >
          <LayoutGrid className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-accent" /> Apps
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">No apps available yet.</p>
        ) : (
          <div className="mt-4 space-y-6 pb-8">
            {Object.entries(grouped).map(([cat, list]) => (
              <section key={cat}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {cat}
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {list.map((s) => (
                    <a
                      key={s.id}
                      href={s.app_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-secondary/60 transition-colors"
                    >
                      <div className="h-14 w-14 rounded-2xl bg-card border border-border overflow-hidden shadow-sm flex items-center justify-center">
                        {s.icon_url ? (
                          <img src={s.icon_url} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <ExternalLink className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-[11px] text-foreground text-center line-clamp-2 leading-tight">
                        {s.name}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AppDrawer;