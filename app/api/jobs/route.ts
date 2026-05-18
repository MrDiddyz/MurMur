import { supabaseAdmin } from "@/lib/supabase-admin";
import { getArchiveFilters, getCreatedAtBounds } from "@/lib/archive-filters";
import { z } from "zod";

const createJobSchema = z.object({
  kind: z.enum(["research", "summarize", "council_vote"]),
  payload: z.record(z.string(), z.unknown()).default({}),
});

function normalizeBody(input: unknown) {
  return createJobSchema.parse(input);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filters = getArchiveFilters(url);
  const bounds = getCreatedAtBounds(filters);

  let query = supabaseAdmin.from("jobs").select("*");

  if (filters.kind) query = query.eq("kind", filters.kind);
  if (filters.status) query = query.eq("status", filters.status);
  if (bounds.from) query = query.gte("created_at", bounds.from);
  if (bounds.to) query = query.lte("created_at", bounds.to);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return Response.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return Response.json({
    ok: true,
    jobs: data,
  });
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let rawBody: unknown;

    if (contentType.includes("application/json")) {
      rawBody = await req.json();
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await req.formData();
      rawBody = {
        kind: String(formData.get("kind") ?? "research"),
        payload: {
          prompt: String(formData.get("prompt") ?? ""),
        },
      };
    } else {
      return Response.json(
        { ok: false, error: "Unsupported content type" },
        { status: 415 }
      );
    }

    const body = normalizeBody(rawBody);

    const { data, error } = await supabaseAdmin
      .from("jobs")
      .insert({
        kind: body.kind,
        payload: body.payload,
        status: "queued",
      })
      .select("*")
      .single();

    if (error) {
      return Response.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const wantsRedirect =
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data");

    if (wantsRedirect) {
      return Response.redirect(new URL("/", req.url), 303);
    }

    return Response.json(
      {
        ok: true,
        job: data,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid request body";

    return Response.json(
      { ok: false, error: message },
      { status: 400 }
    );
  }
}
