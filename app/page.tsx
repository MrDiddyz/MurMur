import { JobRow } from "@/lib/types";

async function getJobs(): Promise<JobRow[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/jobs`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch jobs");
  }

  const data = await res.json();
  return data.jobs ?? [];
}

export default async function JobsPage() {
  const jobs = await getJobs();

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
