// Export the numbers the results page shows, computed from the run logs, so the page never
// carries a hand-typed figure. Usage: bun run --cwd site data   (writes site/data/results.json)
// Accuracy is per call at a 0.5 threshold, matching rev-rec/scripts/score.ts and compare.ts.

const repo = new URL("../../", import.meta.url).pathname;
const read = async (rel: string) => (await Bun.file(repo + rel).text()).trim().split("\n").map((l) => JSON.parse(l));

const RUNS = {
  heldout: "2026-10-03T234104845Z",
  dev: { prose: "2026-10-03T200709666Z", structured: "2026-10-03T200711477Z", computed: "2026-10-03T200713107Z" },
};
const SHAPES = ["prose", "structured", "computed"] as const;
type Shape = (typeof SHAPES)[number];

const cases = new Map((await read("rev-rec/data/cases.jsonl")).map((c) => [c.id, c]));
const qset = await Bun.file(repo + "rev-rec/questions/v2.json").json();
const CONS: string[] = qset.considerations;
const freeze = await Bun.file(repo + "rev-rec/data/heldout-freeze.json").json();

const gold = (c: any, q: string) => {
  const base = q.replace(/_concept$/, "");
  return base === "trigger" ? +c.labels.trigger : +c.labels.considerations.includes(base);
};
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const r3 = (x: number) => Math.round(x * 1000) / 1000;

async function load(split: "heldout" | "dev", shape: Shape) {
  const stamp = split === "heldout" ? RUNS.heldout : RUNS.dev[shape];
  return read(`rev-rec/runs/rev-rec-${split}-v2-${shape}-${stamp}.jsonl`);
}

/** Accuracy and Brier over every call for the given questions. */
function score(recs: any[], qs: string[]) {
  const ok: number[] = [];
  const sq: number[] = [];
  for (const r of recs) {
    const c = cases.get(r.case_id);
    for (const q of qs) {
      const p = r.response.answers[q].noul;
      const y = gold(c, q);
      ok.push(+((p >= 0.5 ? 1 : 0) === y));
      sq.push((p - y) ** 2);
    }
  }
  return { accuracy: r3(mean(ok)), brier: r3(mean(sq)), n: ok.length };
}

const concept = (q: string) => `${q}_concept`;
const grid: Record<string, Record<Shape, unknown>> = { heldout: {} as any, dev: {} as any };
const byConsideration: Record<string, Record<Shape, unknown>> = {};
const featured = ["rr-f3-h02", "rr-f2-h04", "rr-f1-h01", "rr-f4-h01", "rr-f3-h01", "rr-f4-h05", "rr-f4-h04", "rr-f2-h05"];
const caseMeans: Record<string, any> = {};
let calls = 0;
let cost = 0;
let models = new Set<string>();

for (const split of ["heldout", "dev"] as const) {
  for (const shape of SHAPES) {
    const recs = await load(split, shape);
    grid[split][shape] = {
      trigger: score(recs, ["trigger"]),
      rule: score(recs, CONS),
      concept: score(recs, CONS.map(concept)),
    };
    if (split !== "heldout") continue;
    calls += recs.length;
    cost += recs.reduce((s, r) => s + (r.cost_usd ?? 0), 0);
    for (const r of recs) models.add(r.model_returned);
    for (const q of CONS) {
      byConsideration[q] ??= {} as any;
      byConsideration[q][shape] = { rule: score(recs, [q]), concept: score(recs, [concept(q)]) };
    }
    for (const id of featured) {
      const mine = recs.filter((r) => r.case_id === id);
      caseMeans[id] ??= { means: {} };
      caseMeans[id].means[shape] = Object.fromEntries(
        ["trigger", ...CONS, ...CONS.map(concept)].map((q) => [q, r3(mean(mine.map((r) => r.response.answers[q].noul)))]),
      );
    }
  }
}

for (const id of featured) {
  const c = cases.get(id);
  Object.assign(caseMeans[id], { family: c.family, clause: c.clause, context: c.context, facts: c.facts, deal: c.state.deal, computed: c.state.computed, gold: c.labels });
}

// Per held-out clause, in frozen order: how many prose runs got the review flag right (frame 3's marks).
const proseRuns = await load("heldout", "prose");
const heldoutTrigger = (freeze.ids ?? Object.keys(freeze.approvals_at_freeze)).map((id: string) => {
  const mine = proseRuns.filter((r) => r.case_id === id);
  const right = mine.filter((r) => ((r.response.answers.trigger.noul >= 0.5 ? 1 : 0) === gold(cases.get(id), "trigger"))).length;
  return { id, family: cases.get(id).family, runs: mine.length, right };
});

