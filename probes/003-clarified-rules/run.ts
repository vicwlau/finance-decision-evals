// Probe 003: do clarified rule questions fix the two "structure" misses on the results page?
// Usage: bun probes/003-clarified-rules/run.ts   (needs TYPESAFE_API_KEY; ~18 calls, well under a cent)
//
// Diagnostic only. It asks two frozen held-out clauses (rr-f4-h05, rr-f4-h04) the v2 rule question
// and a clarified version side by side, in every state shape. It is not a held-out score: the
// clarified wording was written after seeing held-out errors, so it must be scored on fresh clauses.

import { buildState, STATE_MODES } from "../../rev-rec/scripts/state";

const KEY = process.env.TYPESAFE_API_KEY;
if (!KEY) throw new Error("TYPESAFE_API_KEY is not set");
const MODEL = "jev-1.13.0";
const USD_PER_INPUT_TOKEN = 0.042 / 1_000_000;
const REPS = 3;
const root = new URL("../../", import.meta.url).pathname;

const v2 = await Bun.file(`${root}rev-rec/questions/v2.json`).json();
const QUESTIONS: Record<string, { case: string; v2: string; clarified: string }> = {
  material_right: {
    case: "rr-f4-h05",
    v2: v2.questions.material_right.instructions,
    // the wording drafted for the training examples (rev-rec/scripts/build-training.ts)
    clarified:
      "Does `clause` give the customer an option to buy additional goods or services at a price below the low end of the standalone selling price range stated in the deal information? A purchase the customer has already committed to is not an option.",
  },
  variable_consideration: {
    case: "rr-f4-h04",
    v2: v2.questions.variable_consideration.instructions,
    clarified:
      "Can the amount the customer pays under `clause` change depending on a future event, such as usage, performance, or service levels? A fixed amount, or a fixed unit price on purchases the customer chooses to make, is not variable.",
  },
};

const cases = new Map(
  (await Bun.file(`${root}rev-rec/data/cases.jsonl`).text()).trim().split("\n").map((l) => JSON.parse(l)).map((c) => [c.id, c]),
);

async function call(body: unknown) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    }).catch(() => null);
    const status = res?.status ?? 0;
    if ((status === 0 || status === 429 || status >= 500) && attempt < 4) {
      await Bun.sleep(500 * 2 ** attempt);
      continue;
    }
    if (!res) throw new Error("request failed");
    return { status, json: await res.json() };
  }
}

const runId = `003-clarified-rules-${new Date().toISOString().replace(/[:.]/g, "")}`;
const lines: string[] = [];
for (const [q, spec] of Object.entries(QUESTIONS)) {
  const c = cases.get(spec.case);
  for (const shape of STATE_MODES) {
    for (let rep = 1; rep <= REPS; rep++) {
      const request = {
        model: MODEL,
        state: buildState(c, shape),
        questions: { v2: { type: "noul", instructions: spec.v2 }, clarified: { type: "noul", instructions: spec.clarified } },
      };
      const { status, json } = await call(request);
      const input = json?.usage?.input_tokens;
      lines.push(JSON.stringify({
        run_id: runId, date: new Date().toISOString(), case_id: spec.case, question: q, state_mode: shape, rep,
        question_set_version: "v2 vs clarified", model_requested: MODEL, model_returned: json?.model ?? null,
        http_status: status, gold: c.labels.considerations.includes(q) ? 1 : 0,
        request, response: json, usage: json?.usage ?? null,
        cost_usd: typeof input === "number" ? input * USD_PER_INPUT_TOKEN : null,
      }));
    }
  }
}
const out = `${root}probes/003-clarified-rules/runs/${runId}.jsonl`;
await Bun.write(out, lines.join("\n") + "\n");

// summary: mean probability per question, shape and wording
const recs = lines.map((l) => JSON.parse(l));
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
for (const q of Object.keys(QUESTIONS)) {
  for (const shape of STATE_MODES) {
    const r = recs.filter((x) => x.question === q && x.state_mode === shape);
    const v = mean(r.map((x) => x.response.answers.v2.noul)).toFixed(2);
    const cl = mean(r.map((x) => x.response.answers.clarified.noul)).toFixed(2);
    console.log(`${q.padEnd(22)} ${shape.padEnd(10)} gold ${r[0].gold}   v2 ${v}   clarified ${cl}`);
  }
}
const cost = recs.reduce((s, r) => s + (r.cost_usd ?? 0), 0);
console.log(`${recs.length} calls, models ${[...new Set(recs.map((r) => r.model_returned))]}, statuses ${[...new Set(recs.map((r) => r.http_status))]}, $${cost.toFixed(5)} → ${out}`);
