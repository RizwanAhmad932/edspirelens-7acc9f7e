import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Extract YouTube video ID from various URL formats
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

// Fetch YouTube transcript using the innertube API
async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  try {
    // Step 1: Get the video page to extract necessary data
    const videoPageResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }
    );

    if (!videoPageResponse.ok) {
      throw new Error(`Failed to fetch video page: ${videoPageResponse.status}`);
    }

    const html = await videoPageResponse.text();

    // Extract captions data from the page
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) {
      // Try alternative: use timedtext API directly
      console.log("No captions found in page, trying timedtext API...");
      return await fetchTimedText(videoId);
    }

    const captionTracks = JSON.parse(captionMatch[1]);
    // Prefer English captions
    const enTrack = captionTracks.find((t: any) =>
      t.languageCode === "en" || t.vssId?.includes(".en")
    ) || captionTracks[0];

    if (!enTrack?.baseUrl) {
      return await fetchTimedText(videoId);
    }

    // Fetch the actual caption XML
    const captionUrl = enTrack.baseUrl.replace(/\\u0026/g, "&");
    const captionResponse = await fetch(captionUrl);
    if (!captionResponse.ok) {
      throw new Error("Failed to fetch captions");
    }

    const captionXml = await captionResponse.text();
    return parseTranscriptXml(captionXml);
  } catch (error) {
    console.error("Transcript fetch error:", error);
    // Fallback: try timedtext API
    return await fetchTimedText(videoId);
  }
}

// Fallback: use YouTube's timedtext API
async function fetchTimedText(videoId: string): Promise<string> {
  const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok || response.headers.get("content-length") === "0") {
    // Try auto-generated captions
    const autoUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=srv3`;
    const autoResponse = await fetch(autoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!autoResponse.ok) {
      throw new Error("No captions available for this video. The video may not have English subtitles.");
    }

    const xml = await autoResponse.text();
    if (!xml || xml.trim().length < 50) {
      throw new Error("No captions available for this video.");
    }
    return parseTranscriptXml(xml);
  }

  const xml = await response.text();
  if (!xml || xml.trim().length < 50) {
    throw new Error("No captions available for this video.");
  }
  return parseTranscriptXml(xml);
}

// Parse XML transcript into plain text
function parseTranscriptXml(xml: string): string {
  const segments: string[] = [];
  // Match <text> elements - handles both srv3 and srv1 formats
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    let text = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, "") // Remove any nested tags
      .trim();
    if (text) segments.push(text);
  }

  if (segments.length === 0) {
    throw new Error("Could not parse transcript from captions.");
  }

  return segments.join(" ");
}

// Get video title from YouTube
async function getVideoTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.title) return data.title;
    }
  } catch (e) {
    console.error("Failed to get video title:", e);
  }
  return "YouTube Video";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { videoUrl, action } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "analyze") {
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        return new Response(
          JSON.stringify({ error: "Invalid YouTube URL. Please paste a valid YouTube video link." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch title first, then try transcript (transcript may fail for live/private videos)
      const videoTitle = await getVideoTitle(videoId);
      let transcript: string | null = null;
      try {
        transcript = await fetchYouTubeTranscript(videoId);
        console.log(`Fetched transcript for "${videoTitle}" (${transcript.length} chars)`);
      } catch (e) {
        console.warn(`No captions for "${videoTitle}", using title-based analysis:`, e instanceof Error ? e.message : e);
      }

      const hasTranscript = transcript && transcript.length > 50;

      // Generate summary using AI with real transcript
      const summaryResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content:
                  "You are an educational assistant. You analyze video transcripts and provide structured insights. Be thorough and accurate.",
              },
              {
                role: "user",
                content: hasTranscript
                  ? `Analyze this YouTube video transcript and provide a detailed JSON response with the following structure:
{
  "summary": ["bullet point 1", "bullet point 2", ...],
  "transcript": [{"timestamp": "0:00", "seconds": 0, "text": "segment text"}, ...],
  "duration": "estimated duration like 8:30"
}

Important instructions:
- Provide 6-10 concise but informative summary bullet points covering ALL key topics
- Break the transcript into meaningful segments (10-20 segments) with approximate timestamps
- Each transcript segment should be 1-3 sentences of coherent content
- The duration should be estimated from the content length

Video title: ${videoTitle}

Transcript:
${transcript!.substring(0, 15000)}`
                  : `This YouTube video titled "${videoTitle}" does not have captions available. Based on the title alone, generate an educational analysis with:
{
  "summary": ["bullet point 1", "bullet point 2", ...],
  "transcript": [{"timestamp": "0:00", "seconds": 0, "text": "segment text"}, ...],
  "duration": "unknown"
}

Important instructions:
- Provide 3-5 summary bullet points about what the video likely covers based on its title
- Create a single transcript segment noting that captions were unavailable
- Set duration to "unknown"`,
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "return_analysis",
                  description: "Return the structured analysis of the video transcript",
                  parameters: {
                    type: "object",
                    properties: {
                      summary: { type: "array", items: { type: "string" } },
                      transcript: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            timestamp: { type: "string" },
                            seconds: { type: "number" },
                            text: { type: "string" },
                          },
                          required: ["timestamp", "seconds", "text"],
                          additionalProperties: false,
                        },
                      },
                      duration: { type: "string" },
                    },
                    required: ["summary", "transcript", "duration"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "return_analysis" } },
          }),
        }
      );

      if (!summaryResponse.ok) {
        const status = summaryResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Credits required. Please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await summaryResponse.text();
        console.error("AI gateway error:", status, errText);
        throw new Error(`AI gateway error: ${status}`);
      }

      const summaryData = await summaryResponse.json();
      let analysis;

      const toolCall = summaryData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        analysis = JSON.parse(toolCall.function.arguments);
      } else {
        const content = summaryData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse AI response");
        }
      }

      // Use real video title
      analysis.title = videoTitle;

      // Save to database
      const { data: saved, error: saveError } = await supabase
        .from("video_analyses")
        .insert({
          video_url: videoUrl,
          video_title: analysis.title,
          duration: analysis.duration,
          summary: analysis.summary,
          transcript: analysis.transcript,
        })
        .select()
        .single();

      if (saveError) {
        console.error("Save error:", saveError);
      }

      return new Response(
        JSON.stringify({ ...analysis, id: saved?.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "generate-quiz") {
      const transcriptText = body.transcript;
      if (!transcriptText) {
        return new Response(
          JSON.stringify({ error: "No transcript provided for quiz generation" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const quizResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: "You are a quiz generator for educational content. Create questions that test genuine understanding of the video content.",
              },
              {
                role: "user",
                content: `Generate a 5-question multiple-choice quiz based on this video transcript. Each question should:
- Test understanding of key concepts mentioned in the video
- Have 4 answer options
- Have exactly one correct answer
- Cover different topics from the video

Transcript:
${transcriptText.substring(0, 10000)}`,
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "return_quiz",
                  description: "Return the quiz questions",
                  parameters: {
                    type: "object",
                    properties: {
                      questions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            question: { type: "string" },
                            options: { type: "array", items: { type: "string" } },
                            correctIndex: { type: "number" },
                          },
                          required: ["id", "question", "options", "correctIndex"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["questions"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "return_quiz" } },
          }),
        }
      );

      if (!quizResponse.ok) {
        const status = quizResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Credits required." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI error: ${quizResponse.status}`);
      }

      const quizData = await quizResponse.json();
      let quiz;
      const toolCall = quizData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        quiz = JSON.parse(toolCall.function.arguments);
      } else {
        const content = quizData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        quiz = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [] };
      }

      return new Response(
        JSON.stringify(quiz),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
