while (true) {

  const job = await getNextJob()

  if (!job) {
    await sleep(2000)
    continue
  }

  if (job.kind === "research") {
    await runResearchAgent(job)
  }

  if (job.kind === "summarize") {
    await runSummarizeAgent(job)
  }

  if (job.kind === "council_vote") {
    await runCouncil(job)
  }

}
