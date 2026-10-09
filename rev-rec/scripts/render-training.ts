// Render the training examples as a readable page: one section per minimal pair.
// Usage: bun rev-rec/scripts/render-training.ts   (rewrites rev-rec/training-examples.md)
// Re-run it after build-training.ts, which rewrites data/training-examples.jsonl.
//
// Everything on the page comes from data/training-examples.jsonl, with two exceptions: each pair's
// label rule, read from build-training.ts's source so the page shows the exact rule that derived the
// gold, and the held-out clause headings, read from data/cases.jsonl. The bold text is found by diffing the pair's two clauses word by word (and their contexts
// sentence by sentence), so what is bold is exactly what differs between the two records.

import { sameJson } from "./freeze";

const root = new URL("..", import.meta.url).pathname;
const SOURCE = "data/training-examples.jsonl";
const GENERATOR = "scripts/build-training.ts";
const OUT = "training-examples.md";
/** The pair the results page shows; it comes first here. */
const FEATURED = "tr-mr-02";

type Question = { type: string; instructions: string };
type Rec = {
  id: string;
  family: string;
  title: string;
  request: { state: { clause: string; context: string }; questions: Record<string, Question> };
  gold: Record<string, { noul: number }>;
  facts: Record<string, unknown>;
  rationale: string;
  teaches: string;
  weakness: string;
  heldout_evidence: string[];
  labeler: string;
  status: string;
};

const records: Rec[] = (await Bun.file(root + SOURCE).text())
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l));
const generator = await Bun.file(root + GENERATOR).text();
/** Held-out clause headings by case id ("Supplemental Order"), to say which clause each evidence line is about. */
const heldoutHeading = new Map<string, string>(
  (await Bun.file(root + "data/cases.jsonl").text())
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l))
    .filter((c) => c.split === "heldout")
    .map((c) => [c.id, c.clause.slice(0, c.clause.indexOf(". "))]),
);

// ------------------------------------------------ pairs
const families = [...new Set(records.map((r) => r.family))];
const order = [FEATURED, ...families.filter((f) => f !== FEATURED)];
if (!families.includes(FEATURED)) throw new Error(`${SOURCE} has no ${FEATURED} pair`);

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const pairs = order.map((family) => {
  const recs = records.filter((r) => r.family === family);
  if (recs.length !== 2) throw new Error(`${family} has ${recs.length} records, not 2`);
  const [a, b] = recs;
  for (const k of ["weakness", "teaches", "heldout_evidence"] as const)
    if (!same(a[k], b[k])) throw new Error(`${family}: the two records differ in ${k}`);
  if (!same(a.request.questions, b.request.questions)) throw new Error(`${family}: the two records ask different questions`);
  const title = (r: Rec) => r.title.replace(/ \([ab]: (yes|no)\)$/, "");
  if (title(a) !== title(b)) throw new Error(`${family}: the two records have different titles`);
  // a pair must split, one yes and one no, on every question
  for (const q of Object.keys(a.gold))
    if (a.gold[q].noul === b.gold[q]?.noul) throw new Error(`${family}: both records answer ${q} the same way`);
  // no on the left, yes on the right, whatever the a/b order
  const sides = [a, b].sort((x, y) => answer(x) - answer(y));
  return { family, title: title(a), sides, first: a };
});

/** A record's answer when every question shares it (1 yes, 0 no); throws otherwise. */
function answer(r: Rec) {
  const ys = new Set(Object.values(r.gold).map((g) => g.noul));
  if (ys.size !== 1) throw new Error(`${r.id}: its questions have different answers`);
  return [...ys][0];
}

// ------------------------------------------------ diffs
/** Marks the tokens of `a` and `b` that are not in their longest common subsequence. */
function lcsDiff(a: string[], b: string[]): [boolean[], boolean[]] {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ca = new Array<boolean>(n).fill(true);
  const cb = new Array<boolean>(m).fill(true);
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (a[i] === b[j]) {
      ca[i] = cb[j] = false;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return [ca, cb];
}

/** Joins tokens, wrapping each run of changed tokens in bold. */
function bolden(tokens: string[], changed: boolean[]) {
  const out: string[] = [];
  for (let i = 0; i < tokens.length; ) {
    if (!changed[i]) {
      out.push(tokens[i++]);
      continue;
    }
    const run: string[] = [];
    while (i < tokens.length && changed[i]) run.push(tokens[i++]);
    out.push(`**${run.join(" ")}**`);
  }
  return out.join(" ");
}

const words = (s: string) => s.split(" ");
const sentences = (s: string) => s.split(/(?<=\.)\s+/);

/** Both texts with their differences in bold. */
function marked(a: string, b: string, split: (s: string) => string[]): [string, string] {
  const [ta, tb] = [split(a), split(b)];
  const [ca, cb] = lcsDiff(ta, tb);
  return [bolden(ta, ca), bolden(tb, cb)];
}

// ------------------------------------------------ text helpers
const cell = (s: string) => s.replace(/\|/g, "\\|");
const yesNo = (y: number) => (y ? "Yes" : "No");
const factValue = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v));

