// Admin-managed backup AI keys + web search keys.
// Keys live in public.ai_provider_keys, readable only by the service role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type Provider = "openai" | "gemini" | "anthropic" | "openrouter" | "firecrawl";

export const DEFAULT_MODELS: Record<Provider, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash",
  anthropic: "claude-3-5-haiku-latest",
  openrouter: "openai/gpt-4o-mini",
  firecrawl: "",
};

const COMPAT_URLS: Partial<Record<Provider, string>> = {
  openai: "https://api.openai.com/v1/chat/completions",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
};

export function adminClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

interface KeyRow { id: string; provider: Provider; api_key: string; model: string }

async function loadKeys(providers: Provider[]): Promise<KeyRow[]> {
  try {
    const { data } = await adminClient()
      .from("ai_provider_keys")
      .select("id, provider, api_key, model")
      .eq("enabled", true)
      .in("provider", providers)
      .order("priority", { ascending: true });
    return (data || []) as KeyRow[];
  } catch (e) {
    console.error("loadKeys failed", e);
    return [];
  }
}

async function mark(id: string, ok: boolean, error?: string) {
  try {
    await adminClient().from("ai_provider_keys").update({
      last_status: ok ? "ok" : "error",
      last_error: ok ? null : (error || "").slice(0, 300),
      last_used_at: new Date().toISOString(),
    }).eq("id", id);
  } catch { /* ignore */ }
}

function textOf(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((c) => c?.text || "").filter(Boolean).join("\n");
  return String(content ?? "");
}

/** Call one provider. Returns a chat-completions-shaped payload, or throws. */
export async function callProvider(
  provider: Provider, apiKey: string, model: string,
  messages: any[], tools?: any[], toolChoice?: any,
): Promise<any> {
  const useModel = model || DEFAULT_MODELS[provider];
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 90_000);
  try {
    if (provider === "anthropic") {
      const system = messages.filter((m) => m.role === "system").map((m) => textOf(m.content)).join("\n\n");
      const msgs = messages.filter((m) => m.role !== "system").map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: textOf(m.content),
      }));
      const body: any = { model: useModel, max_tokens: 8000, messages: msgs };
      if (system) body.system = system;
      if (tools?.length) {
        body.tools = tools.map((tl) => ({
          name: tl.function.name,
          description: tl.function.description || "",
          input_schema: tl.function.parameters,
        }));
        if (toolChoice?.function?.name) body.tool_choice = { type: "tool", name: toolChoice.function.name };
      }
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!resp.ok) throw new Error(`anthropic ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
      const data = await resp.json();
      const toolUse = (data.content || []).find((c: any) => c.type === "tool_use");
      if (toolUse) {
        return { choices: [{ message: { tool_calls: [{ function: { name: toolUse.name, arguments: JSON.stringify(toolUse.input) } }] } }] };
      }
      const text = (data.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
      return { choices: [{ message: { content: text } }] };
    }

    const url = COMPAT_URLS[provider];
    if (!url) throw new Error(`Unsupported provider ${provider}`);
    const body: any = { model: useModel, messages };
    if (tools?.length) body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;
    const resp = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!resp.ok) throw new Error(`${provider} ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
    return await resp.json();
  } finally {
    clearTimeout(t);
  }
}

function usable(p: any) {
  const m = p?.choices?.[0]?.message;
  return !!(m?.tool_calls?.[0]?.function?.arguments || (typeof m?.content === "string" && m.content.trim()));
}

/** Try every enabled admin backup key in priority order. */
export async function callBackupAi(messages: any[], tools?: any[], toolChoice?: any): Promise<any | null> {
  const keys = await loadKeys(["openai", "gemini", "anthropic", "openrouter"]);
  for (const k of keys) {
    try {
      const payload = await callProvider(k.provider, k.api_key, k.model, messages, tools, toolChoice);
      if (usable(payload)) {
        await mark(k.id, true);
        console.log(`Backup AI served by ${k.provider}`);
        return payload;
      }
      await mark(k.id, false, "Empty answer");
    } catch (e) {
      console.error(`Backup ${k.provider} failed`, e);
      await mark(k.id, false, e instanceof Error ? e.message : String(e));
    }
  }
  return null;
}

/* ---------------- Firecrawl web search ---------------- */

export async function getFirecrawlKey(): Promise<string | null> {
  const env = Deno.env.get("FIRECRAWL_API_KEY");
  if (env) return env;
  const keys = await loadKeys(["firecrawl"]);
  return keys[0]?.api_key || null;
}

export async function firecrawlSearch(apiKey: string, query: string, limit = 5) {
  const resp = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit, scrapeOptions: { formats: ["markdown"], onlyMainContent: true } }),
  });
  if (!resp.ok) throw new Error(`firecrawl ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const data = await resp.json();
  const list: any[] = Array.isArray(data?.data) ? data.data : (data?.data?.web || []);
  return list.map((r) => ({
    title: String(r.title || r.metadata?.title || r.url || "").slice(0, 160),
    url: String(r.url || r.metadata?.sourceURL || ""),
    snippet: String(r.description || "").slice(0, 400),
    markdown: String(r.markdown || "").slice(0, 4000),
  })).filter((r) => r.url);
}

export async function firecrawlScrape(apiKey: string, url: string): Promise<string> {
  const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
  });
  if (!resp.ok) throw new Error(`firecrawl ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const data = await resp.json();
  return String(data?.data?.markdown || data?.markdown || "");
}

/* ---------------- Official exam sites ---------------- */

export function officialSites(exam: string): string[] {
  const e = exam.toLowerCase();
  if (e.includes("jee")) return ["jeemain.nta.ac.in", "jeeadv.ac.in", "nta.ac.in"];
  if (e.includes("neet")) return ["neet.nta.nic.in", "nta.ac.in"];
  if (e.includes("upsc")) return ["upsc.gov.in"];
  if (e.includes("cbse")) return ["cbseacademic.nic.in", "cbse.gov.in"];
  if (e.includes("icse")) return ["cisce.org"];
  return [];
}
