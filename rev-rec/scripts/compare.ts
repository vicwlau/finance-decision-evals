// Compare several rev-rec runs against the current case labels, side by side.
// Usage: bun rev-rec/scripts/compare.ts <run.jsonl> [<run.jsonl> ...]

const root = new URL("..", import.meta.url).pathname;
const paths = Bun.argv.slice(2);
if (!paths.length) throw new Error("usage: bun rev-rec/scripts/compare.ts <run.jsonl> ...");

const cases = new Map(
  (await Bun.file(`${root}data/cases.jsonl`).text()).trim().split("\n").map((l) => {
    const c = JSON.parse(l);
    return [c.id, c];
  }),
);
const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const pct = (x: number) => (Number.isNaN(x) ? "—" : `${Math.round(x * 100)}%`);
const f3 = (x: number) => (Number.isNaN(x) ? "—" : x.toFixed(3));

type Row = Record<string, string>;
const rows: Row[] = [];
const wrongByRun: Record<string, string[]> = {};

for (const path of paths) {
  const recs = (await Bun.file(path).text()).trim().split("\n").map((l) => JSON.parse(l));
  const qset = await Bun.file(`${root}questions/${recs[0].question_set_version}.json`).json();
  const cons: string[] = qset.considerations;
  const split = recs[0].run_id.split("-")[2]; // rev-rec-<split>-<qset>-…
  const label = `${split} · ${recs[0].question_set_version} · ${recs[0].state_mode ?? "prose"}`;
  const gold = (c: any, q: string) => (q === "trigger" ? +c.labels.trigger : +c.labels.considerations.includes(q));

  const trig = { acc: [] as number[], brier: [] as number[], hard: [] as number[], miss: 0, fp: 0 };
  const conceptIds: string[] = qset.framings ? cons.map((q: string) => `${q}${qset.framings.concept}`) : [];
  const consAcc: number[] = [];
  const consBrier: number[] = [];
  const conceptAcc: number[] = [];
  const conceptBrier: number[] = [];
  const primary: number[] = [];
  const primaryCode: number[] = [];
  const sides = new Map<string, Set<boolean>>();
  const wrong = new Set<string>();

  for (const r of recs) {
    const c = cases.get(r.case_id);
    if (!c) continue;
    const a = r.response.answers;
    for (const q of ["trigger", ...cons, ...conceptIds]) {
      const p = a[q].noul;
      const base = q.replace(/_concept$/, "");
      const y = gold(c, base);
      const ok = (p >= 0.5 ? 1 : 0) === y;
      const key = `${c.id}·${q}`;
      (sides.get(key) ?? sides.set(key, new Set()).get(key)!).add(p >= 0.5);
      if (q === "trigger") {
        trig.acc.push(+ok);
        trig.brier.push((p - y) ** 2);
        if (c.difficulty === "hard") trig.hard.push(+ok);
        if (y && !ok) trig.miss++;
        if (!y && !ok) trig.fp++;
      } else if (q.endsWith("_concept")) {
        conceptAcc.push(+ok);
        conceptBrier.push((p - y) ** 2);
      } else {
        consAcc.push(+ok);
        consBrier.push((p - y) ** 2);
      }
      if (!ok) wrong.add(`${c.id} · ${q}`);
    }
    if (a.primary) {
      const pick = a.primary.choice;
      primary.push(+(pick === c.labels.primary));
      if (pick !== c.labels.primary) wrong.add(`${c.id} · primary (${pick})`);
      // Code-side variant: `none` whenever the trigger says no review is needed.
      const codePick = a.trigger.noul < 0.5 ? "none" : pick;
      primaryCode.push(+(codePick === c.labels.primary));
    }
  }
  const flips = [...sides.values()].filter((s) => s.size > 1).length;
  const cost = recs.reduce((s, r) => s + (r.cost_usd ?? 0), 0);
  rows.push({
    Run: label,
    "Trigger acc": pct(mean(trig.acc)),
    "Trigger Brier": f3(mean(trig.brier)),
    "Trigger acc (hard)": pct(mean(trig.hard)),
    "Missed triggers": `${trig.miss}`,
    "False alarms": `${trig.fp}`,
    "Considerations acc (rule)": pct(mean(consAcc)),
    "Considerations Brier (rule)": f3(mean(consBrier)),
    "Considerations acc (concept)": pct(mean(conceptAcc)),
    "Considerations Brier (concept)": f3(mean(conceptBrier)),
    "Primary acc": pct(mean(primary)),
    "Primary, none from trigger": pct(mean(primaryCode)),
    "Flipping answers": `${flips}`,
    Cost: `$${cost.toFixed(4)}`,
  });
  wrongByRun[label] = [...wrong].sort();
}

const cols = Object.keys(rows[0]);
const lines = [
  `# Run comparison`,
  "",
  `Scored against the current labels in \`rev-rec/data/cases.jsonl\`. v0 and v1 asked only rule-style consideration questions, so their concept columns are empty, and v2 has no primary question. Accuracy per call at a 0.5 threshold; "Missed triggers" and "False alarms" count calls. "Flipping answers" counts case × question pairs whose repeats landed on both sides of 0.5.`,
  "",
  `Runs: ${paths.map((p) => `\`${p.split("/").pop()}\``).join(", ")}`,
  "",
  `| Metric | ${rows.map((r) => r.Run).join(" | ")} |`,
  `|---|${rows.map(() => "---").join("|")}|`,
  ...cols.filter((c) => c !== "Run").map((c) => `| ${c} | ${rows.map((r) => r[c]).join(" | ")} |`),
  "",
  "## Wrong answers by run",
  "",
  ...Object.entries(wrongByRun).flatMap(([run, w]) => [`**${run}** (${w.length})`, "", ...w.map((x) => `- ${x}`), ""]),
];
const out = `${root}runs/compare-${new Date().toISOString().replace(/[:.]/g, "")}.md`;
await Bun.write(out, lines.join("\n"));
console.log(lines.join("\n"));
console.log(`\n→ ${out}`);