/** The facts whose values differ between the two records: what the label can turn on. */
function decidingFacts(x: Rec, y: Rec) {
  const keys = [...new Set([...Object.keys(x.facts), ...Object.keys(y.facts)])].filter((k) => !same(x.facts[k], y.facts[k]));
  if (!keys.length) throw new Error(`${x.family}: the two records share every fact`);
  return (r: Rec) => keys.map((k) => `\`${k}: ${factValue(r.facts[k])}\``).join("; ");
}

/** The pair's gold rule as written in build-training.ts (`gold: (f) => …`). */
function labelRule(family: string, facts: Record<string, unknown>) {
  const at = generator.indexOf(`family: "${family}"`);
  if (at < 0) throw new Error(`${GENERATOR} has no pair ${family}`);
  const m = /gold: \(f\) => (.+),\n/.exec(generator.slice(at));
  if (!m) throw new Error(`${GENERATOR}: no gold rule after ${family}`);
  const rule = m[1].replace(/\bf\./g, "");
  let note = "";
  if (rule.includes("SSP[0]")) {
    const range = facts.ssp_range_per_1m;
    if (!Array.isArray(range)) throw new Error(`${family}: the rule uses SSP[0] but the facts have no ssp_range_per_1m`);
    note = `, where \`SSP[0]\` is $${Number(range[0]).toFixed(2)}, the low end of the SSP range`;
  }
  return `yes when \`${rule}\`${note}`;
}

/** "By name" for the `_concept` question, "Rule written out" for the other. */
const framing = (key: string) => (key.endsWith("_concept") ? "By name" : "Rule written out");

/** An evidence line ("rr-f4-h05 rule 0.70–0.88, gold no") with its held-out clause's heading after the id. */
function evidence(line: string) {
  const m = /^(rr-f\d-h\d+) (.+)$/.exec(line);
  if (!m) throw new Error(`evidence line doesn't start with a held-out case id: “${line}”`);
  const heading = heldoutHeading.get(m[1]);
  if (!heading) throw new Error(`evidence names ${m[1]}, which isn't a held-out case`);
  return `- \`${m[1]}\` (${heading}): ${m[2]}`;
}

// ------------------------------------------------ page
/** How many records carry each status and labeler, so the intro can't overstate review. */
const tally = new Map<string, number>();
for (const r of records) {
  const key = `"status": "${r.status}", "labeler": "${r.labeler}"`;
  tally.set(key, (tally.get(key) ?? 0) + 1);
}
const statusLine = [...tally].map(([key, n]) => `${n === records.length ? `All ${n}` : n} have \`${key}\``).join("; ");
/**
 * The records I approved, from data/reviews.jsonl (as for cases, an approval is a logged verdict, and
 * `status` in the record stays "draft").
 */
const myApprovals = (await Bun.file(`${root}data/reviews.jsonl`).text())
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l))
  .filter((v) => v.kind === "example_record" && v.reviewer === "owner" && v.verdict === "approve");
// an approval counts only while the record still matches the snapshot it was given on
const approved = records
  .filter((r) => myApprovals.some((v) => v.item_id === r.id && sameJson(v.snapshot?.record, r)))
  .map((r) => r.id);
