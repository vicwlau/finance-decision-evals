// Build the results page's demo clause: an add-on option for an AI API, priced near public list
// prices for input tokens (about $40 per billion). It sits outside the frozen held-out
// set (split "demo"), so it never counts toward a reported number.
// Usage: bun rev-rec/scripts/build-demo.ts   (replaces the split:"demo" rows in data/cases.jsonl)

import { vsRange } from "./state";

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const f = {
  term_type: "add_on_option",
  term_months: 12,
  committed_input_tokens_bn: 24_000, // 24 trillion
  committed_price_per_bn: 40,
  ssp_range_per_bn: [38, 42] as [number, number],
  list_price_per_bn: 42,
  add_on_price_per_bn: 21,
  add_on_block_bn: 1_000,
};
const fee = f.committed_input_tokens_bn * f.committed_price_per_bn;
const vsSsp = vsRange(f.add_on_price_per_bn, f.ssp_range_per_bn);

const row = {
  id: "rr-demo-01",
  family: "F1",
  clause: `Additional Tokens. At any time during the Subscription Term, Customer may purchase additional input tokens, in blocks of 1 trillion, at $${f.add_on_price_per_bn} per billion input tokens.`,
  context: `Customer: enterprise software company on a 12-month subscription. Committed usage: 24 trillion input tokens for ${usd(fee)} ($${f.committed_price_per_bn} per billion). Standalone selling price (SSP) for committed input tokens for customers of this size: $${f.ssp_range_per_bn[0]} to $${f.ssp_range_per_bn[1]} per billion. List price: $${f.list_price_per_bn} per billion input tokens. Output tokens are not charged.`,
  facts: { ...f, committed_fee_usd: fee },
  state: {
    deal: {
      customer: "enterprise software company",
      term: "12 months",
      committed_usage: `24 trillion input tokens for ${usd(fee)} ($${f.committed_price_per_bn} per billion)`,
      ssp_per_billion_input_tokens: `$${f.ssp_range_per_bn[0]} to $${f.ssp_range_per_bn[1]}`,
      list_price_per_billion_input_tokens: `$${f.list_price_per_bn}`,
      output_tokens: "not charged",
    },
    computed: { add_on_price_vs_ssp: `$${f.add_on_price_per_bn} per billion input tokens is ${vsSsp}` },
  },
  labels: { trigger: true, considerations: ["material_right"], primary: "none" },
  difficulty: "easy",
  why: `$${f.add_on_price_per_bn} per billion is ${vsSsp}: an option at a discount the customer gets only by signing, so a material right (606-10-55-41 to 55-43). Part of the ${usd(fee)} is allocated to it and deferred.`,
  status: "draft",
  split: "demo",
};

const path = new URL("../data/cases.jsonl", import.meta.url).pathname;
const existing = (await Bun.file(path).text()).trim().split("\n").filter((l) => JSON.parse(l).split !== "demo");
await Bun.write(path, [...existing, JSON.stringify(row)].join("\n") + "\n");
console.log(`demo case written: ${row.id} (${vsSsp})`);
