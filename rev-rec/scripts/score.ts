// Score a rev-rec run against the case labels and write a Markdown results file next to the log.
// Usage: bun rev-rec/scripts/score.ts rev-rec/runs/<run_id>.jsonl

import { approvals, MANIFEST } from "./freeze";

const logPath = Bun.argv[2];
if (!logPath) throw new Error("usage: bun rev-rec/scripts/score.ts <run.jsonl>");
const root = new URL("..", import.meta.url).pathname;

const records = (await Bun.file(logPath).text()).trim().split("\n").map((l) => JSON.parse(l));
const cases = new Map(
  (await Bun.file(`${root}data/cases.jsonl`).text()).trim().split("\n").map((l) => {
    const c = JSON.parse(l);
    return [c.id, c];
  }),
);
const qsetVersion = records[0].question_set_version;
const qset = await Bun.file(`${root}questions/${qsetVersion}.json`).json();
const considerations: string[] = qset.considerations;
const conceptIds: string[] = qset.framings ? considerations.map((c) => `${c}${qset.framings.concept}`) : [];
const nouls = ["trigger", ...considerations, ...conceptIds];

const gold = (c: any, q: string) => {
  const base = q.replace(/_concept$/, "");
  return base === "trigger" ? (c.labels.trigger ? 1 : 0) : c.labels.considerations.includes(base) ? 1 : 0;
};

// Per case and question: every repeat's probability.
type Cell = { gold: number; ps: number[] };
const cells = new Map<string, Map<string, Cell>>();
const primary = new Map<string, { gold: string; picks: string[]; pGold: number[]; conf: number[] }>();
for (const r of records) {
  const c = cases.get(r.case_id);
  const answers = r.response.answers;
  const byQ = cells.get(r.case_id) ?? new Map();
  for (const q of nouls) {
    const cell = byQ.get(q) ?? { gold: gold(c, q), ps: [] };
    cell.ps.push(answers[q].noul);
    byQ.set(q, cell);
  }
  cells.set(r.case_id, byQ);
  if (answers.primary) {
    const p = primary.get(r.case_id) ?? { gold: c.labels.primary, picks: [], pGold: [], conf: [] };
    p.picks.push(answers.primary.choice);
    p.pGold.push(answers.primary.probabilities[c.labels.primary] ?? 0);
    p.conf.push(answers.primary.confidence);
    primary.set(r.case_id, p);
  }
}

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const fmt = (x: number, d = 2) => x.toFixed(d);
const pct = (x: number) => `${Math.round(x * 100)}%`;

// Noul metrics over every repeat.
function nounStats(filter: (caseId: string) => boolean, q: string) {
  const preds: { p: number; y: number }[] = [];
  for (const [id, byQ] of cells) if (filter(id)) for (const p of byQ.get(q)!.ps) preds.push({ p, y: byQ.get(q)!.gold });
  const acc = mean(preds.map(({ p, y }) => ((p >= 0.5 ? 1 : 0) === y ? 1 : 0)));
  const brier = mean(preds.map(({ p, y }) => (p - y) ** 2));
  const base = mean(preds.map(({ y }) => y));
  const prior = mean(preds.map(({ y }) => (base - y) ** 2));
  return { n: preds.length, acc, brier, prior, positives: preds.filter((x) => x.y === 1).length };
}

const all = () => true;
const lines: string[] = [];
const runId = records[0].run_id;
const cost = records.reduce((s, r) => s + (r.cost_usd ?? 0), 0);
const tokens = records.reduce((s, r) => s + (r.usage?.input_tokens ?? 0), 0);
const reps = Math.max(...records.map((r) => r.rep));
const models = [...new Set(records.map((r) => r.model_returned))].join(", ");

lines.push(`# Results: ${runId}`, "");
lines.push(
  `Model ${models} · question set ${qsetVersion} · state ${records[0].state_mode ?? "prose"} · ${cells.size} cases × ${reps} repeats = ${records.length} calls · ` +
    `${tokens.toLocaleString()} input tokens · $${cost.toFixed(4)}`,
  "",
);
if (records[0].heldout_sha256) lines.push(`Held-out freeze: \`${records[0].heldout_sha256}\`.`, "");

// Label provenance: only labels I approved (reviewer "owner") count toward a reported number.
const tiers = Object.values(await approvals([...cells.keys()]));
const owner = tiers.filter((t) => t === "owner").length;
const agent = tiers.filter((t) => t.startsWith("agent:")).length;
const draft = tiers.length - owner - agent;
lines.push(
  `**Labels: ${owner} of ${tiers.length} cases approved by the author` +
    (agent ? `, ${agent} approved only by an independent agent (author review pending)` : "") +
    (draft ? `, ${draft} unreviewed drafts` : "") +
    ".**" +
    (owner < tiers.length ? " Numbers that include labels the author hasn't approved are not reported results until the author approves every label." : ""),
  "",
);

lines.push("## Noul questions", "", "Accuracy uses a 0.5 threshold. The prior baseline always predicts the share of positives for that question. Lower Brier is better.", "");
lines.push("| Question | Positives | Accuracy | Brier | Prior Brier |", "|---|---|---|---|---|");
for (const q of nouls) {
  const s = nounStats(all, q);
  lines.push(`| ${q} | ${s.positives / reps} of ${s.n / reps} | ${pct(s.acc)} | ${fmt(s.brier, 3)} | ${fmt(s.prior, 3)} |`);
}
lines.push("");

