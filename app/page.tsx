import { JobKind, JobRow, JobStatus, TimeRange } from "@/lib/types";

type PageSearchParams = {
  [key: string]: string | string[] | undefined;
};

type AnalyticsResponse = {
  analytics: {
    totalJobs: number;
    successRate: number;
    failureRate: number;
    averageProcessingMs: number;
    jobsByType: Record<JobKind, number>;
    jobsByDay: Array<{ label: string; count: number }>;
    jobsByWeek: Array<{ label: string; count: number }>;
    commonErrors: Array<{ label: string; count: number }>;
    failureRateByType: Record<JobKind, { total: number; failed: number; failureRate: number }>;
    retryNeededPatterns: Array<{ label: string; count: number }>;
    throughputOverTime: Array<{ label: string; count: number }>;
    peakHours: Array<{ label: string; count: number }>;
    completionTimeTrends: Array<{ day: string; avgProcessingMs: number }>;
  };
};

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function getActiveFilters(params: PageSearchParams) {
  return {
    kind: normalizeParam(params.kind) ?? "all",
    status: normalizeParam(params.status) ?? "all",
    range: (normalizeParam(params.range) as TimeRange | "all" | undefined) ?? "30d",
    from: normalizeParam(params.from) ?? "",
    to: normalizeParam(params.to) ?? "",
  };
}

function toQuery(filters: {
  kind: string;
  status: string;
  range: string;
  from: string;
  to: string;
}): string {
  const query = new URLSearchParams();

  if (filters.kind && filters.kind !== "all") query.set("kind", filters.kind);
  if (filters.status && filters.status !== "all") query.set("status", filters.status);
  if (filters.range) query.set("range", filters.range);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);

  return query.toString();
}

async function getJobs(queryString: string): Promise<JobRow[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/jobs?${queryString}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch jobs");
  }

  const data = await res.json();
  return data.jobs ?? [];
}

async function getAnalytics(queryString: string): Promise<AnalyticsResponse["analytics"]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/jobs/analytics?${queryString}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch archive analytics");
  }

  const data = (await res.json()) as AnalyticsResponse;
  return data.analytics;
}

