// Build synthetic training examples: minimal pairs aimed at the held-out weaknesses in report.md.
// Usage: bun rev-rec/scripts/build-training.ts   (rewrites data/training-examples.jsonl)
//
// Each family is one pair. The two records share the clause wording and differ in the one fact
// that decides the label. Every amount and gap is computed here, and every gold answer is derived
// from the facts by a rule below, never typed by hand. Records follow the format described in
// training-examples.md. Approvals are verdicts in data/reviews.jsonl, not a field in the record.
// Numbers and wording deliberately differ from the held-out cases (checked at the end).

import { vsRange } from "./state";

const M_PER_B = 1000; // token volumes are in billions (B); prices are per 1M tokens
const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const usd2 = (n: number) => `$${n.toFixed(2)}`;
const int = (n: number) => n.toLocaleString("en-US");
const fee = (tokensB: number, perM: number) => Math.round(tokensB * M_PER_B * perM);

const SSP: [number, number] = [1.8, 2.0];
const sspText = `${usd2(SSP[0])} to ${usd2(SSP[1])} per 1M tokens`;

// Questions. Concept framing is v2's wording, the knowledge Jev lacks (report.md, "Naming the issue").
// Rule framing states the condition precisely; for three concepts it fixes v2's wording gaps.
const Q = {
  material_right: {
    concept: "Read with the deal information: under ASC 606, does `clause` give the customer a material right?",
    rule: "Does `clause` give the customer an option to buy additional goods or services at a price below the low end of the standalone selling price range stated in the deal information? A purchase the customer has already committed to is not an option.",
  },
  variable_consideration: {
    concept: "Read with the deal information: under ASC 606, does `clause` involve variable consideration?",
    rule: "Can the amount the customer pays under `clause` change depending on a future event, such as usage, performance, or service levels? A fixed amount, or a fixed unit price on purchases the customer chooses to make, is not variable.",
  },
  financing_component: {
    concept: "Read with the deal information: under ASC 606, does `clause` raise the question of a significant financing component?",
    rule: "Under `clause`, does more than one year separate when the customer receives the goods or services and when it pays, in either direction?",
  },
  contract_modification: {
    concept: "Read with the deal information: under ASC 606, is `clause` a contract modification?",
    rule: "Does `clause` change the scope or price of an existing contract with this customer? Exercising an option the existing contract already grants, on its stated terms, is not a change; neither is a new contract that starts when the old one expires.",
  },
} as const;
type Concept = keyof typeof Q;

type Pair = {
  family: string;
  title: string;
  concept: Concept;
  weakness: string;
  heldout_evidence: string[];
  teaches: string;
  variants: { key: "a" | "b"; facts: Record<string, unknown>; clause: string; context: string; rationale: string }[];
  /** Derives the gold answer from a variant's facts. */
  gold: (facts: Record<string, any>) => boolean;
};

// ------------------------------------------------ 1. financing: the one-year line, not "long terms"
const license = 1_200_000;
const installments = (n: number) => {
  const each = license / n;
  const gapMonths = n - 1; // first installment due at delivery, then monthly
  return {
    facts: { term_type: "license_installments", license_fee_usd: license, installments: n, installment_usd: each, months_transfer_to_last_payment: gapMonths },
    clause: `Payment. The license fee is payable in ${n} equal monthly installments of ${usd(each)}, the first due on the delivery date.`,
    context: `Customer based in Germany. Perpetual software license for ${usd(license)}, delivered and transferred at signing. The vendor's standard payment terms are net 30.`,
    rationale:
      gapMonths > 12
        ? `The last installment arrives ${gapMonths} months after the license transfers, beyond one year, so the practical expedient (606-10-32-18) is not available and the vendor must assess whether the financing component is significant (606-10-32-15 to 32-16).`
        : `The last installment arrives ${gapMonths} months after the license transfers, within one year, so the practical expedient applies (606-10-32-18) and no financing adjustment is needed, however long the terms look against net 30.`,
  };
};

// ------------------------------------------------ 2. self-description: "independent" vs truly new
const prior = { tokens_b: 1500, fee_usd: 3_000_000, start: "1 February 2026", end: "31 January 2029" };
const priorContext = (extra: string) =>
  `Prior Order: three-year term from ${prior.start} to ${prior.end} for ${int(prior.tokens_b)}B tokens and ${usd(prior.fee_usd)}. SSP for committed tokens: ${sspText}. ${extra}`;