const log = "[`data/reviews.jsonl`](data/reviews.jsonl)";
const reviewLine =
  approved.length === records.length
    ? `I reviewed and approved all ${records.length}, and each verdict is logged in ${log}. As with the cases, the records keep the tags they were drafted with (${statusLine.replace(/^All \d+ have /, "")}); an approval is the logged verdict, not a field in the record.`
    : approved.length
      ? `${statusLine}. I have approved ${approved.length} of ${records.length} so far (${approved.map((id) => `\`${id}\``).join(", ")}), logged in ${log}. The rest count as training or eval data only once I approve them.`
      : `${statusLine}. None counts as training or eval data until I review it.`;

const lines: string[] = [];
const say = (...xs: string[]) => lines.push(...xs);

say(
  "# Training examples",
  "",
  `> Generated by [\`scripts/render-training.ts\`](scripts/render-training.ts) from [\`${SOURCE}\`](${SOURCE}). Edit the`,
  `> generator, [\`${GENERATOR}\`](${GENERATOR}), then re-run both scripts. Don't edit this page by hand.`,
  "",
  `${records.length} records in ${pairs.length} minimal pairs, aimed at the held-out misses in the [report](report.md).`,
  "",
  "- **Minimal pair.** The two records in a pair share the clause wording and the deal. They differ only in the fact that decides the answer, shown in bold. A model that keys on words the two records share, such as \"preferred\" or \"independent\", gets one side of the pair wrong.",
  `- **Labels come from facts.** [\`${GENERATOR}\`](${GENERATOR}) computes every amount and gap, then derives each record's correct answer from its facts with a rule in code. Each section shows that rule. No answer is typed by hand, so a changed fact changes the clause and the answer together, and the arithmetic behind every answer can be checked by running the script. The script refuses to write a pair whose two sides get the same answer, or a clause that repeats a held-out clause.`,
  `- **Review.** ${reviewLine}`,
  "- **Questions.** Each record asks two questions about the same clause, and one answer is correct for both: the ASC 606 term by name, and the rule written out. `clause` in a question names the state field that holds the clause text. For material right, variable consideration and contract modification, the rule wording is the clarified version that closes the gaps in my v2 wording ([report, \"Remaining misses\"](report.md#remaining-misses)).",
  "- **Held-out evidence.** The frozen held-out cases behind each pair: the framing (concept is by name, rule is the rule written out), Jev's mean probability over 3 repeats (a range across the three state shapes, unless shapes are named), and the correct answer.",
  "",
  "**Record format.** Each line of the JSONL is one record. `request` holds what Jev sees: the state (`clause` and `context`) and the questions. It is a valid API body without the model name, so it can be sent to Jev as is. `gold` holds the correct answer per question (1 yes, 0 no). The rest is metadata that stays out of the request: `facts` (the structured truth the text was generated from), `rationale`, `weakness`, `teaches`, `heldout_evidence`, `family` (both sides of a pair share it, so they stay in the same split), `tags`, `difficulty`, `labeler` and `status`. `facts` and `rationale` would give the answer away.",
);

pairs.forEach(({ family, title, sides, first }, k) => {
  const [no, yes] = sides;
  const [clauseNo, clauseYes] = marked(no.request.state.clause, yes.request.state.clause, words);
  const contextDiffers = no.request.state.context !== yes.request.state.context;
  const [contextNo, contextYes] = marked(no.request.state.context, yes.request.state.context, sentences);
  if (clauseNo === no.request.state.clause && clauseYes === yes.request.state.clause && !contextDiffers) throw new Error(`${family}: the two records have the same clause and context`);
  const facts = decidingFacts(no, yes);

  say("", `## ${k + 1}. ${title} (\`${family}\`)`, "");
  if (family === FEATURED) say("This is the pair on the results page.", "");
  say(`**Weakness.** ${first.weakness}`, "", `**What changes.** ${first.teaches}`, "");
  if (!contextDiffers) say(`**Deal context, both records.** ${first.request.state.context}`, "");
  say("**Questions, both records.**", "");
  for (const [key, q] of Object.entries(first.request.questions)) say(`- ${framing(key)} (\`${key}\`): ${q.instructions}`);
  say(
    "",
    `| | \`${no.id}\` | \`${yes.id}\` |`,
    "|---|---|---|",
    `| Clause | ${cell(clauseNo)} | ${cell(clauseYes)} |`,
  );
  if (contextDiffers) say(`| Deal context | ${cell(contextNo)} | ${cell(contextYes)} |`);
  say(
    `| Facts that differ | ${cell(facts(no))} | ${cell(facts(yes))} |`,
    `| Correct answer | **${yesNo(answer(no))}** to both questions | **${yesNo(answer(yes))}** to both questions |`,
    `| Rationale | ${cell(no.rationale)} | ${cell(yes.rationale)} |`,
    "",
    `**Label rule** (\`${GENERATOR}\`): ${labelRule(family, { ...no.facts, ...yes.facts })}.`,
    "",
    "**Held-out evidence.**",
    "",
    ...first.heldout_evidence.map(evidence),
  );
});

await Bun.write(root + OUT, lines.join("\n") + "\n");
console.log(`${records.length} records in ${pairs.length} pairs → rev-rec/${OUT}`);
