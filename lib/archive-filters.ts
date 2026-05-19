import { ArchiveFilters, JobKind, JobStatus, TimeRange } from "@/lib/types";
import { z } from "zod";

const kindSchema = z.enum(["research", "summarize", "council_vote"]);
const statusSchema = z.enum(["queued", "running", "done", "failed"]);
const rangeSchema = z.enum(["7d", "30d", "90d", "all"]);

const filtersSchema = z.object({
  kind: z.string().optional(),
  status: z.string().optional(),
  range: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

function parseAndNormalizeDateToISO(input: string | undefined): string | undefined {
  if (!input) return undefined;

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function getRangeStart(range: TimeRange): string | undefined {
  if (range === "all") return undefined;

  const now = new Date();
  const next = new Date(now);
  const rangeToDays: Record<Exclude<TimeRange, "all">, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };
  const days = rangeToDays[range];
  next.setUTCDate(next.getUTCDate() - days);
  return next.toISOString();
}

export function getArchiveFilters(url: URL): ArchiveFilters {
  const raw = filtersSchema.parse({
    kind: url.searchParams.get("kind") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    range: url.searchParams.get("range") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });

  const kind = raw.kind && raw.kind !== "all" ? kindSchema.safeParse(raw.kind) : null;
  const status = raw.status && raw.status !== "all" ? statusSchema.safeParse(raw.status) : null;
  const range = raw.range ? rangeSchema.safeParse(raw.range) : null;
  const from = parseAndNormalizeDateToISO(raw.from);
  const to = parseAndNormalizeDateToISO(raw.to);

  return {
    kind: kind?.success ? (kind.data as JobKind) : undefined,
    status: status?.success ? (status.data as JobStatus) : undefined,
    range: range?.success ? range.data : "30d",
    from,
    to,
  };
}

export function getCreatedAtBounds(filters: ArchiveFilters): {
  from?: string;
  to?: string;
} {
  const rangeFrom = getRangeStart(filters.range ?? "30d");

  return {
    from: filters.from ?? rangeFrom,
    to: filters.to,
  };
}