const independent = (startsAtExpiry: boolean) => {
  const tokens = 400;
  const price = 1.9;
  const start = startsAtExpiry ? "1 February 2029" : "1 August 2028";
  return {
    facts: { term_type: "supplemental_order", self_described_independent: true, tokens_b: tokens, price_per_1m: price, fee_usd: fee(tokens, price), start, starts_at_prior_expiry: startsAtExpiry },
    clause: `Supplemental Order. This Supplemental Order is a new and independent agreement and does not modify the Prior Order. Starting ${start}, Customer purchases ${int(tokens)}B tokens for use over twelve (12) months at ${usd2(price)} per 1M tokens (${usd(fee(tokens, price))}).`,
    context: priorContext("The Prior Order has no option to buy additional tokens."),
    rationale: startsAtExpiry
      ? "It starts when the Prior Order expires, so it is a new contract, not a change to the old one. The clause's description happens to be accurate."
      : "It adds tokens while the Prior Order still runs, so it changes the scope of an existing arrangement: a contract modification (606-10-25-10), whatever the clause calls itself. At SSP with distinct goods it is accounted for as a separate contract (606-10-25-12), but it is still a modification, as in author-approved rr-f4-03.",
  };
};

// ------------------------------------------------ 3. discount language: "preferred" inside vs below SSP
const preferred = (price: number) => ({
  facts: { term_type: "add_on_option", option_price_per_1m: price, ssp_range_per_1m: SSP, price_vs_ssp: vsRange(price, SSP) },
  clause: `Preferred Pricing. In recognition of Customer's commitment, Customer may purchase additional tokens during the Term at a preferred rate of ${usd2(price)} per 1M tokens.`,
  context: `Customer: mid-market software company on a two-year term with a prepaid commitment of 800B tokens. SSP for committed tokens for customers of this size: ${sspText}.`,
  rationale:
    price < SSP[0]
      ? `${usd2(price)} is ${vsRange(price, SSP)}, an incremental discount the customer gets only by entering this contract: a material right (606-10-55-41 to 55-43).`
      : `${usd2(price)} is ${vsRange(price, SSP)}. Despite the word "preferred", the option gives no discount beyond what this class of customer would pay, so there is no material right (606-10-55-43).`,
});

// ------------------------------------------------ 4. purchase vs option at the same discount
const committedOrOption = (isOption: boolean) => {
  const tokens = 300;
  const price = 1.5;
  return {
    facts: { term_type: isOption ? "add_on_option" : "committed_add_on", is_option: isOption, tokens_b: tokens, price_per_1m: price, ssp_range_per_1m: SSP, price_vs_ssp: vsRange(price, SSP) },
    clause: isOption
      ? `Year-Three Tokens. Customer may purchase up to ${int(tokens)}B additional tokens for use in the third contract year at ${usd2(price)} per 1M tokens.`
      : `Year-Three Tokens. Customer purchases ${int(tokens)}B additional tokens for use in the third contract year at ${usd2(price)} per 1M tokens.`, // no fee total, so the pair differs only in the deciding phrase
    context: `New three-year order signed today. Customer: enterprise software company. Base commitment: 2,000B tokens at $1.90 per 1M tokens. SSP for committed tokens: ${sspText}.`,
    rationale: isOption
      ? `An option to buy at ${usd2(price)}, ${vsRange(price, SSP)}: a discount the customer gets only by signing, so a material right (606-10-55-42).`
      : `A committed purchase in the same contract, not an option. The ${usd2(price)} price is ${vsRange(price, SSP)}, which affects how the transaction price is allocated (606-10-32-28 to 32-31), but there is no material right.`,
  };
};

