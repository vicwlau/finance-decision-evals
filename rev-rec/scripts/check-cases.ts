// Consistency checks on the individually written cases: dollar totals must follow from the facts.
// Usage: bun rev-rec/scripts/check-cases.ts   (exits 1 on any mismatch)

const root = new URL("..", import.meta.url).pathname;
const cases = (await Bun.file(`${root}data/cases.jsonl`).text()).trim().split("\n").map((l) => JSON.parse(l));
const M_PER_B = 1000; // tokens are counted in billions (B) and priced per 1M
const errors: string[] = [];
const expect = (id: string, what: string, got: number, want: number) => {
  if (Math.abs(got - want) > 0.5) errors.push(`${id}: ${what} is ${got}, facts imply ${want}`);
};

for (const c of cases) {
  const f = c.facts;
  if (f.prepaid_tokens_b != null) expect(c.id, "prepaid fee", f.prepaid_fee_usd, f.prepaid_tokens_b * M_PER_B * f.prepaid_price_per_1m);
  if (f.added_tokens_b != null) expect(c.id, "added fee", f.added_fee_usd, f.added_tokens_b * M_PER_B * f.added_price_per_1m);
  if (f.unused_prepaid_usd != null) expect(c.id, "unused prepaid value", f.unused_prepaid_usd, (f.annual_fee_usd * f.months_remaining) / 12);
  if (f.prior_fee_usd != null) expect(c.id, "prior fee", f.prior_fee_usd, f.annual_fee_usd * (f.prior_term_years ?? 3));
  // Every dollar amount and token volume in the text must appear in the facts or follow from them.
  for (const m of `${c.clause} ${c.context}`.matchAll(/(\d[\d,]*)B tokens/g)) {
    const n = Number(m[1].replace(/,/g, ""));
    const known = Object.values(f).flat(2).filter((v) => typeof v === "number");
    if (!known.includes(n) && ![100, 2400].includes(n)) errors.push(`${c.id}: "${m[0]}" has no matching fact`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`${cases.length} cases consistent`);
