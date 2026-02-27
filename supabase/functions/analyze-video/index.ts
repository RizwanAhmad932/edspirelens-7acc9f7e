import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchYouTubeTranscriptTimed(videoId: string): Promise<TimedSegment[]> {
  try {
    const videoPageResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );
    if (!videoPageResponse.ok) throw new Error(`Failed to fetch video page: ${videoPageResponse.status}`);
    const html = await videoPageResponse.text();
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) return await fetchTimedTextTimed(videoId);
    const captionTracks = JSON.parse(captionMatch[1]);
    const enTrack = captionTracks.find((t: any) => t.languageCode === "en" || t.vssId?.includes(".en")) || captionTracks[0];
    if (!enTrack?.baseUrl) return await fetchTimedTextTimed(videoId);
    const captionUrl = enTrack.baseUrl.replace(/\\u0026/g, "&");
    const captionResponse = await fetch(captionUrl);
    if (!captionResponse.ok) throw new Error("Failed to fetch captions");
    return parseTranscriptXmlTimed(await captionResponse.text());
  } catch (error) {
    console.error("Transcript fetch error:", error);
    return await fetchTimedTextTimed(videoId);
  }
}

async function fetchTimedTextTimed(videoId: string): Promise<TimedSegment[]> {
  const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok || response.headers.get("content-length") === "0") {
    const autoUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=srv3`;
    const autoResponse = await fetch(autoUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!autoResponse.ok) throw new Error("No captions available for this video.");
    const xml = await autoResponse.text();
    if (!xml || xml.trim().length < 50) throw new Error("No captions available for this video.");
    return parseTranscriptXmlTimed(xml);
  }
  const xml = await response.text();
  if (!xml || xml.trim().length < 50) throw new Error("No captions available for this video.");
  return parseTranscriptXmlTimed(xml);
}

interface TimedSegment {
  start: number;
  text: string;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseTranscriptXml(xml: string): string {
  const segments = parseTranscriptXmlTimed(xml);
  return segments.map(s => s.text).join(" ");
}

function parseTranscriptXmlTimed(xml: string): TimedSegment[] {
  const segments: TimedSegment[] = [];
  const textRegex = /<text[^>]*start="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    let text = match[2].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]+>/g, "").trim();
    if (text) segments.push({ start, text });
  }
  if (segments.length === 0) throw new Error("Could not parse transcript from captions.");
  return segments;
}

async function getVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (response.ok) {
      const data = await response.json();
      if (data.title) return data.title;
    }
  } catch (e) { console.error("Failed to get video title:", e); }
  return "YouTube Video";
}

function aiCall(apiKey: string, messages: any[], tools?: any[], toolChoice?: any) {
  const body: any = { model: "google/gemini-3-flash-preview", messages };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function handleAIError(response: Response) {
  if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (response.status === 402) return new Response(JSON.stringify({ error: "Credits required. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  return null;
}

function parseToolResponse(data: any): any {
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall) return JSON.parse(toolCall.function.arguments);
  const content = data.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  throw new Error("Could not parse AI response");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { videoUrl, action } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    }

    if (action === "analyze") {
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        return new Response(JSON.stringify({ error: "Invalid YouTube URL." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const videoTitle = await getVideoTitle(videoId);
      let timedSegments: TimedSegment[] = [];
      try { timedSegments = await fetchYouTubeTranscriptTimed(videoId); } catch (e) {
        console.warn(`No captions for "${videoTitle}":`, e instanceof Error ? e.message : e);
      }

      const hasTranscript = timedSegments.length > 5;

      // Build a timestamped transcript string so the AI sees the chronological order
      let timestampedTranscript = "";
      if (hasTranscript) {
        // Group small segments into ~30s chunks for readability
        const chunks: { timestamp: string; seconds: number; text: string }[] = [];
        let currentChunk = { timestamp: formatTimestamp(timedSegments[0].start), seconds: Math.floor(timedSegments[0].start), texts: [timedSegments[0].text] };
        for (let i = 1; i < timedSegments.length; i++) {
          const seg = timedSegments[i];
          if (seg.start - timedSegments[currentChunk.seconds > 0 ? i - 1 : 0].start > 30 || currentChunk.texts.join(" ").length > 300) {
            chunks.push({ timestamp: currentChunk.timestamp, seconds: currentChunk.seconds, text: currentChunk.texts.join(" ") });
            currentChunk = { timestamp: formatTimestamp(seg.start), seconds: Math.floor(seg.start), texts: [seg.text] };
          } else {
            currentChunk.texts.push(seg.text);
          }
        }
        chunks.push({ timestamp: currentChunk.timestamp, seconds: currentChunk.seconds, text: currentChunk.texts.join(" ") });
        timestampedTranscript = chunks.map(c => `[${c.timestamp}] ${c.text}`).join("\n");
      }

      const summaryResponse = await aiCall(
        LOVABLE_API_KEY,
        [
          { role: "system", content: `You are an expert CBSE/NCERT educational assistant. When analyzing video transcripts:
1. FOLLOW THE CHRONOLOGICAL ORDER of the video — notes and summary MUST match the sequence topics appear in the lecture
2. Use the EXACT timestamps provided in the transcript (format [M:SS]) — do NOT invent or change timestamps
3. Generate COMPLETE chapter-level notes covering every concept, definition, formula, derivation, example, and exception
4. For Science/Chemistry: electronic configurations, properties, trends, exceptions, reactions, industrial applications
5. For Math: formulas, theorems, proofs, worked examples
6. Summary points must follow the video's order of presentation
7. Notes must follow the video's order — first topic discussed = first notes` },
          {
            role: "user",
            content: hasTranscript
              ? `Analyze this TIMESTAMPED video transcript. The timestamps are REAL — use them exactly as given.

CRITICAL RULES:
- Summary points MUST follow the chronological order of the video
- Notes MUST follow the chronological order of the video  
- Transcript segments: use the EXACT timestamps from the input below — do NOT make up timestamps
- Each note should reference which part of the video it covers

Return:
1. "summary" - 10-20 points in VIDEO ORDER covering all key topics
2. "notes" - 20-40 DETAILED study notes in VIDEO ORDER. Each note = complete paragraph (3-6 sentences) about ONE concept.
3. "transcript" - Use the real timestamps from below. Group into 15-30 meaningful segments.
4. "duration" - Estimated from the last timestamp

Video title: ${videoTitle}

Timestamped transcript:
${timestampedTranscript.substring(0, 25000)}`
              : `Video titled "${videoTitle}" has no captions. Based on the title, generate comprehensive CBSE-level notes:
1. "summary" - 5-10 points about the topic based on CBSE syllabus
2. "notes" - 5-10 detailed textbook-style notes covering the topic as per CBSE curriculum
3. "transcript" - Single segment noting captions unavailable
4. "duration" - "unknown"`,
          },
        ],
        [{
          type: "function",
          function: {
            name: "return_analysis",
            description: "Return the structured analysis",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "array", items: { type: "string" } },
                notes: { type: "array", items: { type: "string" } },
                transcript: { type: "array", items: { type: "object", properties: { timestamp: { type: "string" }, seconds: { type: "number" }, text: { type: "string" } }, required: ["timestamp", "seconds", "text"], additionalProperties: false } },
                duration: { type: "string" },
              },
              required: ["summary", "notes", "transcript", "duration"],
              additionalProperties: false,
            },
          },
        }],
        { type: "function", function: { name: "return_analysis" } }
      );

      if (!summaryResponse.ok) {
        const errResp = handleAIError(summaryResponse);
        if (errResp) return errResp;
        throw new Error(`AI gateway error: ${summaryResponse.status}`);
      }

      const analysis = parseToolResponse(await summaryResponse.json());
      analysis.title = videoTitle;

      const { data: saved, error: saveError } = await supabase
        .from("video_analyses")
        .insert({
          video_url: videoUrl,
          video_title: analysis.title,
          duration: analysis.duration,
          summary: analysis.summary,
          notes: analysis.notes,
          transcript: analysis.transcript,
          user_id: userId,
        })
        .select()
        .single();

      if (saveError) console.error("Save error:", saveError);

      return new Response(JSON.stringify({ ...analysis, id: saved?.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "generate-quiz") {
      const transcriptText = body.transcript;
      if (!transcriptText) return new Response(JSON.stringify({ error: "No transcript provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const quizResponse = await aiCall(
        LOVABLE_API_KEY,
        [
          { role: "system", content: "You are a quiz generator. Extract ALL questions that the teacher asks, solves, or discusses in the video. Also create additional comprehension questions. There is NO limit on question count — extract every single question." },
          {
            role: "user",
            content: `Extract ALL questions from this video transcript. Include:
1. Every question the teacher explicitly asks students
2. Every problem/example the teacher solves
3. Every concept-check or discussion question
4. Additional comprehension questions covering remaining topics

Each question should have 4 options with exactly one correct answer. Do NOT limit to 5 questions — include ALL questions found.

Transcript:
${transcriptText.substring(0, 15000)}`,
          },
        ],
        [{
          type: "function",
          function: {
            name: "return_quiz",
            description: "Return all quiz questions",
            parameters: {
              type: "object",
              properties: {
                questions: { type: "array", items: { type: "object", properties: { id: { type: "string" }, question: { type: "string" }, options: { type: "array", items: { type: "string" } }, correctIndex: { type: "number" } }, required: ["id", "question", "options", "correctIndex"], additionalProperties: false } },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        }],
        { type: "function", function: { name: "return_quiz" } }
      );

      if (!quizResponse.ok) {
        const errResp = handleAIError(quizResponse);
        if (errResp) return errResp;
        throw new Error(`AI error: ${quizResponse.status}`);
      }

      const quiz = parseToolResponse(await quizResponse.json());
      return new Response(JSON.stringify(quiz), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "generate-flashcards") {
      const transcriptText = body.transcript;
      if (!transcriptText) return new Response(JSON.stringify({ error: "No transcript provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const fcResponse = await aiCall(
        LOVABLE_API_KEY,
        [
          { role: "system", content: "Generate study flashcards from educational video content. Cover all key concepts, definitions, formulas, and important facts." },
          {
            role: "user",
            content: `Generate 10-20 study flashcards from this video transcript. Each card should have a "front" (question/term) and "back" (answer/definition). Cover all important concepts.

Transcript:
${transcriptText.substring(0, 10000)}`,
          },
        ],
        [{
          type: "function",
          function: {
            name: "return_flashcards",
            description: "Return flashcards",
            parameters: {
              type: "object",
              properties: {
                flashcards: { type: "array", items: { type: "object", properties: { front: { type: "string" }, back: { type: "string" } }, required: ["front", "back"], additionalProperties: false } },
              },
              required: ["flashcards"],
              additionalProperties: false,
            },
          },
        }],
        { type: "function", function: { name: "return_flashcards" } }
      );

      if (!fcResponse.ok) {
        const errResp = handleAIError(fcResponse);
        if (errResp) return errResp;
        throw new Error(`AI error: ${fcResponse.status}`);
      }

      const fc = parseToolResponse(await fcResponse.json());
      return new Response(JSON.stringify(fc), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "chat") {
      const { messages, videoTitle: title, transcript: transcriptText } = body;

      const chatResponse = await aiCall(LOVABLE_API_KEY, [
        {
          role: "system",
          content: `You are an AI tutor helping a student understand a video titled "${title}". Use the transcript context below to answer questions accurately and thoroughly. If the answer isn't in the transcript, say so.

Video transcript context:
${transcriptText || "No transcript available."}`,
        },
        ...messages,
      ]);

      if (!chatResponse.ok) {
        const errResp = handleAIError(chatResponse);
        if (errResp) return errResp;
        throw new Error(`AI error: ${chatResponse.status}`);
      }

      const chatData = await chatResponse.json();
      const reply = chatData.choices?.[0]?.message?.content || "I couldn't generate a response.";
      return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
