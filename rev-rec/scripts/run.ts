// Run a question set over rev-rec cases against Jev and log every request and response.
// Usage: bun rev-rec/scripts/run.ts [--split dev] [--questions v0] [--state prose] [--reps 3]
// Needs TYPESAFE_API_KEY. The API client is inline: retries, backoff and a fixed number of requests in flight.

import { assertFrozen } from "./freeze";
import { buildState, STATE_MODES, type StateMode } from "./state";

const KEY = process.env.TYPESAFE_API_KEY;
if (!KEY) throw new Error("TYPESAFE_API_KEY is not set");

const arg = (name: string, fallback: string) => {
  const i = Bun.argv.indexOf(`--${name}`);
  return i > -1 ? Bun.argv[i + 1] : fallback;
};
const SPLIT = arg("split", "dev");
const QSET = arg("questions", "v0");
const REPS = Number(arg("reps", "3"));
const STATE = arg("state", "prose") as StateMode;
if (!STATE_MODES.includes(STATE)) throw new Error(`--state must be one of ${STATE_MODES.join(", ")}`);
const HELDOUT_SHA = SPLIT === "heldout" ? await assertFrozen() : null;
const CONCURRENCY = 4;

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-1.13.0";
const USD_PER_INPUT_TOKEN = 0.042 / 1_000_000;

const root = new URL("..", import.meta.url).pathname;
const cases = (await Bun.file(`${root}data/cases.jsonl`).text())
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l))
  .filter((c) => c.split === SPLIT);
const qset = await Bun.file(`${root}questions/${QSET}.json`).json();

const runId = `rev-rec-${SPLIT}-${QSET}-${STATE}-${new Date().toISOString().replace(/[:.]/g, "")}`;
const logPath = `${root}runs/${runId}.jsonl`;

async function call(body: unknown) {
  for (let attempt = 0; ; attempt++) {
    const started = performance.now();
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    }).catch((e) => ({ ok: false, status: 0, error: e }) as const);
    const latency_s = (performance.now() - started) / 1000;
    const status = "status" in res ? res.status : 0;
    const retryable = status === 0 || status === 408 || status === 429 || status >= 500;
    if (retryable && attempt < 4) {
      const retryAfter = "headers" in res ? Number(res.headers.get("retry-after")) : NaN;
      await Bun.sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt);
      continue;
    }
    if (!("json" in res)) throw new Error(`request failed: ${String((res as any).error)}`);
    return { status, latency_s, request_id: res.headers.get("x-typesafe-request-id"), json: await res.json() };
  }
}

const jobs = cases.flatMap((c) => Array.from({ length: REPS }, (_, i) => ({ c, rep: i + 1 })));
const records: string[] = [];
let next = 0;

async function worker() {
  while (next < jobs.length) {
    const { c, rep } = jobs[next++];
    const request = { model: MODEL, state: buildState(c, STATE), questions: qset.questions };
    const date = new Date().toISOString();
    const { status, latency_s, request_id, json } = await call(request);
    const input = json?.usage?.input_tokens;
    if (typeof input !== "number") console.error(`missing usage for ${c.id} rep ${rep} (status ${status})`);
    records.push(
      JSON.stringify({
        run_id: runId,
        date,
        case_id: c.id,
        family: c.family,
        rep,
        question_set_version: QSET,
        state_mode: STATE,
        ...(HELDOUT_SHA && { heldout_sha256: HELDOUT_SHA }),
        model_requested: MODEL,
        model_returned: json?.model ?? null,
        http_status: status,
        latency_s: Number(latency_s.toFixed(3)),
        request_id,
        request,
        response: json,
        usage: json?.usage ?? null,
        cost_usd: typeof input === "number" ? input * USD_PER_INPUT_TOKEN : null,
      }),
    );
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await Bun.write(logPath, records.join("\n") + "\n");
console.log(`${records.length} records → ${logPath}`);
