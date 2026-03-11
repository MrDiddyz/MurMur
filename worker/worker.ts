async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("MurMur worker started");

  while (true) {
    console.log("MurMur is checking for jobs...");

    // Senere kobler vi dette til Supabase queue
    await sleep(3000);
  }
}

run().catch((error) => {
  console.error("Worker crashed:", error);
});
