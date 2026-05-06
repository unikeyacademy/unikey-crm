import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hermes-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface FlagPayload {
  student_id: string;
  flag_level: "red" | "yellow" | "green";
  category: string;
  reason: string;
  details?: Record<string, unknown>;
  expires_at?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Authenticate Hermes via shared token
  const expected = Deno.env.get("HERMES_INGEST_TOKEN");
  const provided = req.headers.get("x-hermes-token") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { flags?: FlagPayload[] } | FlagPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const flags: FlagPayload[] = Array.isArray((body as any).flags)
    ? (body as any).flags
    : [body as FlagPayload];

  // Validate
  const validLevels = new Set(["red", "yellow", "green"]);
  for (const f of flags) {
    if (!f?.student_id || !f?.flag_level || !f?.category || !f?.reason) {
      return new Response(
        JSON.stringify({ error: "Each flag requires student_id, flag_level, category, reason" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!validLevels.has(f.flag_level)) {
      return new Response(
        JSON.stringify({ error: `Invalid flag_level: ${f.flag_level}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const rows = flags.map((f) => ({
    student_id: f.student_id,
    flag_level: f.flag_level,
    category: f.category,
    reason: f.reason,
    details: f.details ?? {},
    source: "hermes",
    expires_at: f.expires_at ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("student_flags")
    .upsert(rows, { onConflict: "student_id,category,source" })
    .select();

  if (error) {
    console.error("Upsert failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, count: data?.length ?? 0, flags: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
