export async function POST(req: Request) {
  const body = await req.json();

  console.log("MurMur job received:", body);

  return Response.json({
    status: "job received",
    payload: body
  });
}