function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const filters = getActiveFilters(params);
  const queryString = toQuery(filters);

  const [jobs, analytics] = await Promise.all([
    getJobs(queryString),
    getAnalytics(queryString),
  ]);
  const maxThroughput = analytics.throughputOverTime.reduce(
    (max, entry) => Math.max(max, entry.count),
    1
  );

  return (
    <main style={{ padding: 24, display: "grid", gap: 20 }}>
      <div>
        <h1>MurMur Jobs</h1>
        <p>Queue-ready job list from Supabase.</p>
      </div>

      <form
        action="/api/jobs"
        method="post"
        style={{
          display: "grid",
          gap: 12,
          maxWidth: 720,
          padding: 16,
          border: "1px solid #2a2a35",
          borderRadius: 12,
          background: "#12121a",
        }}
      >
        <label>
          <div>Kind</div>
          <select
            name="kind"
            defaultValue="research"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          >
            <option value="research">research</option>
            <option value="summarize">summarize</option>
            <option value="council_vote">council_vote</option>
          </select>
        </label>

        <label>
          <div>Prompt</div>
          <textarea
            name="prompt"
            rows={5}
            defaultValue="What should MurMur build next?"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: 12,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
          }}
        >
          Create Job
        </button>
      </form>

      <form
        action="/"
        method="get"
        style={{
          display: "grid",
          gap: 12,
          maxWidth: 920,
          padding: 16,
          border: "1px solid #2a2a35",
          borderRadius: 12,
          background: "#101018",
        }}
      >
        <h2 style={{ margin: 0 }}>Archive Filters</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
          <label>
            <div>Kind</div>
            <select name="kind" defaultValue={filters.kind} style={{ width: "100%", padding: 10 }}>
              <option value="all">all</option>
              <option value="research">research</option>
              <option value="summarize">summarize</option>
              <option value="council_vote">council_vote</option>
            </select>
          </label>
          <label>
            <div>Status</div>
            <select name="status" defaultValue={filters.status} style={{ width: "100%", padding: 10 }}>
              <option value="all">all</option>
              <option value="queued">queued</option>
              <option value="running">running</option>
              <option value="done">done</option>
              <option value="failed">failed</option>
            </select>
          </label>
          <label>
            <div>Range</div>
            <select name="range" defaultValue={filters.range} style={{ width: "100%", padding: 10 }}>
              <option value="7d">last 7d</option>
              <option value="30d">last 30d</option>
              <option value="90d">last 90d</option>
              <option value="all">all</option>
            </select>
          </label>
          <label>
            <div>From</div>
            <input type="date" name="from" defaultValue={filters.from} style={{ width: "100%", padding: 10 }} />
          </label>
          <label>
            <div>To</div>
            <input type="date" name="to" defaultValue={filters.to} style={{ width: "100%", padding: 10 }} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" style={{ padding: 12, borderRadius: 10, border: "none", cursor: "pointer" }}>
            Apply Filters
          </button>
          <a href="/" style={{ padding: 12, borderRadius: 10, border: "1px solid #555", textDecoration: "none" }}>
            Reset
          </a>
        </div>
      </form>

      <section
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        }}
      >
        <div style={{ border: "1px solid #2a2a35", borderRadius: 12, padding: 16, background: "#12121a" }}>
          <div>Total Jobs</div>
          <h2>{analytics.totalJobs}</h2>
        </div>
        <div style={{ border: "1px solid #2a2a35", borderRadius: 12, padding: 16, background: "#12121a" }}>
          <div>Success Rate</div>
          <h2>{analytics.successRate}%</h2>
        </div>
        <div style={{ border: "1px solid #2a2a35", borderRadius: 12, padding: 16, background: "#12121a" }}>
          <div>Failure Rate</div>
          <h2>{analytics.failureRate}%</h2>
        </div>
        <div style={{ border: "1px solid #2a2a35", borderRadius: 12, padding: 16, background: "#12121a" }}>
          <div>Avg Processing Time</div>
          <h2>{formatDuration(analytics.averageProcessingMs)}</h2>
        </div>
      </section>

      <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <div style={{ border: "1px solid #2a2a35", borderRadius: 12, padding: 16, background: "#12121a" }}>
          <h3>Jobs by Type</h3>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
            {JSON.stringify(analytics.jobsByType, null, 2)}
          </pre>
          <h3>Failure Rate by Type</h3>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
            {JSON.stringify(analytics.failureRateByType, null, 2)}
          </pre>
        </div>
        <div style={{ border: "1px solid #2a2a35", borderRadius: 12, padding: 16, background: "#12121a" }}>
          <h3>Throughput Over Time</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {analytics.throughputOverTime.map((entry) => (
              <div key={entry.label} style={{ display: "grid", gridTemplateColumns: "90px 1fr 40px", gap: 8 }}>
                <code>{entry.label}</code>
                <div style={{ background: "#2a2a35", borderRadius: 8, overflow: "hidden", height: 20 }}>
                  <div
                    style={{
                      width: `${Math.max(4, (entry.count / maxThroughput) * 100)}%`,
                      background: "#6c8cff",
                      height: "100%",
                    }}
                  />
                </div>
                <strong>{entry.count}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <div style={{ border: "1px solid #2a2a35", borderRadius: 12, padding: 16, background: "#12121a" }}>
          <h3>Most Common Errors</h3>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
            {JSON.stringify(analytics.commonErrors, null, 2)}
          </pre>
        </div>
        <div style={{ border: "1px solid #2a2a35", borderRadius: 12, padding: 16, background: "#12121a" }}>
          <h3>Retry-needed Patterns</h3>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
            {JSON.stringify(analytics.retryNeededPatterns, null, 2)}
          </pre>
        </div>
        <div style={{ border: "1px solid #2a2a35", borderRadius: 12, padding: 16, background: "#12121a" }}>
          <h3>Peak Hours (UTC)</h3>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
            {JSON.stringify(analytics.peakHours, null, 2)}
          </pre>
          <h3>Completion Time Trend</h3>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
            {JSON.stringify(analytics.completionTimeTrends, null, 2)}
          </pre>
        </div>
      </section>

      <div style={{ display: "grid", gap: 12 }}>
        {jobs.map((job) => (
          <div
            key={job.id}
            style={{
              border: "1px solid #2a2a35",
              borderRadius: 12,
              padding: 16,
              background: "#12121a",
            }}
          >
            <div><strong>ID:</strong> {job.id}</div>
            <div><strong>Kind:</strong> {job.kind}</div>
            <div><strong>Status:</strong> {job.status}</div>
            <div>
              <strong>Created:</strong>{" "}
              {new Date(job.created_at).toLocaleString()}
            </div>

            {job.payload && (
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
                {JSON.stringify(job.payload, null, 2)}
              </pre>
            )}

            {job.result && (
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
                {JSON.stringify(job.result, null, 2)}
              </pre>
            )}

            {job.error && (
              <div style={{ color: "#ff8f8f", marginTop: 8 }}>{job.error}</div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
