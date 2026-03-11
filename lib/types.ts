export type JobKind = "research" | "summarize" | "council_vote";
export type JobStatus = "queued" | "running" | "done" | "failed";

export interface JobRow {
  id: string;
  kind: JobKind;
  payload: Record<string, unknown>;
  status: JobStatus;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}
