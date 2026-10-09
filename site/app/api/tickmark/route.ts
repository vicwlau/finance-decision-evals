// Dev-only UI comments (@vicwlau/tickmark), appended to the JSONL file named below.
// The handler is imported only in development, so production builds answer 404 and never
// bundle it (its filesystem access would otherwise make Next trace the whole repo).
export const dynamic = "force-dynamic";

let handler: ((req: Request) => Promise<Response>) | undefined;

async function tickmark(req: Request): Promise<Response> {
  if (process.env.NODE_ENV === "development") {
    handler ??= (await import("@vicwlau/tickmark/server")).createTickmarkHandler({ file: "docs/feedback/tickmark.jsonl" });
    return handler(req);
  }
  return Response.json({ ok: false, error: "tickmark is dev-only" }, { status: 404 });
}

export { tickmark as GET, tickmark as POST };
