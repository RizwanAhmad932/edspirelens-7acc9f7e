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
          "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
        },
      }
    );
    if (!videoPageResponse.ok) throw new Error(`Failed to fetch video page: ${videoPageResponse.status}`);
    const html = await videoPageResponse.text();
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) return await fetchTimedTextTimed(videoId);
    const captionTracks = JSON.parse(captionMatch[1]);
    
    // Priority: English manual > Hindi manual > English auto > any first track
    const enManual = captionTracks.find((t: any) => t.languageCode === "en" && !t.kind);
    const hiManual = captionTracks.find((t: any) => t.languageCode === "hi" && !t.kind);
    const enAuto = captionTracks.find((t: any) => t.languageCode === "en" && t.kind === "asr");
    const hiAuto = captionTracks.find((t: any) => t.languageCode === "hi" && t.kind === "asr");
    const track = enManual || hiManual || enAuto || hiAuto || captionTracks[0];
    
    if (!track?.baseUrl) return await fetchTimedTextTimed(videoId);
    const captionUrl = track.baseUrl.replace(/\\u0026/g, "&");
    console.log(`Using caption track: lang=${track.languageCode}, kind=${track.kind || "manual"}`);
    const captionResponse = await fetch(captionUrl);
    if (!captionResponse.ok) throw new Error("Failed to fetch captions");
    return parseTranscriptXmlTimed(await captionResponse.text());
  } catch (error) {
    console.error("Transcript fetch error:", error);
    return await fetchTimedTextTimed(videoId);
  }
}

async function fetchTimedTextTimed(videoId: string): Promise<TimedSegment[]> {
  // Try English, then Hindi, then auto-generated variants
  const attempts = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=hi&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=srv3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=hi&kind=asr&fmt=srv3`,
  ];
  for (const url of attempts) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!response.ok) continue;
      const xml = await response.text();
      if (!xml || xml.trim().length < 50) continue;
      const segments = parseTranscriptXmlTimed(xml);
      if (segments.length > 0) {
        console.log(`Fetched timed text from: ${url}`);
        return segments;
      }
    } catch { continue; }
  }
  throw new Error("No captions available for this video.");
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
          { role: "system", content: `You are an expert educational content analyst. Your job is to generate COMPLETE CHAPTER study material based on what the teacher discusses in the video.

CRITICAL RULES:
1. First, identify the EXACT Education Board (CBSE/ICSE/State Board/IB), Class (7-12), Subject, and Chapter from the lecture content and video title
2. Once you identify the chapter, provide COMPLETE and THOROUGH notes covering the ENTIRE chapter as per that board's official syllabus textbook
3. Do NOT just summarize what the teacher said — provide full textbook-quality notes for the identified chapter
4. Include ALL formulas, definitions, key concepts, diagrams descriptions, important reactions, theorems, and derivations from that chapter
5. Add exam tips, frequently asked questions, and important points to remember for board exams
6. FOLLOW THE CHRONOLOGICAL ORDER of the textbook chapter, not the video
7. Use the EXACT timestamps from the transcript for the summary/transcript sections
8. Prefix the first summary point with the detected info, e.g. "CBSE Class 10 Science — Chapter 5: Periodic Classification of Elements"
9. Do NOT mention the teacher's name, channel name, or anything about the video creator
10. Notes should be written as if from an official textbook — formal, comprehensive, exam-ready` },
          {
            role: "user",
            content: hasTranscript
              ? `Analyze this TIMESTAMPED video transcript and identify the Board, Class, Subject, and Chapter.

INSTRUCTIONS:
1. IDENTIFY: Detect the Education Board (CBSE/ICSE/State Board/IB), Class, Subject, and exact Chapter from the content
2. Once identified, provide COMPLETE CHAPTER NOTES — not just what the teacher said, but the FULL chapter content as per that board's official textbook/syllabus
3. Do NOT mention teacher name, channel, or video creator — write as a textbook
4. Use timestamps from the transcript for the summary section

Return:
1. "summary" - 15-25 points covering the FULL chapter outline with key topics, starting with "[Board] Class [X] [Subject] — Chapter [N]: [Name]"
2. "notes" - 30-50 COMPREHENSIVE textbook-quality notes covering the ENTIRE chapter. Each note = complete paragraph (4-8 sentences). Include ALL formulas, definitions, reactions, theorems, derivations, examples, diagrams descriptions, exam tips, and important points from the chapter. Add "📝 Exam Tip:" and "⚠️ Important:" markers where relevant.
3. "transcript" - Use the real timestamps. Group into 15-30 segments.
4. "duration" - Estimated from last timestamp

Video title: ${videoTitle}

Timestamped transcript:
${timestampedTranscript.substring(0, 25000)}`
              : `Video titled "${videoTitle}" has no captions available. Based on the title:
1. Identify the Board, Class, Subject, and Chapter
2. Provide COMPLETE chapter notes as per that board's textbook

Return:
1. "summary" - 10-15 full chapter summary points, starting with "[Board] Class [X] [Subject] — Chapter [N]: [Name]"
2. "notes" - 20-30 comprehensive textbook notes for the full chapter with formulas, definitions, exam tips
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
          { role: "system", content: "You are a CBSE quiz generator. Generate questions ONLY from topics the teacher discusses in this specific video. Do NOT add questions from unrelated NCERT chapters or sections not covered in the video." },
          {
            role: "user",
            content: `Extract ALL questions STRICTLY from this video transcript. Include:
1. Every question the teacher explicitly asks students
2. Every problem/example the teacher solves
3. Every concept-check or discussion question
4. Additional comprehension questions — but ONLY about topics covered in THIS video

Do NOT create questions about NCERT topics not discussed by the teacher.
Each question should have 4 options with exactly one correct answer.

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
          { role: "system", content: "Generate study flashcards ONLY from the specific topics the teacher covers in this video. Do NOT include flashcards about NCERT content from chapters or sections not discussed in the video." },
          {
            role: "user",
            content: `Generate 10-20 study flashcards STRICTLY from this video transcript. Each card should have a "front" (question/term) and "back" (answer/definition). Only cover concepts, formulas, and facts the teacher actually discusses — no unrelated NCERT content.

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
