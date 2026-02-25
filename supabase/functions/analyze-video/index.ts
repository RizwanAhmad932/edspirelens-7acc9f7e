import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Mock transcript for demo (in production you'd use a real transcript API)
    const transcript = `Welcome to this comprehensive introduction to machine learning fundamentals.
Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data.
There are three main types of machine learning: supervised learning, unsupervised learning, and reinforcement learning.
In supervised learning, we train models using labeled data, where we know the correct output for each input.
Common supervised learning algorithms include linear regression, decision trees, and neural networks.
Unsupervised learning deals with unlabeled data, where the algorithm tries to find patterns on its own.
Clustering and dimensionality reduction are popular unsupervised learning techniques.
Reinforcement learning involves an agent that learns to make decisions by interacting with an environment.
Deep learning, a subset of machine learning, uses neural networks with many layers to learn complex patterns.
Today, machine learning powers applications from recommendation systems to autonomous vehicles and natural language processing.`;

    if (action === "analyze") {
      // Generate summary using AI
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
                  "You are an educational assistant. You analyze video transcripts and provide structured insights.",
              },
              {
                role: "user",
                content: `Analyze this video transcript and provide a JSON response with the following structure:
{
  "title": "A descriptive title for the video",
  "summary": ["bullet point 1", "bullet point 2", ...],
  "transcript": [{"timestamp": "0:00", "seconds": 0, "text": "segment text"}, ...],
  "duration": "estimated duration like 8:30"
}

Break the transcript into segments with approximate timestamps. Provide 5-8 concise summary bullet points.

Transcript:
${transcript}`,
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
                      title: { type: "string" },
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
                    required: ["title", "summary", "transcript", "duration"],
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
      
      // Extract from tool call
      const toolCall = summaryData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        analysis = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try to parse from content
        const content = summaryData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse AI response");
        }
      }

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
      const transcriptText = body.transcript || transcript;

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
                content: "You are a quiz generator for educational content.",
              },
              {
                role: "user",
                content: `Generate a 5-question multiple-choice quiz based on this transcript. Each question should test understanding of key concepts.

Transcript:
${transcriptText}`,
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