// ------------------------------------------------ 5. fixed vs variable: an unconditional vs a usage-conditioned credit
// Credits are earned in years 1 and 2 only, so each lands on an invoice inside the three-year term.
// A year-3 credit against a year-4 invoice would have value only on renewal, which makes even the
// unconditional side depend on a future event.
const credit = (conditional: boolean) => {
  const annual = 960_000;
  const pct = 0.1;
  const termYears = 3;
  const creditYears = [1, 2];
  if (Math.max(...creditYears) + 1 > termYears) throw new Error("tr-vc-01: a credit would land on an invoice after the term");
  return {
    facts: { term_type: "annual_credit", term_years: termYears, annual_fee_usd: annual, credit_pct: pct, credit_usd: annual * pct, credit_years: creditYears, conditional_on_usage: conditional, usage_threshold_b: conditional ? 600 : null },
    clause: conditional
      ? `Annual Credit. For each of the first two contract years, if Customer's token usage in that year exceeds 600B tokens, Vendor will credit ${pct * 100}% of that year's fee (${usd(annual * pct)}) against the next year's invoice.`
      : `Annual Credit. For each of the first two contract years, Vendor will credit ${pct * 100}% of that year's fee (${usd(annual * pct)}) against the next year's invoice.`,
    context: `Customer: enterprise software company on a three-year subscription at ${usd(annual)} per year, billed annually in advance. The vendor's standard order form has no credits.`,
    rationale: conditional
      ? "The credit depends on future usage, so the amount the customer pays is uncertain at signing: variable consideration to estimate and possibly constrain (606-10-32-5 to 32-9)."
      : `Both credits are certain and fixed at signing, and each lands on an invoice inside the term. They lower the transaction price by ${usd(annual * pct * creditYears.length)}, but nothing about them depends on a future event, so they are not variable consideration.`,
  };
};

// ------------------------------------------------ 6. existing option vs new scope
const addOn = (priorHasOption: boolean) => {
  const tokens = 200;
  const price = 1.95;
  return {
    facts: { term_type: "add_on_order", tokens_b: tokens, price_per_1m: price, fee_usd: fee(tokens, price), prior_order_add_on_option: priorHasOption, ssp_range_per_1m: SSP },
    clause: `Additional Tokens. Customer orders an additional ${int(tokens)}B tokens for the remainder of the Prior Order term at ${usd2(price)} per 1M tokens (${usd(fee(tokens, price))}).`,
    context: priorContext(
      priorHasOption
        ? `Section 5.1 of the Prior Order lets Customer buy additional tokens at ${usd2(price)} per 1M during its term.`
        : "The Prior Order has no option to buy additional tokens.",
    ),
    rationale: priorHasOption
      ? "The Prior Order already grants this option at this price. Exercising it on its stated terms is a purchase under the existing contract, not a change to it, so no contract modification."
      : "The Prior Order gave no right to more tokens, so both parties agree a change in scope and price: a contract modification (606-10-25-10), as in author-approved rr-f4-03.",
  };
};

