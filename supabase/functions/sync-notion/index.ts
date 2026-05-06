import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const SIGNED_STATUSES = new Set([
  "Drafting",
  "Submitted",
  "Offers Received",
  "Confirmed",
]);

// Helpers to read Notion property values
function getTitle(p: any): string {
  return (p?.title || []).map((t: any) => t.plain_text).join("").trim();
}
function getRich(p: any): string {
  return (p?.rich_text || []).map((t: any) => t.plain_text).join("").trim();
}
function getSelect(p: any): string | null {
  return p?.select?.name ?? null;
}
function getMultiSelect(p: any): string[] {
  return (p?.multi_select || []).map((s: any) => s.name);
}
function getNumber(p: any): number | null {
  return p?.number ?? null;
}
function getEmail(p: any): string | null {
  return p?.email ?? null;
}
function getPhone(p: any): string | null {
  return p?.phone_number ?? null;
}
function getUrl(p: any): string | null {
  return p?.url ?? null;
}
function getCheckbox(p: any): boolean {
  return Boolean(p?.checkbox);
}
function getDate(p: any): string | null {
  return p?.date?.start ?? null;
}
function getStatus(p: any): string | null {
  return p?.status?.name ?? null;
}
function getRelationIds(p: any): string[] {
  return (p?.relation || []).map((r: any) => r.id);
}
function getFormulaString(p: any): string | null {
  if (!p?.formula) return null;
  if (p.formula.type === "string") return p.formula.string;
  if (p.formula.type === "number") return p.formula.number?.toString() ?? null;
  return null;
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

async function notionFetch(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion API ${res.status}: ${text}`);
  }
  return res.json();
}

async function queryAllPages(dbId: string, token: string, filter?: any): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const body: any = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    if (filter) body.filter = filter;
    const data = await notionFetch(`/databases/${dbId}/query`, token, {
      method: "POST",
      body: JSON.stringify(body),
    });
    results.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stats = {
    contacts_seen: 0,
    contacts_signed: 0,
    contacts_matched: 0,
    contacts_updated: 0,
    contacts_skipped_no_match: 0,
    sessions_seen: 0,
    sessions_upserted: 0,
    sessions_skipped_no_student: 0,
    errors: [] as string[],
  };

  try {
    const NOTION_TOKEN = Deno.env.get("NOTION_API_TOKEN");
    const CONTACTS_DB = Deno.env.get("NOTION_CONTACTS_DB_ID");
    const SESSIONS_DB = Deno.env.get("NOTION_SESSION_REPORTS_DB_ID");
    if (!NOTION_TOKEN) throw new Error("NOTION_API_TOKEN not configured");
    if (!CONTACTS_DB) throw new Error("NOTION_CONTACTS_DB_ID not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Debug mode
    const url = new URL(req.url);
    if (url.searchParams.get("debug") === "values") {
      const all = await queryAllPages(CONTACTS_DB, NOTION_TOKEN);
      const counts: Record<string, number> = {};
      let active = 0;
      for (const p of all) {
        const props = p.properties || {};
        if (getCheckbox(props["Active"])) active++;
        const s = getSelect(props["Application Status"]) || "(null)";
        counts[s] = (counts[s] || 0) + 1;
      }
      return new Response(JSON.stringify({ total: all.length, active_count: active, status_counts: counts }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contactPages = await queryAllPages(CONTACTS_DB, NOTION_TOKEN);
    stats.contacts_seen = contactPages.length;

    // Load existing students (id, notion_page_id, lowercased name)
    const { data: students } = await supabase
      .from("students")
      .select("id, notion_page_id, first_name, last_name");

    const byNotionId = new Map<string, string>();
    const byName = new Map<string, string>();
    for (const s of students || []) {
      if (s.notion_page_id) byNotionId.set(s.notion_page_id, s.id);
      const key = `${(s.first_name || "").toLowerCase().trim()} ${(s.last_name || "").toLowerCase().trim()}`.trim();
      if (key) byName.set(key, s.id);
    }

    // Map of notion_page_id → student_id for session matching
    const notionToStudent = new Map<string, string>();

    for (const page of contactPages) {
      try {
        const props = page.properties || {};
        const fullNameRaw = getTitle(props["Name"]);
        if (!fullNameRaw) continue;

        // "Signed" = Active checkbox is true (Application Status is mostly empty in Notion)
        const active = getCheckbox(props["Active"]);
        if (!active) continue;
        stats.contacts_signed++;

        // Clean the name for matching: strip "(...)" and " - parent" segments
        const cleanName = fullNameRaw
          .replace(/\([^)]*\)/g, "")
          .replace(/\s*-\s*.*$/, "")
          .trim();

        // Match by Notion ID first, then by cleaned name
        let studentId = byNotionId.get(page.id);
        if (!studentId) {
          const { first, last } = splitName(cleanName);
          const key = `${first.toLowerCase()} ${last.toLowerCase()}`.trim();
          studentId = byName.get(key);
        }
        if (!studentId) {
          stats.contacts_skipped_no_match++;
          continue;
        }
        stats.contacts_matched++;
        notionToStudent.set(page.id, studentId);

        const { first, last } = splitName(cleanName);
        const yearOfEntry = getNumber(props["Year of Entry"]);
        const applicationCycle = yearOfEntry ? String(yearOfEntry) : null;
        const appStatus = getSelect(props["Application Status"]);

        const update: Record<string, any> = {
          notion_page_id: page.id,
          first_name: first,
          last_name: last,
          email: getEmail(props["Email"]),
          phone: getPhone(props["Number"]),
          current_school: getRich(props["School"]),
          curriculum: getSelect(props["Curriculum"]),
          consultation_programme: getSelect(props["Program"]),
          lead_source: getSelect(props["Referrer"]),
          status: appStatus,
          google_drive_folder_url: getUrl(props["Google Drive Link"]),
          application_cycle: applicationCycle,
          quotation: getNumber(props["Quotation"])?.toString() ?? null,
        };

        // Strip null/empty so we never overwrite Lovable values with blanks
        for (const k of Object.keys(update)) {
          const v = update[k];
          if (v === null || v === undefined || v === "") delete update[k];
        }
        update.notion_page_id = page.id;

        const { error: upErr } = await supabase
          .from("students")
          .update(update)
          .eq("id", studentId);

        if (upErr) {
          stats.errors.push(`contact ${cleanName}: ${upErr.message}`);
        } else {
          stats.contacts_updated++;
        }
      } catch (e) {
        stats.errors.push(`contact page ${page.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // ---------- 2. SESSION REPORTS ----------
    if (SESSIONS_DB) {
      const sessionPages = await queryAllPages(SESSIONS_DB, NOTION_TOKEN);
      stats.sessions_seen = sessionPages.length;

      for (const page of sessionPages) {
        try {
          const props = page.properties || {};
          // Title
          let titleProp: any = null;
          for (const k of Object.keys(props)) {
            if (props[k]?.type === "title") { titleProp = props[k]; break; }
          }
          const title = titleProp ? getTitle(titleProp) : "";

          // Find related contact via relation prop
          let studentId: string | null = null;
          for (const k of Object.keys(props)) {
            if (props[k]?.type === "relation") {
              const ids = getRelationIds(props[k]);
              for (const rid of ids) {
                const sid = notionToStudent.get(rid);
                if (sid) { studentId = sid; break; }
              }
              if (studentId) break;
            }
          }

          if (!studentId) {
            stats.sessions_skipped_no_student++;
            continue;
          }

          const sessionDate =
            getDate(props["Date"]) ||
            getDate(props["Session Date"]) ||
            getDate(props["Meeting Date"]);

          const sessionType =
            getSelect(props["Type"]) ||
            getSelect(props["Session Type"]) ||
            getSelect(props["Nature of Meeting"]) ||
            null;

          const consultantName =
            getRich(props["Consultant"]) ||
            getSelect(props["Consultant"]) ||
            null;

          const summary =
            getRich(props["Summary"]) ||
            getRich(props["Notes"]) ||
            title;

          const row = {
            notion_page_id: page.id,
            student_id: studentId,
            session_date: sessionDate,
            session_type: sessionType,
            consultant_name: consultantName,
            summary: summary || null,
            raw_properties: props,
            notion_url: page.url || null,
            notion_last_edited_at: page.last_edited_time || null,
          };

          const { error: sErr } = await supabase
            .from("notion_session_reports")
            .upsert(row, { onConflict: "notion_page_id" });

          if (sErr) {
            stats.errors.push(`session ${page.id}: ${sErr.message}`);
          } else {
            stats.sessions_upserted++;
          }
        } catch (e) {
          stats.errors.push(`session page ${page.id}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    // ---------- 3. Sync state ----------
    await supabase.from("notion_sync_state").upsert({
      id: "default",
      last_synced_at: new Date().toISOString(),
      last_status: stats.errors.length === 0 ? "ok" : "partial",
      last_error: stats.errors.slice(0, 5).join(" | ") || null,
      stats,
    });

    return new Response(JSON.stringify({ ok: true, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("sync-notion error:", msg);
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      await supabase.from("notion_sync_state").upsert({
        id: "default",
        last_synced_at: new Date().toISOString(),
        last_status: "error",
        last_error: msg,
        stats,
      });
    } catch (_) { /* ignore */ }
    return new Response(JSON.stringify({ ok: false, error: msg, stats }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
