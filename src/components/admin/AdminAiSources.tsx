import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { KeyRound, Loader2, Trash2, Plug, Plus, Link2, FileUp, Database } from "lucide-react";

const PROVIDERS = [
  { id: "openai", name: "OpenAI", hint: "gpt-4o-mini" },
  { id: "gemini", name: "Google Gemini", hint: "gemini-2.5-flash" },
  { id: "anthropic", name: "Anthropic Claude", hint: "claude-3-5-haiku-latest" },
  { id: "openrouter", name: "OpenRouter", hint: "openai/gpt-4o-mini" },
  { id: "firecrawl", name: "Firecrawl (web search)", hint: "" },
];
const EXAMS = ["CBSE Board", "ICSE Board", "State Board", "JEE Main", "JEE Advanced", "NEET", "UPSC"];

async function call(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-data", { body });
  if (error) {
    let msg = error.message;
    try { msg = JSON.parse(await (error as any).context.text()).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

async function pdfToText(file: File): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, 60); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    parts.push(content.items.map((it: any) => it.str).join(" "));
  }
  return parts.join("\n");
}

export function AiKeysPanel() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [priority, setPriority] = useState("10");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const load = async () => {
    try { setKeys((await call({ action: "list-keys" })).keys || []); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await call({ action: "save-key", provider, apiKey, model, priority: Number(priority) });
      setApiKey(""); setModel("");
      toast.success("Key saved");
      load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const test = async (id: string) => {
    setTesting(id);
    try {
      const r = await call({ action: "test-key", id });
      r.ok ? toast.success(r.message) : toast.error(r.message);
      load();
    } catch (e: any) { toast.error(e.message); } finally { setTesting(null); }
  };

  const hint = PROVIDERS.find((p) => p.id === provider)?.hint;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-5">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-accent" /> Backup AI keys
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Used only when the built-in AI is busy or out of credits. Tried in order of priority (lowest number first). Keys are stored securely and never shown again.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-border bg-secondary/30">
        <div className="space-y-1">
          <Label className="text-xs">Service</Label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">API key</Label>
          <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste key" autoComplete="off" />
        </div>
        {provider !== "firecrawl" && (
          <div className="space-y-1">
            <Label className="text-xs">Model (optional)</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder={hint} />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Priority</Label>
          <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
        </div>
        <Button onClick={save} disabled={saving || apiKey.length < 8} className="sm:col-span-2 gradient-primary text-primary-foreground gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add key
        </Button>
      </div>

      {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : keys.length === 0 ? (
        <p className="text-sm text-muted-foreground">No backup keys yet.</p>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20">
              <div className="flex-1 min-w-[160px]">
                <p className="text-sm font-medium text-foreground">{PROVIDERS.find((p) => p.id === k.provider)?.name}</p>
                <p className="text-xs text-muted-foreground">{k.masked} · {k.model || "default model"} · priority {k.priority}</p>
                {k.last_status && (
                  <p className={`text-xs ${k.last_status === "ok" ? "text-primary" : "text-destructive"}`}>
                    {k.last_status === "ok" ? "Working" : `Error: ${k.last_error || ""}`}
                  </p>
                )}
              </div>
              <Switch checked={k.enabled} onCheckedChange={async (v) => { await call({ action: "update-key", id: k.id, enabled: v }); load(); }} />
              <Button size="sm" variant="outline" onClick={() => test(k.id)} disabled={testing === k.id} className="gap-1">
                {testing === k.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plug className="h-3 w-3" />} Test
              </Button>
              <Button size="sm" variant="ghost" onClick={async () => { await call({ action: "delete-key", id: k.id }); load(); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PyqSourcesPanel() {
  const [sources, setSources] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [exam, setExam] = useState("CBSE Board");
  const [chapter, setChapter] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { const r = await call({ action: "list-sources" }); setSources(r.sources || []); setTotal(r.totalQuestions || 0); }
    catch (e: any) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const ingest = async (kind: "link" | "pdf") => {
    if (!chapter.trim()) return toast.error("Enter the chapter name");
    setBusy(true);
    try {
      let text = "";
      if (kind === "pdf") {
        if (!file) throw new Error("Choose a PDF");
        text = await pdfToText(file);
        if (text.trim().length < 100) throw new Error("This PDF has no readable text (it may be a scanned image)");
      }
      const r = await call({ action: "ingest-source", exam, chapterTitle: chapter, kind, url: kind === "link" ? url : "", fileName: file?.name || "", text });
      toast.success(`${r.questionsFound} real questions saved`);
      setUrl(""); setFile(null);
      load();
    } catch (e: any) { toast.error(e.message); load(); } finally { setBusy(false); }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-5">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Database className="h-5 w-5 text-accent" /> Past-paper sources
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Add a link or upload a question paper PDF. The AI copies the real questions into the app, and students see them first. {total} questions saved so far.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-border bg-secondary/30">
        <div className="space-y-1">
          <Label className="text-xs">Exam</Label>
          <select value={exam} onChange={(e) => setExam(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            {EXAMS.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Chapter (must match the video's chapter name)</Label>
          <Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. Electrostatics" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Link to a paper or web page</Label>
          <div className="flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            <Button onClick={() => ingest("link")} disabled={busy || !url} variant="outline" className="gap-1 shrink-0">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Read link
            </Button>
          </div>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Or upload a PDF</Label>
          <div className="flex gap-2">
            <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <Button onClick={() => ingest("pdf")} disabled={busy || !file} variant="outline" className="gap-1 shrink-0">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Read PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {sources.map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{s.file_name || s.url}</p>
              <p className="text-xs text-muted-foreground">
                {s.exam} · {s.chapter_title} · {s.status === "done" ? `${s.questions_found} questions` : s.status === "error" ? `Failed: ${s.error}` : "Reading…"}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={async () => { await call({ action: "delete-source", id: s.id }); load(); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