const primaryAcc = mean([...primary.values()].flatMap((p) => p.picks.map((x) => (x === p.gold ? 1 : 0))));
if (primary.size) lines.push(`## Primary consideration (Choice)`, "", `Top-1 accuracy: ${pct(primaryAcc)}.`, "");

lines.push("## Trigger by family and difficulty", "", "| Slice | Cases | Accuracy | Brier |", "|---|---|---|---|");
const slices: [string, (id: string) => boolean][] = [
  ...["F1", "F2", "F3", "F4"].map((f) => [f, (id: string) => cases.get(id).family === f] as [string, (id: string) => boolean]),
  ["easy", (id) => cases.get(id).difficulty === "easy"],
  ["hard", (id) => cases.get(id).difficulty === "hard"],
];
for (const [name, f] of slices) {
  const s = nounStats(f, "trigger");
  lines.push(`| ${name} | ${s.n / reps} | ${pct(s.acc)} | ${fmt(s.brier, 3)} |`);
}
lines.push("");

// Held-out slices fixed at freeze time (data/heldout-freeze.json), over every rule-framed Noul question.
if (records[0].heldout_sha256) {
  const { slices: frozen } = await Bun.file(MANIFEST).json();
  const pooledAcc = (ids: Set<string>, qs: string[]) => {
    const oks: number[] = [];
    for (const [id, byQ] of cells) if (ids.has(id)) for (const q of qs) for (const p of byQ.get(q)!.ps) oks.push(+((p >= 0.5 ? 1 : 0) === byQ.get(q)!.gold));
    return oks.length ? pct(mean(oks)) : "—";
  };
  lines.push("## Pre-registered held-out slices", "", "Accuracy over every call and question in the slice. Slices were fixed when held-out was frozen.", "");
  lines.push("| Slice | Cases | Trigger | Considerations (rule) | Considerations (concept) |", "|---|---|---|---|---|");
  for (const [name, s] of Object.entries(frozen) as [string, { ids: string[] }][]) {
    const ids = new Set(s.ids);
    lines.push(`| ${name} | ${ids.size} | ${pooledAcc(ids, ["trigger"])} | ${pooledAcc(ids, considerations)} | ${pooledAcc(ids, conceptIds)} |`);
  }
  lines.push("");
}

// Reliability over all Noul predictions.
lines.push("## Reliability (all Noul predictions)", "", "| Predicted | Count | Mean predicted | Observed yes |", "|---|---|---|---|");
const bins = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0001];
const pooled: { p: number; y: number }[] = [];
for (const byQ of cells.values()) for (const q of nouls) for (const p of byQ.get(q)!.ps) pooled.push({ p, y: byQ.get(q)!.gold });
for (let i = 0; i < bins.length - 1; i++) {
  const inBin = pooled.filter(({ p }) => p >= bins[i] && p < bins[i + 1]);
  if (!inBin.length) continue;
  lines.push(
    `| ${fmt(bins[i], 1)}–${fmt(Math.min(bins[i + 1], 1), 1)} | ${inBin.length} | ${fmt(mean(inBin.map((x) => x.p)))} | ${pct(mean(inBin.map((x) => x.y)))} |`,
  );
}
lines.push("");

// Per-case table: mean probability per question, wrong answers marked.
lines.push("## Per case", "", "Mean probability over repeats. ✗ marks a wrong side of 0.5 (gold in brackets). ~ marks repeats that disagreed.", "");
lines.push(`| Case | Diff | Trigger | Considerations Jev flagged | Gold considerations | Primary (gold) |`, "|---|---|---|---|---|---|");
const failures: string[] = [];
for (const [id, byQ] of cells) {
  const c = cases.get(id);
  const cellTxt = (q: string) => {
    const { gold: y, ps } = byQ.get(q)!;
    const m = mean(ps);
    const wrong = (m >= 0.5 ? 1 : 0) !== y;
    const flip = new Set(ps.map((p) => p >= 0.5)).size > 1;
    if (wrong) failures.push(`${id} · ${q}: Jev ${fmt(m)} vs gold ${y}`);
    return `${fmt(m)}${wrong ? ` ✗[${y}]` : ""}${flip ? " ~" : ""}`;
  };
  const trig = cellTxt("trigger");
  const flagged = considerations
    .map((q) => ({ q, txt: cellTxt(q), m: mean(byQ.get(q)!.ps), y: byQ.get(q)!.gold }))
    .filter((x) => x.m >= 0.5 || x.y === 1)
    .map((x) => `${x.q} ${x.txt}`)
    .join("<br>");
  for (const q of conceptIds) cellTxt(q); // records concept-framing failures
  const p = primary.get(id);
  const picks = p ? [...new Set(p.picks)].join("/") : "";
  const primaryWrong = !!p && p.picks.some((x) => x !== p.gold);
  if (primaryWrong) failures.push(`${id} · primary: Jev ${picks} vs gold ${p!.gold}`);
  lines.push(
    `| ${id} | ${c.difficulty} | ${trig} | ${flagged || "—"} | ${c.labels.considerations.join(", ") || "none"} | ${p ? `${picks}${primaryWrong ? ` ✗[${p.gold}]` : ""} (${fmt(mean(p.conf))})` : "—"} |`,
  );
}
lines.push("", "## Wrong answers", "", ...(failures.length ? failures.map((f) => `- ${f}`) : ["None."]), "");

const outPath = logPath.replace(/\.jsonl$/, ".results.md");
await Bun.write(outPath, lines.join("\n"));
console.log(lines.join("\n"));
console.log(`\n→ ${outPath}`);