const pairs: Pair[] = [
  {
    family: "tr-fin-01",
    title: "Financing: the one-year line, not long-looking terms",
    concept: "financing_component",
    weakness: "Term of art read in its everyday sense: 'significant financing component' fires on long-looking terms that stay within a year.",
    heldout_evidence: ["rr-f3-h01 concept 0.58–0.74, gold no", "rr-f3-h02 rule 0.24–0.25 in prose and structured, gold yes"],
    teaches: "The same installment clause with 12 vs 16 monthly payments: 11 vs 15 months from transfer to the last one. Only that gap decides the label, not the wording or the departure from net 30.",
    variants: [
      { key: "a", ...installments(12) },
      { key: "b", ...installments(16) },
    ],
    gold: (f) => f.months_transfer_to_last_payment > 12,
  },
  {
    family: "tr-mod-01",
    title: "Self-description: a clause that calls itself independent",
    concept: "contract_modification",
    weakness: "The clause's own description believed: 'a new and independent agreement' read as not a modification.",
    heldout_evidence: ["rr-f4-h05 concept 0.23–0.40, gold yes"],
    teaches: "Identical self-description in both. Only the start date decides: during the Prior Order (a modification) or at its expiry (a new contract).",
    variants: [
      { key: "a", ...independent(false) },
      { key: "b", ...independent(true) },
    ],
    gold: (f) => !f.starts_at_prior_expiry,
  },
  {
    family: "tr-mr-01",
    title: "Discount language: a 'preferred rate' inside vs below SSP",
    concept: "material_right",
    weakness: "Discount language triggers 'material right' without checking the price against the SSP range.",
    heldout_evidence: ["rr-f1-h04 rule 0.66–0.83 in structured and computed, gold no", "rr-f1-h02 rule 0.72 structured, gold no"],
    teaches: "The same 'preferred rate' clause at two prices. Only where the price sits against the SSP range decides.",
    variants: [
      { key: "a", ...preferred(1.85) },
      { key: "b", ...preferred(1.55) },
    ],
    gold: (f) => f.option_price_per_1m < SSP[0],
  },
  {
    family: "tr-mr-02",
    title: "Purchase vs option at the same discount",
    concept: "material_right",
    weakness: "A committed purchase below SSP read as a material right, which needs an option.",
    heldout_evidence: ["rr-f4-h05 rule 0.70–0.88, gold no", "rr-f4-h04 rule 0.58 computed, gold no"],
    teaches: "Same tokens, same price, same timing. Only 'purchases' vs 'may purchase up to' decides.",
    variants: [
      { key: "a", ...committedOrOption(false) },
      { key: "b", ...committedOrOption(true) },
    ],
    gold: (f) => f.is_option && f.price_per_1m < SSP[0],
  },
  {
    family: "tr-vc-01",
    title: "Fixed vs variable: an unconditional vs a usage-conditioned credit",
    concept: "variable_consideration",
    weakness: "A fixed price change read as variable consideration.",
    heldout_evidence: ["rr-f4-h04 rule 0.59–0.64, gold no", "rr-f1-h05 rule 0.62–0.68, gold no"],
    teaches: "The same 10% credit. Only whether it depends on future usage decides.",
    variants: [
      { key: "a", ...credit(false) },
      { key: "b", ...credit(true) },
    ],
    gold: (f) => f.conditional_on_usage,
  },
  {
    family: "tr-mod-02",
    title: "Existing option vs new scope",
    concept: "contract_modification",
    weakness: "Exercising an option the contract already grants read as a modification.",
    heldout_evidence: ["rr-f4-h03 rule 0.88–0.91, gold no (author-approved)"],
    teaches: "An identical order clause. Only whether the Prior Order already grants the option decides.",
    variants: [
      { key: "a", ...addOn(true) },
      { key: "b", ...addOn(false) },
    ],
    gold: (f) => !f.prior_order_add_on_option,
  },
];

const records = pairs.flatMap((p) =>
  p.variants.map((v) => {
    const y = p.gold(v.facts) ? 1 : 0;
    return {
      id: `${p.family}-${v.key}`,
      family: p.family,
      split: "train",
      title: `${p.title} (${v.key}: ${y ? "yes" : "no"})`,
      request: {
        state: { clause: v.clause, context: v.context },
        questions: {
          [`${p.concept}_concept`]: { type: "noul", instructions: Q[p.concept].concept },
          [p.concept]: { type: "noul", instructions: Q[p.concept].rule },
        },
      },
      gold: { [`${p.concept}_concept`]: { noul: y }, [p.concept]: { noul: y } },
      facts: v.facts,
      rationale: v.rationale,
      teaches: p.teaches,
      weakness: p.weakness,
      heldout_evidence: p.heldout_evidence,
      tags: [p.concept, "minimal_pair"],
      difficulty: "hard",
      labeler: "claude-draft",
      status: "draft",
    };
  }),
);

// Each pair must split: one yes, one no.
for (const p of pairs) {
  const ys = p.variants.map((v) => p.gold(v.facts));
  if (ys[0] === ys[1]) throw new Error(`${p.family}: both variants derive the same gold`);
}
// No clause may repeat a held-out clause.
const root = new URL("..", import.meta.url).pathname;
const heldout = new Set(
  (await Bun.file(`${root}data/cases.jsonl`).text()).trim().split("\n").map((l) => JSON.parse(l)).filter((c) => c.split === "heldout").map((c) => c.clause),
);
for (const r of records) if (heldout.has(r.request.state.clause)) throw new Error(`${r.id} repeats a held-out clause`);

await Bun.write(`${root}data/training-examples.jsonl`, records.map((r) => JSON.stringify(r)).join("\n") + "\n");
console.log(`${records.length} records in ${pairs.length} pairs → rev-rec/data/training-examples.jsonl`);
