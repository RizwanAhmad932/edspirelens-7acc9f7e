import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callProvider, callBackupAi, getFirecrawlKey, firecrawlScrape, DEFAULT_MODELS, type Provider } from "../_shared/backupAi.ts";

const PROVIDERS: Provider[] = ["openai", "gemini", "anthropic", "openrouter", "firecrawl"];
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeadersRef.h, "Content-Type": "application/json" } });
const corsHeadersRef: { h: Record<string, string> } = { h: {} };

function slugKey(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}
function stripTags(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

async function extractQuestions(text: string, exam: string, chapter: string) {
  const messages = [
    { role: "system", content: `You extract REAL past-year exam questions from ${exam} question papers. Copy each question verbatim from the supplied text. Never invent questions. Only include questions belonging to the chapter "${chapter}" (include all if chapter is "All"). Write a concise marking-scheme model answer with [N Mark] annotations.` },
    { role: "user", content: `PAPER TEXT:\n${text.slice(0, 60000)}` },
  ];
  const tools = [{
    type: "function",
    function: {
      name: "return_questions",
      description: "Return extracted questions",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                year: { type: "string" }, marks: { type: "number" }, question: { type: "string" },
                answer: { type: "string" }, type: { type: "string" }, topic: { type: "string" }, paper: { type: "string" },
              },
              required: ["year", "marks", "question", "answer", "type", "topic", "paper"],
            },
          },
        },
        required: ["questions"],
      },
    },
  }];
  const toolChoice = { type: "function", function: { name: "return_questions" } };
  let payload: any = null;
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (key) {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3.7-flash", messages, tools, tool_choice: toolChoice }),
    });
    if (resp.ok) payload = await resp.json();
    else console.error("gateway extract failed", resp.status, await resp.text());
  }
  if (!payload?.choices?.[0]?.message?.tool_calls) payload = await callBackupAi(messages, tools, toolChoice);
  const args = payload?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("AI could not read this paper");
  return (JSON.parse(args).questions || []) as any[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  corsHeadersRef.h = corsHeaders;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Access denied. Admin role required." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "list-keys") {
      const { data } = await adminClient.from("ai_provider_keys").select("*").order("priority");
      return json({ keys: (data || []).map((k: any) => ({ ...k, api_key: undefined, masked: "••••" + String(k.api_key).slice(-4) })) });
    }
    if (action === "save-key") {
      const { provider, apiKey, model, label, priority } = body;
      if (!PROVIDERS.includes(provider) || typeof apiKey !== "string" || apiKey.trim().length < 8) return json({ error: "Invalid provider or key" }, 400);
      const { error } = await adminClient.from("ai_provider_keys").insert({
        provider, api_key: apiKey.trim(), model: String(model || "").trim().slice(0, 120),
        label: String(label || "").slice(0, 80), priority: Number(priority) || 10,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }
    if (action === "update-key") {
      const patch: any = {};
      if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
      if (body.priority !== undefined) patch.priority = Number(body.priority) || 10;
      if (typeof body.model === "string") patch.model = body.model.trim().slice(0, 120);
      await adminClient.from("ai_provider_keys").update(patch).eq("id", body.id);
      return json({ ok: true });
    }
    if (action === "delete-key") {
      await adminClient.from("ai_provider_keys").delete().eq("id", body.id);
      return json({ ok: true });
    }
    if (action === "test-key") {
      const { data: k } = await adminClient.from("ai_provider_keys").select("*").eq("id", body.id).single();
      if (!k) return json({ error: "Key not found" }, 404);
      let ok = false, message = "";
      try {
        if (k.provider === "firecrawl") {
          const r = await fetch("https://api.firecrawl.dev/v2/search", {
            method: "POST", headers: { Authorization: `Bearer ${k.api_key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ query: "CBSE previous year question paper", limit: 1 }),
          });
          ok = r.ok; message = ok ? "Search works" : `${r.status}: ${(await r.text()).slice(0, 160)}`;
        } else {
          const p = await callProvider(k.provider, k.api_key, k.model, [{ role: "user", content: "Reply with the word OK." }]);
          const text = p?.choices?.[0]?.message?.content || "";
          ok = !!text; message = ok ? `Replied: ${String(text).slice(0, 40)}` : "Empty reply";
        }
      } catch (e) { message = e instanceof Error ? e.message : String(e); }
      await adminClient.from("ai_provider_keys").update({
        last_status: ok ? "ok" : "error", last_error: ok ? null : message.slice(0, 300), last_used_at: new Date().toISOString(),
      }).eq("id", k.id);
      return json({ ok, message, defaultModel: DEFAULT_MODELS[k.provider as Provider] });
    }

    if (action === "list-sources") {
      const [{ data: sources }, { count }] = await Promise.all([
        adminClient.from("pyq_sources").select("*").order("created_at", { ascending: false }).limit(50),
        adminClient.from("pyq_questions").select("*", { count: "exact", head: true }),
      ]);
      return json({ sources: sources || [], totalQuestions: count || 0 });
    }
    if (action === "delete-source") {
      await adminClient.from("pyq_questions").delete().eq("source_id", body.id);
      await adminClient.from("pyq_sources").delete().eq("id", body.id);
      return json({ ok: true });
    }
    if (action === "ingest-source") {
      const exam = String(body.exam || "").trim();
      const chapter = String(body.chapterTitle || "").trim();
      const kind = body.kind === "pdf" ? "pdf" : "link";
      if (!exam || !chapter) return json({ error: "Exam and chapter are required" }, 400);
      const { data: src } = await adminClient.from("pyq_sources").insert({
        exam, chapter_title: chapter, kind, url: String(body.url || ""), file_name: String(body.fileName || ""), status: "processing",
      }).select().single();
      try {
        let text = String(body.text || "");
        if (kind === "link") {
          const url = String(body.url || "");
          if (!/^https?:\/\//.test(url)) throw new Error("Enter a valid link");
          const fc = await getFirecrawlKey();
          if (fc) text = await firecrawlScrape(fc, url);
          if (!text) {
            const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
            const ct = r.headers.get("content-type") || "";
            if (ct.includes("pdf")) throw new Error("This link is a PDF — add a Firecrawl key or upload the PDF file instead");
            text = stripTags(await r.text());
          }
        }
        if (text.trim().length < 100) throw new Error("Could not read any text from this source");
        const qs = await extractQuestions(text, exam, chapter);
        const rows = qs.filter((q) => q?.question).map((q) => ({
          exam, chapter_key: slugKey(chapter), chapter_title: chapter,
          year: String(q.year || ""), marks: Number(q.marks) || 1, question: String(q.question),
          answer: String(q.answer || ""), type: String(q.type || ""), topic: String(q.topic || ""),
          paper: String(q.paper || body.fileName || ""), source_url: String(body.url || ""),
          source_id: src?.id, confidence: 95, verified: true,
        }));
        if (rows.length) await adminClient.from("pyq_questions").upsert(rows, { onConflict: "exam,chapter_key,question", ignoreDuplicates: true });
        // Clear cached AI pages so the new real questions show up first.
        await adminClient.from("pyq_bank").delete().eq("exam", exam).eq("chapter_key", slugKey(chapter));
        await adminClient.from("pyq_sources").update({ status: "done", questions_found: rows.length }).eq("id", src?.id);
        return json({ ok: true, questionsFound: rows.length });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await adminClient.from("pyq_sources").update({ status: "error", error: msg.slice(0, 300) }).eq("id", src?.id);
        return json({ error: msg }, 400);
      }
    }

    if (action === "dashboard") {
      // Fetch login logs
      const { data: loginLogs } = await adminClient
        .from("login_logs")
        .select("*")
        .order("logged_in_at", { ascending: false })
        .limit(50);

      // Fetch all user profiles with full info
      const { data: users } = await adminClient
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // Count total users
      const { count: totalUsers } = await adminClient
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Count today's logins
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayLogins } = await adminClient
        .from("login_logs")
        .select("*", { count: "exact", head: true })
        .gte("logged_in_at", today.toISOString());

      // Count total logins
      const { count: totalLogins } = await adminClient
        .from("login_logs")
        .select("*", { count: "exact", head: true });

      return new Response(JSON.stringify({
        loginLogs: loginLogs || [],
        users: users || [],
        stats: {
          totalUsers: totalUsers || 0,
          todayLogins: todayLogins || 0,
          totalLogins: totalLogins || 0,
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Admin data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