// Reliability over all 13 questions, held-out prose (the report's calibration table).
const bins = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0001];
const prose = await load("heldout", "prose");
const pooled = prose.flatMap((r) => ["trigger", ...CONS, ...CONS.map(concept)].map((q) => ({ p: r.response.answers[q].noul, y: gold(cases.get(r.case_id), q) })));
const calibration = bins.slice(0, -1).map((lo, i) => {
  const inBin = pooled.filter(({ p }) => p >= lo && p < bins[i + 1]);
  return { from: lo, to: Math.min(bins[i + 1], 1), count: inBin.length, meanPredicted: r3(mean(inBin.map((x) => x.p))), observedYes: r3(mean(inBin.map((x) => x.y))) };
});

const allTraining = await read("rev-rec/data/training-examples.jsonl");
// The demo clause (rev-rec/scripts/build-demo.ts): outside the frozen test, shown as an example only.
const demo: any = { id: "rr-demo-01", means: {} };
for (const shape of SHAPES) {
  const runs = [...new Bun.Glob(`rev-rec-demo-v2-${shape}-*.jsonl`).scanSync(repo + "rev-rec/runs")].sort();
  const recs = await read(`rev-rec/runs/${runs.at(-1)}`);
  demo.means[shape] = Object.fromEntries(
    ["trigger", ...CONS, ...CONS.map(concept)].map((q) => [q, r3(mean(recs.map((r) => r.response.answers[q].noul)))]),
  );
  demo.runs = [...(demo.runs ?? []), runs.at(-1)];
}
{
  const c = cases.get("rr-demo-01");
  Object.assign(demo, { clause: c.clause, context: c.context, facts: c.facts, deal: c.state.deal, computed: c.state.computed, gold: c.labels, status: c.status });
}

// The same bins for the full expert setup: spelled-out questions (trigger plus the six rules) with
// facts computed in code. Frame 4's stakes line cites this, not the pooled table above.
const computedRuns = await load("heldout", "computed");
const expertPts = computedRuns.flatMap((r) => ["trigger", ...CONS].map((q) => ({ p: r.response.answers[q].noul, y: gold(cases.get(r.case_id), q) })));
const calibrationExpert = bins.slice(0, -1).map((lo, i) => {
  const inBin = expertPts.filter(({ p }) => p >= lo && p < bins[i + 1]);
  return { from: lo, to: Math.min(bins[i + 1], 1), count: inBin.length, meanPredicted: r3(mean(inBin.map((x) => x.p))), observedYes: r3(mean(inBin.map((x) => x.y))) };
});

const training = allTraining.filter((r) => r.family === "tr-mr-01");

const out = {
  generatedAt: new Date().toISOString(),
  source: "rev-rec/runs (v2), rev-rec/data/cases.jsonl, rev-rec/data/training-examples.jsonl",
  run: {
    model: [...models].join(", "),
    questionSet: "v2",
    questionsPerCase: 1 + 2 * CONS.length,
    repeats: 3,
    heldoutCases: freeze.count,
    devCases: [...cases.values()].filter((c) => c.split === "dev").length,
    families: 4,
    heldoutCalls: calls,
    heldoutCostUsd: Math.round(cost * 10000) / 10000,
    heldoutSha256: freeze.sha256,
  },
  // Every v2 question's exact instructions, as sent to the API (the cards quote them).
  questions: Object.fromEntries(Object.entries(qset.questions).map(([k, v]: [string, any]) => [k, { type: v.type, instructions: v.instructions }])),
  heldoutTrigger,
  heldoutFrozenAt: freeze.frozen_at,
  grid,
  byConsideration,
  cases: caseMeans,
  demo,
  calibration,
  calibrationExpert,
  trainingCounts: { records: allTraining.length, pairs: new Set(allTraining.map((r) => r.family)).size },
  // The pair section 6 features: the same clause as a committed purchase and as an option.
  optionPair: allTraining.filter((r) => r.family === "tr-mr-02").map((r) => ({ id: r.id, clause: r.request.state.clause, context: r.request.state.context, gold: r.gold, facts: r.facts, rationale: r.rationale })),
  trainingPair: training.map((r) => ({ id: r.id, clause: r.request.state.clause, context: r.request.state.context, gold: r.gold, facts: r.facts, rationale: r.rationale })),
};

await Bun.write(new URL("../data/results.json", import.meta.url).pathname, JSON.stringify(out, null, 2) + "\n");
console.log(`wrote site/data/results.json: ${calls} held-out calls, $${out.run.heldoutCostUsd}`);
