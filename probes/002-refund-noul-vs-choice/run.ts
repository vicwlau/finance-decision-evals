// Probe 002: the same refund judgment asked as a Noul and as a yes/no Choice, alone and batched,
// plus a question/negation pair. Reproduces the jev-1.13 jaggedness page and measures repeat noise.
// Run: bun probes/002-refund-noul-vs-choice/run.ts   (needs TYPESAFE_API_KEY in the environment)

const KEY = process.env.TYPESAFE_API_KEY;
if (!KEY) throw new Error("TYPESAFE_API_KEY is not set");

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-1.13.0";
const USD_PER_INPUT_TOKEN = 0.042 / 1_000_000;
const REPS = 5;
const QUESTION_SET = "probe002-v1";

const FIT = "I'm not happy with the fit. What are my options here?";
const CHARGED = "I was charged twice for the same order. Can someone look into this?";
const refundNoul = { type: "noul", instructions: "Is the customer asking for a refund?" };
const refundChoice = {
  type: "choice",
  instructions: "Is the customer asking for a refund?",
  criteria: { yes: null, no: null },
};
const notRefundNoul = {
  type: "noul",
  instructions: "Is the customer asking for something other than a refund?",
};

const CONDITIONS: Record<string, { state: string; questions: Record<string, unknown> }> = {
  noul_alone: { state: FIT, questions: { refund: refundNoul } },
  choice_alone: { state: FIT, questions: { refund: refundChoice } },
  batched: { state: FIT, questions: { refund_noul: refundNoul, refund_choice: refundChoice } },
  negation_pair: { state: CHARGED, questions: { refund: refundNoul, not_refund: notRefundNoul } },
};

const runId = `002-refund-noul-vs-choice-${new Date().toISOString().replace(/[:.]/g, "")}`;
const logPath = new URL(`./runs/${runId}.jsonl`, import.meta.url).pathname;
const lines: string[] = [];

async function call(body: unknown) {
  for (let attempt = 0; ; attempt++) {
    const started = performance.now();
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const latency_s = (performance.now() - started) / 1000;
    const retryable = res.status === 408 || res.status === 429 || res.status >= 500;
    if (retryable && attempt < 3) {
      await Bun.sleep(500 * 2 ** attempt);
      continue;
    }
    return { res, latency_s, json: await res.json() };
  }
}

// Interleave conditions within each rep so time drift doesn't line up with a condition.
for (let rep = 1; rep <= REPS; rep++) {
  for (const [condition, { state, questions }] of Object.entries(CONDITIONS)) {
    const request = { model: MODEL, state, questions };
    const date = new Date().toISOString();
    const { res, latency_s, json } = await call(request);
    const input = json?.usage?.input_tokens;
    lines.push(
      JSON.stringify({
        run_id: runId,
        date,
        probe: "002-refund-noul-vs-choice",
        condition,
        rep,
        question_set_version: QUESTION_SET,
        model_requested: MODEL,
        model_returned: json?.model ?? null,
        http_status: res.status,
        latency_s: Number(latency_s.toFixed(3)),
        request_id: res.headers.get("x-typesafe-request-id"),
        request,
        response: json,
        usage: json?.usage ?? null,
        cost_usd: typeof input === "number" ? input * USD_PER_INPUT_TOKEN : null,
      }),
    );
  }
}

await Bun.write(logPath, lines.join("\n") + "\n");
console.log(`wrote ${lines.length} records to ${logPath}`);
