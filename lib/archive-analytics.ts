import { JobKind, JobRow } from "@/lib/types";

type CountByKey = Record<string, number>;

function increment(target: CountByKey, key: string, value = 1) {
  target[key] = (target[key] ?? 0) + value;
}

function percent(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function getDurationMs(job: JobRow): number | null {
  if (!job.started_at || !job.finished_at) return null;

  const startedAt = new Date(job.started_at).getTime();
  const finishedAt = new Date(job.finished_at).getTime();
  if (Number.isNaN(startedAt) || Number.isNaN(finishedAt) || finishedAt < startedAt) {
    return null;
  }

  return finishedAt - startedAt;
}

function toUtcDay(dateInput: string): string {
  const date = new Date(dateInput);
  return date.toISOString().slice(0, 10);
}

function toUtcWeek(dateInput: string): string {
  const date = new Date(dateInput);
  const firstJan = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((date.getTime() - firstJan.getTime()) / 86400000) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getRetryPattern(error: string): string | null {
  const message = error.toLowerCase();
  if (message.includes("timeout")) return "timeout";
  if (message.includes("rate limit") || message.includes("429")) return "rate_limit";
  if (message.includes("network") || message.includes("econn") || message.includes("fetch")) {
    return "network";
  }
  if (message.includes("unavailable") || message.includes("503")) return "service_unavailable";
  return null;
}

function topEntries(source: CountByKey, limit = 8) {
  return Object.entries(source)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

const allKinds: JobKind[] = ["research", "summarize", "council_vote"];

export function computeArchiveAnalytics(jobs: JobRow[]) {
  const totalJobs = jobs.length;
  const doneCount = jobs.filter((job) => job.status === "done").length;
  const failedJobs = jobs.filter((job) => job.status === "failed");
  const failedCount = failedJobs.length;

  const jobsByType: CountByKey = { research: 0, summarize: 0, council_vote: 0 };
  const jobsByDay: CountByKey = {};
  const jobsByWeek: CountByKey = {};
  const throughputOverTime: CountByKey = {};
  const peakHours: CountByKey = {};
  const errorCounts: CountByKey = {};
  const retryPatternCounts: CountByKey = {};
  const failureByType: Record<JobKind, { total: number; failed: number; failureRate: number }> = {
    research: { total: 0, failed: 0, failureRate: 0 },
    summarize: { total: 0, failed: 0, failureRate: 0 },
    council_vote: { total: 0, failed: 0, failureRate: 0 },
  };
  const completionDurationByDay: Record<string, { sum: number; count: number }> = {};

  let durationSumMs = 0;
  let durationCount = 0;

  for (const job of jobs) {
    increment(jobsByType, job.kind);

    const dayKey = toUtcDay(job.created_at);
    const weekKey = toUtcWeek(job.created_at);
    increment(jobsByDay, dayKey);
    increment(jobsByWeek, weekKey);
    increment(throughputOverTime, dayKey);

    const createdHour = new Date(job.created_at).getUTCHours();
    increment(peakHours, `${String(createdHour).padStart(2, "0")}:00`);

    failureByType[job.kind].total += 1;
    if (job.status === "failed") {
      failureByType[job.kind].failed += 1;
    }

    if (job.error) {
      increment(errorCounts, job.error.slice(0, 140));
      const pattern = getRetryPattern(job.error);
      if (pattern) increment(retryPatternCounts, pattern);
    }

    const durationMs = getDurationMs(job);
    if (durationMs !== null) {
      durationSumMs += durationMs;
      durationCount += 1;

      const completionDay = toUtcDay(job.finished_at!);
      const entry = completionDurationByDay[completionDay] ?? { sum: 0, count: 0 };
      entry.sum += durationMs;
      entry.count += 1;
      completionDurationByDay[completionDay] = entry;
    }
  }

  for (const kind of allKinds) {
    const data = failureByType[kind];
    data.failureRate = percent(data.failed, data.total);
  }

  const completionTimeTrend = Object.entries(completionDurationByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, values]) => ({
      day,
      avgProcessingMs: Number((values.sum / values.count).toFixed(0)),
    }));

  return {
    totalJobs,
    successRate: percent(doneCount, totalJobs),
    failureRate: percent(failedCount, totalJobs),
    averageProcessingMs: durationCount ? Number((durationSumMs / durationCount).toFixed(0)) : 0,
    jobsByType,
    jobsByDay: topEntries(jobsByDay, 30).sort((a, b) => a.label.localeCompare(b.label)),
    jobsByWeek: topEntries(jobsByWeek, 20).sort((a, b) => a.label.localeCompare(b.label)),
    commonErrors: topEntries(errorCounts, 10),
    failureRateByType: failureByType,
    retryNeededPatterns: topEntries(retryPatternCounts, 10),
    throughputOverTime: topEntries(throughputOverTime, 30).sort((a, b) =>
      a.label.localeCompare(b.label)
    ),
    peakHours: topEntries(peakHours, 24),
    completionTimeTrends: completionTimeTrend,
  };
}
