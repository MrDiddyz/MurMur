import { computeArchiveAnalytics } from "@/lib/archive-analytics";
import { getArchiveFilters, getCreatedAtBounds } from "@/lib/archive-filters";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { JobRow } from "@/lib/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filters = getArchiveFilters(url);
  const bounds = getCreatedAtBounds(filters);

  let query = supabaseAdmin
    .from("jobs")
    .select("id,kind,status,payload,result,error,created_at,started_at,finished_at");

  if (filters.kind) query = query.eq("kind", filters.kind);
  if (filters.status) query = query.eq("status", filters.status);
  if (bounds.from) query = query.gte("created_at", bounds.from);
  if (bounds.to) query = query.lte("created_at", bounds.to);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(2000);

  if (error) {
    return Response.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  const analytics = computeArchiveAnalytics((data ?? []) as JobRow[]);

  return Response.json({
    ok: true,
    filters,
    analytics,
  });
}
