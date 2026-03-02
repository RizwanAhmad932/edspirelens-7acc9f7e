import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const { action } = await req.json();

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
