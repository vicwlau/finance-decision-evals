// Build the held-out cases from facts, so every amount in the text is computed in code.
// Usage: bun rev-rec/scripts/build-heldout.ts   (replaces the split:"heldout" rows in data/cases.jsonl)
//
// Each spec holds the facts and renders the clause, the prose context, the structured `deal`
// fields, and the neutral `computed` comparisons from them. Labels follow rev-rec/README.md.
// Most look-alikes are kinds no v2 rule question names (the guardrail in eval-design.md). The independent
// review found two exceptions: the v2 trigger names rr-f2-h03's trap (a standard SLA) and the
// modification question half-names rr-f4-h03's (an option). Report the unnamed ones separately.

import { vsRange } from "./state";

const M_PER_B = 1000; // token volumes are in billions (B); prices are per 1M tokens
const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const usd2 = (n: number) => `$${n.toFixed(2)}`;
const int = (n: number) => n.toLocaleString("en-US");
const fee = (tokensB: number, perM: number) => Math.round(tokensB * M_PER_B * perM);
const pctBelow = (price: number, ref: number) => Math.round((1 - price / ref) * 100);

/** Longest gap, in either direction, when each service period is paid `dueDays` into the period. */
function periodGap(periodDays: number, dueDays: number, period: string): string {
  const before = dueDays; // service delivered before its payment
  const after = periodDays - dueDays; // payment made before the period's last service
  return after >= before
    ? `about ${Math.round(after / 30)} months (payment is due ${dueDays} days into each ${period}, about ${Math.round(after / 30)} months before that ${period}'s service ends)`
    : `about ${Math.round(before / 30)} months (payment is due ${dueDays} days into each ${period}, after that much service is delivered)`;
}

type Labels = { trigger: boolean; considerations: string[]; primary: string };
type Spec = {
  id: string;
  family: "F1" | "F2" | "F3" | "F4";
  difficulty: "easy" | "hard";
  facts: Record<string, unknown>;
  clause: string;
  context: string;
  deal: Record<string, unknown>;
  computed: Record<string, unknown>;
  labels: Omit<Labels, "primary">;
  why: string;
};

// ---------------------------------------------------------------- F1: token pricing (material rights)
const F1 = { term_years: 3, prepaid_tokens_b: 2400, prepaid_price_per_1m: 2.25, ssp_range_per_1m: [2.1, 2.4] as [number, number], list_price_per_1m: 2.6 };
const f1Fee = fee(F1.prepaid_tokens_b, F1.prepaid_price_per_1m);
const f1Context = (extra = "") =>
  `Customer: enterprise AI platform customer on a three-year term. Prepaid commitment: ${int(F1.prepaid_tokens_b)}B tokens over the term for ${usd(f1Fee)} (${usd2(F1.prepaid_price_per_1m)} per 1M tokens). Standalone selling price (SSP) for committed tokens for customers of this size: ${usd2(F1.ssp_range_per_1m[0])} to ${usd2(F1.ssp_range_per_1m[1])} per 1M tokens. List price: ${usd2(F1.list_price_per_1m)} per 1M tokens.${extra}`;
const f1Deal = (extra: Record<string, unknown> = {}) => ({
  customer: "enterprise AI platform customer",
  term: `${F1.term_years} years`,
  prepaid_commitment: `${int(F1.prepaid_tokens_b)}B tokens for ${usd(f1Fee)} (${usd2(F1.prepaid_price_per_1m)} per 1M tokens)`,
  ssp_per_1m_tokens: `${usd2(F1.ssp_range_per_1m[0])} to ${usd2(F1.ssp_range_per_1m[1])}`,
  list_price_per_1m_tokens: usd2(F1.list_price_per_1m),
  ...extra,
});
const f1Facts = (extra: Record<string, unknown>) => ({ ...F1, prepaid_fee_usd: f1Fee, ...extra });
const vsSsp = (p: number) => `${usd2(p)} per 1M tokens is ${vsRange(p, F1.ssp_range_per_1m)}`;

const discounted = Math.round(F1.list_price_per_1m * 0.9 * 100) / 100; // 10% off list
const floor = 1.8;

const f1: Spec[] = [
  {
    id: "rr-f1-h01", family: "F1", difficulty: "easy",
    facts: f1Facts({ term_type: "add_on_option", add_on_price_per_1m: 1.25, add_on_increment_b: 50 }),
    clause: `Additional Tokens. At any time during the Term, Customer may order additional tokens, in increments of 50B, at ${usd2(1.25)} per 1M tokens.`,
    context: f1Context(), deal: f1Deal(), computed: { add_on_price_vs_ssp: vsSsp(1.25) },
    labels: { trigger: true, considerations: ["material_right"] },
    why: `${usd2(1.25)} is ${pctBelow(1.25, F1.ssp_range_per_1m[0])}% below the low end of SSP. An option at a discount the customer would not otherwise get is a material right (606-10-55-42).`,
  },
  {
    id: "rr-f1-h02", family: "F1", difficulty: "hard",
    facts: f1Facts({ term_type: "add_on_option", add_on_discount_off_list_pct: 10, add_on_price_per_1m: discounted }),
    clause: "Additional Tokens. Customer may purchase additional tokens during the Term at a ten percent (10%) discount to the list price in effect on the Effective Date.",
    context: f1Context(), deal: f1Deal(), computed: { add_on_price_vs_ssp: `${vsSsp(discounted)} (10% off the list price)` },
    labels: { trigger: false, considerations: [] },
    why: `10% off the ${usd2(F1.list_price_per_1m)} list price is ${usd2(discounted)} per 1M, inside the SSP range, so the option gives no incremental discount. Reading test: the discount is stated as a percentage, not a price.`,
  },
  {
    id: "rr-f1-h03", family: "F1", difficulty: "hard",
    facts: f1Facts({ term_type: "token_expiry", annual_allotment_tokens_b: F1.prepaid_tokens_b / F1.term_years }),
    clause: "Token Expiry. Prepaid Tokens not used by the end of each contract year expire. Expired tokens are not refundable and do not carry forward.",
    context: f1Context(` The prepaid commitment is allotted as ${int(F1.prepaid_tokens_b / F1.term_years)}B tokens per contract year. Under the vendor's standard order form, prepaid tokens are allotted by contract year, and unused tokens expire at the end of each contract year.`),
    deal: f1Deal({
      annual_allotment: `${int(F1.prepaid_tokens_b / F1.term_years)}B tokens per contract year`,
      standard_order_form: "prepaid tokens allotted by contract year; unused tokens expire at the end of each contract year",
    }),
    computed: {},
    labels: { trigger: false, considerations: [] },
    why: "Look-alike: a token clause with no option, refund, or financing. Use-it-or-lose-it expiry is standard; unused tokens become breakage, which this label set doesn't cover.",
  },
  {
    id: "rr-f1-h04", family: "F1", difficulty: "hard",
    facts: f1Facts({ term_type: "add_on_option", add_on_price_per_1m: 2.3 }),
    clause: `Preferred Add-On Pricing. In recognition of Customer's prepaid commitment, Customer may purchase additional tokens during the Term at a preferred rate of ${usd2(2.3)} per 1M tokens.`,
    context: f1Context(), deal: f1Deal(), computed: { add_on_price_vs_ssp: vsSsp(2.3) },
    labels: { trigger: false, considerations: [] },
    why: `Look-alike: "preferred rate" sounds like a concession, but ${usd2(2.3)} is inside the SSP range, so the option gives no incremental discount and no material right.`,
  },
  {
    id: "rr-f1-h05", family: "F1", difficulty: "hard",
    facts: f1Facts({ term_type: "conditional_add_on_option", threshold_tokens_b: 500, add_on_price_per_1m: 0.8, standard_volume_floor_per_1m: floor }),
    clause: `Volume Add-On. Customer may purchase add-on tokens at ${usd2(F1.prepaid_price_per_1m)} per 1M tokens. Once Customer's add-on purchases in a contract year exceed 500B tokens, Customer may purchase further tokens in that contract year at ${usd2(0.8)} per 1M tokens.`,
    context: f1Context(` Standard volume pricing for customers of this size bottoms out at ${usd2(floor)} per 1M tokens.`),
    deal: f1Deal({ standard_volume_price_floor_per_1m_tokens: usd2(floor) }),
    computed: { add_on_price_vs_ssp: `${vsSsp(0.8)}, and ${pctBelow(0.8, floor)}% below the standard volume price floor` },
    labels: { trigger: true, considerations: ["material_right"] },
    why: `Past 500B tokens a year the customer may buy at ${usd2(0.8)}, below both the SSP range and the standard volume floor: an option at a discount others don't get, so a material right. The threshold only changes when it applies.`,
  },
];

// ---------------------------------------------------------------- F2: refunds vs SLA credits
const f2Context = (sub: string, sla: string) => `Customer: enterprise customer. ${sub} The vendor's standard SLA gives ${sla}.`;
const f2Deal = (sub: string, sla: string) => ({ customer: "enterprise", subscription: sub, standard_sla: sla });
const SUB = "Three-year SaaS subscription at $480,000 per year, billed annually in advance.";
const SLA10 = "service credits of up to 10% of the monthly fee, applied against future invoices";
const SLA15 = "service credits of up to 15% of the monthly fee, issued on request and applied against future invoices";
const LICENSE = "Perpetual on-premise software license for $750,000, delivered at signing.";
const LICENSE_STD = "The vendor's standard license terms treat the Software as accepted on delivery and give a 90-day warranty that it conforms to its documentation, with repair or replacement as the remedy.";

const f2: Spec[] = [
  {
    id: "rr-f2-h01", family: "F2", difficulty: "easy",
    facts: { term_type: "acceptance_refund", license_fee_usd: 750000, acceptance_window_days: 60, refund: "full" },
    clause: "Acceptance. If the Software does not meet the Acceptance Criteria in Exhibit B within sixty (60) days after delivery, Customer may return the Software and receive a full refund of the license fee.",
    context: `Customer: enterprise customer. ${LICENSE} ${LICENSE_STD}`,
    deal: { customer: "enterprise", license: LICENSE, standard_license_terms: LICENSE_STD },
    computed: {},
    labels: { trigger: true, considerations: ["refund_return", "variable_consideration"] },
    why: "Cash back if acceptance fails puts the fee at risk: a refund right, and refunds are variable consideration (606-10-32-6). Acceptance criteria beyond the vendor's standard accept-on-delivery terms also warrant review.",
  },
  {
    id: "rr-f2-h02", family: "F2", difficulty: "hard",
    facts: { term_type: "no_refund" },
    clause: "Fees. All fees are non-refundable, except as expressly stated in this Agreement or required by law.",
    context: f2Context(SUB, SLA10), deal: f2Deal(SUB, SLA10), computed: {},
    labels: { trigger: false, considerations: [] },
    why: "Negation look-alike: a standard no-refund clause. It mentions refunds only to rule them out.",
  },
  {
    id: "rr-f2-h03", family: "F2", difficulty: "hard",
    facts: { term_type: "sla", target_availability: 0.995, credit_per_step: 0.05, step: "each full 0.5% below 99.5%", cap_pct_monthly_fee: 0.15, standard_cap_pct: 0.15, cash_option: false },
    clause: "Availability. If monthly Availability falls below 99.5%, Customer may request a service credit of 5% of that month's fees for each full 0.5% below 99.5%, not to exceed 15% of that month's fees. Credits are applied to future invoices.",
    context: f2Context(SUB, SLA15), deal: f2Deal(SUB, SLA15),
    computed: { sla_vs_standard: ["maximum credit 15% of the monthly fee, same as the standard SLA", "credits only, same as the standard SLA"] },
    labels: { trigger: false, considerations: ["variable_consideration"] },
    why: "Matches this vendor's standard SLA (credits up to 15%, applied to future invoices). Service credits are variable consideration in substance, but the standard SLA is handled at the policy level, so no deal review (decision #004).",
  },
  {
    id: "rr-f2-h04", family: "F2", difficulty: "easy",
    facts: { term_type: "credit_cash_out", standard_cap_pct: 0.1, cash_option: true },
    clause: "Service Credits. Service credits accrued under the SLA that remain unused at the end of the Term will be paid to Customer in cash within thirty (30) days.",
    context: f2Context(SUB, SLA10), deal: f2Deal(SUB, SLA10),
    computed: { sla_vs_standard: ["unused credits paid in cash at the end of the term, vs credits only in the standard SLA"] },
    labels: { trigger: true, considerations: ["variable_consideration", "refund_return"] },
    why: "Paying unused credits in cash goes beyond the credit-only standard SLA. Credits are variable consideration, and the cash payout returns fees to the customer.",
  },
  {
    id: "rr-f2-h05", family: "F2", difficulty: "hard",
    facts: { term_type: "success_fee", metric: "cost_per_resolved_ticket", target_reduction: 0.2, window_months: 12, success_fee_usd: 150000 },
    clause: `Success Fee. If Customer's average cost per resolved ticket falls by at least 20% during the first contract year, Customer will pay Vendor a one-time success fee of ${usd(150000)}.`,
    context: f2Context(SUB, SLA10), deal: f2Deal(SUB, SLA10), computed: {},
    labels: { trigger: true, considerations: ["variable_consideration"] },
    why: "A bonus that depends on the customer's outcome: variable consideration to estimate and likely constrain. The look-alike: it pays the vendor more, and nothing is refunded.",
  },
];

// ---------------------------------------------------------------- F3: payment terms (financing)
const TERMS_JP = "The vendor's standard payment terms are net 30 in North America; net 90 to 120 days is customary for its customers in Japan.";
const TERMS = { north_america: "net 30", japan: "net 90-120 (customary)" };
const f3Deal = (location: string, subscription: string, delivery: string) => ({
  customer_location: location, subscription, service_delivery: delivery, vendor_standard_payment_terms: TERMS,
});

const installments = 18, installment = 50000;
const prepayMonths = 24, prepayFee = 1200000;
const arrearsDays = 60;

const f3: Spec[] = [
  {
    id: "rr-f3-h01", family: "F3", difficulty: "easy",
    facts: { term_type: "payment_terms", days_invoice_to_payment: 90, annual_fee_usd: 720000, standard_payment_terms: TERMS },
    clause: "Payment Terms. Invoices are payable within ninety (90) days of the invoice date.",
    context: `Customer based in Japan. Subscription of $720,000 per year for two years, invoiced annually in advance at the start of each year. Service is delivered evenly over each year. ${TERMS_JP}`,
    deal: f3Deal("Japan", "$720,000 per year for two years, invoiced annually in advance at the start of each year", "evenly over each year"),
    computed: { longest_gap_between_service_and_payment: periodGap(365, 90, "12-month service year") },
    labels: { trigger: false, considerations: [] },
    why: "Customary Japanese terms, well inside one year: the practical expedient applies (606-10-32-18) and nothing departs from the vendor's standard.",
  },
  {
    id: "rr-f3-h02", family: "F3", difficulty: "easy",
    facts: { term_type: "installments", license_fee_usd: installments * installment, installments, installment_usd: installment, months_transfer_to_last_payment: installments - 1, standard_payment_terms: TERMS },
    clause: `Payment. The license fee is payable in eighteen (18) equal monthly installments of ${usd(installment)}, the first due on the delivery date.`,
    context: `Customer based in the United States. Perpetual software license for ${usd(installments * installment)}, delivered and transferred at signing. ${TERMS_JP}`,
    deal: f3Deal("United States", `perpetual software license, ${usd(installments * installment)}`, "license delivered and transferred at signing"),
    computed: { longest_gap_between_service_and_payment: `${installments - 1} months (last installment after the license is transferred)` },
    labels: { trigger: true, considerations: ["financing_component"] },
    why: `Payments run ${installments - 1} months past transfer, so the one-year practical expedient doesn't apply and the vendor must assess a significant financing component.`,
  },
  {
    id: "rr-f3-h03", family: "F3", difficulty: "hard",
    facts: { term_type: "quarterly_billing", annual_fee_usd: 400000, invoices_per_year: 4, days_invoice_to_payment: 30, standard_payment_terms: TERMS },
    clause: "Invoicing. Annual fees are invoiced quarterly in advance, in four equal installments, each payable net 30.",
    context: `Customer based in the United States. Subscription of $400,000 per year for two years. Service is delivered evenly over each year. ${TERMS_JP}`,
    deal: f3Deal("United States", "$400,000 per year for two years", "evenly over each year"),
    computed: { longest_gap_between_service_and_payment: periodGap(91, 30, "3-month quarter") },
    labels: { trigger: false, considerations: [] },
    why: "Look-alike: 'installments', but each quarter is paid 30 days into the quarter, so no gap approaches a year. A billing-frequency choice, not a financing or revenue issue.",
  },
  {
    id: "rr-f3-h04", family: "F3", difficulty: "easy",
    facts: { term_type: "prepayment", fee_usd: prepayFee, service_months: prepayMonths, max_months_payment_to_service: prepayMonths - 1, standard_payment_terms: TERMS },
    clause: `Payment. Customer will pay the fees for the full ${prepayMonths}-month subscription, ${usd(prepayFee)}, at signing.`,
    context: `Customer based in the United States. ${prepayMonths}-month subscription, ${usd(prepayFee)} in total, with service delivered evenly over ${prepayMonths} months. ${TERMS_JP}`,
    deal: f3Deal("United States", `${prepayMonths}-month subscription, ${usd(prepayFee)} in total`, `evenly over ${prepayMonths} months`),
    computed: { longest_gap_between_service_and_payment: `${prepayMonths - 1} months (payment made before service)` },
    labels: { trigger: true, considerations: ["financing_component"] },
    why: `Payment precedes the last service by about ${prepayMonths - 1} months, beyond one year, so the vendor must assess a significant financing component. Whether it's significant is the assessment's outcome.`,
  },
  {
    id: "rr-f3-h05", family: "F3", difficulty: "hard",
    facts: { term_type: "arrears", annual_fee_usd: 360000, service_months: 12, invoiced_at_month: 12, days_invoice_to_payment: arrearsDays, max_months_service_to_payment: 12 + Math.round(arrearsDays / 30) - 1, standard_payment_terms: TERMS },
    clause: `Invoicing. Fees for the 12-month Initial Term are invoiced at the end of the Initial Term and are payable sixty (${arrearsDays}) days after the invoice date.`,
    context: `Customer based in the United States. Initial Term of 12 months at $360,000, with service delivered evenly over the 12 months. ${TERMS_JP}`,
    deal: f3Deal("United States", "12-month initial term, $360,000", "evenly over 12 months"),
    computed: { longest_gap_between_service_and_payment: `about ${12 + Math.round(arrearsDays / 30) - 1} months (the first month of service, invoiced at month 12 and paid ${arrearsDays} days later)` },
    labels: { trigger: true, considerations: ["financing_component"] },
    why: "Threshold case: early months of service are paid about 13 months later, beyond one year, so the expedient doesn't cover the contract and the vendor must assess (likely insignificant). Billing a full year in arrears is also non-standard.",
  },
];

// ---------------------------------------------------------------- F4: early renewal (contract modification)
type Prior = { start: string; end: string; years: number; tokensPerYearB: number; price: number; asOf: string; monthsLeft: number; addOn?: string };
const priorAnnual = (p: Prior) => fee(p.tokensPerYearB, p.price);
const priorContext = (p: Prior, extra = "") => {
  const annual = priorAnnual(p);
  const unused = (annual * p.monthsLeft) / 12;
  return `Prior Order: ${p.years}-year term from ${p.start} to ${p.end} for ${int(p.tokensPerYearB * p.years)}B tokens and ${usd(annual * p.years)}, billed ${usd(annual)} annually in advance. As of ${p.asOf}, ${p.monthsLeft} months remain, and ${usd(unused)} of the current year's fee covers that unused period. SSP for committed tokens: $2.00 to $2.20 per 1M tokens. ${p.addOn ?? "The Prior Order has no option to buy additional tokens."}${extra}`;
};
const priorDeal = (p: Prior) => {
  const annual = priorAnnual(p);
  return {
    prior_order: {
      term: `${p.start} to ${p.end}`,
      tokens: `${int(p.tokensPerYearB * p.years)}B`,
      fee: `${usd(annual * p.years)}, billed ${usd(annual)} annually in advance`,
      add_on_option: p.addOn ? p.addOn : "none",
    },
    as_of: p.asOf,
    months_remaining_on_prior_order: p.monthsLeft,
    unused_prepaid_value: usd((annual * p.monthsLeft) / 12),
    ssp_per_1m_tokens: "$2.00 to $2.20",
  };
};
const priorFacts = (p: Prior) => {
  const annual = priorAnnual(p);
  return {
    prior_term: [p.start, p.end], prior_term_years: p.years, prior_tokens_b: p.tokensPerYearB * p.years,
    prior_fee_usd: annual * p.years, annual_fee_usd: annual, change_date: p.asOf, months_remaining: p.monthsLeft,
    unused_prepaid_usd: (annual * p.monthsLeft) / 12, ssp_range_per_1m: [2.0, 2.2], prior_order_add_on_option: !!p.addOn,
  };
};

const P1: Prior = { start: "1 September 2024", end: "31 August 2027", years: 3, tokensPerYearB: 500, price: 2.0, asOf: "1 March 2027", monthsLeft: 6 };
const P2: Prior = { start: "1 January 2025", end: "31 December 2027", years: 3, tokensPerYearB: 600, price: 2.0, asOf: "1 June 2027", monthsLeft: 7 };
const P3: Prior = { ...P2, addOn: "Section 4.2 of the Prior Order lets Customer buy additional tokens at $2.10 per 1M during its term." };
const P4: Prior = { start: "1 January 2025", end: "31 December 2026", years: 2, tokensPerYearB: 1000, price: 2.0, asOf: "1 July 2026", monthsLeft: 6 };
const P5: Prior = { start: "1 April 2025", end: "31 March 2028", years: 3, tokensPerYearB: 800, price: 2.0, asOf: "1 October 2027", monthsLeft: 6 };

const newPrice = 1.9, newTokensB = 1200;
const unusedP1 = (priorAnnual(P1) * P1.monthsLeft) / 12;
const addB = 100, addPrice = 2.1;
const extPrice = 1.8;
const remainingB = (P4.tokensPerYearB * P4.monthsLeft) / 12;
const reduction = fee(remainingB, 2.0 - extPrice);
const supB = 300, supPrice = 1.4;

const f4: Spec[] = [
  {
    id: "rr-f4-h01", family: "F4", difficulty: "easy",
    facts: { ...priorFacts(P1), term_type: "early_renewal", credit_usd: unusedP1, new_term_months: 24, new_tokens_b_per_year: newTokensB, new_annual_fee_usd: fee(newTokensB, newPrice) },
    clause: `Early Renewal. Effective ${P1.asOf}, this Order Form terminates and replaces the Prior Order. The ${usd(unusedP1)} of prepaid fees for the unused portion of the Prior Order is applied to this Order Form's first invoice. This Order Form has a 24-month term at ${int(newTokensB)}B tokens per year for ${usd(fee(newTokensB, newPrice))} per year.`,
    context: priorContext(P1), deal: priorDeal(P1),
    computed: { change_timing: `${P1.monthsLeft} months before the Prior Order ends`, credit_carried_from_prior_order: usd(unusedP1) },
    labels: { trigger: true, considerations: ["contract_modification"] },
    why: "The Prior Order ends early and its unused consideration moves into a new, larger order: a contract modification, likely accounted for prospectively (606-10-25-13(a)).",
  },
  {
    id: "rr-f4-h02", family: "F4", difficulty: "hard",
    facts: { ...priorFacts(P2), term_type: "administrative_amendment" },
    clause: `Amendment No. 2. Effective ${P2.asOf}, Customer's billing address and invoice contact are updated as set out in Schedule 1. All other terms of the Prior Order remain unchanged.`,
    context: priorContext(P2), deal: priorDeal(P2), computed: { change_timing: `${P2.monthsLeft} months before the Prior Order ends` },
    labels: { trigger: false, considerations: [] },
    why: "Look-alike no question names: an administrative amendment. It changes neither scope nor price, so it's not a contract modification under ASC 606.",
  },
  {
    id: "rr-f4-h03", family: "F4", difficulty: "hard",
    facts: { ...priorFacts(P3), term_type: "option_exercise", added_tokens_b: addB, added_price_per_1m: addPrice, added_fee_usd: fee(addB, addPrice) },
    clause: `Additional Tokens. Under Section 4.2 of the Prior Order, Customer orders an additional ${addB}B tokens for ${usd(fee(addB, addPrice))}. This order is placed under, and governed by, the Prior Order.`,
    context: priorContext(P3), deal: priorDeal(P3),
    computed: { change_timing: `${P3.monthsLeft} months before the Prior Order ends`, added_tokens_price_vs_ssp: `${usd2(addPrice)} per 1M tokens is ${vsRange(addPrice, [2.0, 2.2])}` },
    labels: { trigger: false, considerations: [] },
    why: "Exercising an option already in the Prior Order, priced within SSP, is a purchase under existing terms: the parties approve no change, so it isn't a contract modification, and there's no material right.",
  },
  {
    id: "rr-f4-h04", family: "F4", difficulty: "hard",
    facts: { ...priorFacts(P4), term_type: "blend_and_extend", reduced_price_per_1m: extPrice, remaining_tokens_b: remainingB, reduction_credit_usd: reduction, extension_months: 12, extension_tokens_b: P4.tokensPerYearB, extension_fee_usd: fee(P4.tokensPerYearB, extPrice) },
    clause: `Amendment. Effective ${P4.asOf}, the price for the remaining ${P4.monthsLeft} months of the Prior Order is reduced to ${usd2(extPrice)} per 1M tokens; the resulting ${usd(reduction)} reduction is credited against Customer's next invoice. The term is extended by twelve (12) months at ${int(P4.tokensPerYearB)}B tokens for ${usd(fee(P4.tokensPerYearB, extPrice))}.`,
    context: priorContext(P4), deal: priorDeal(P4),
    computed: { change_timing: `${P4.monthsLeft} months before the Prior Order ends`, reduced_price_vs_ssp: `${usd2(extPrice)} per 1M tokens is ${vsRange(extPrice, [2.0, 2.2])}` },
    labels: { trigger: true, considerations: ["contract_modification"] },
    why: "Blend and extend: it changes price for the remaining term and adds 12 months of scope, so it's a contract modification (606-10-25-10). The price cut on remaining service rules out separate-contract treatment (606-10-25-12).",
  },
  {
    id: "rr-f4-h05", family: "F4", difficulty: "hard",
    facts: { ...priorFacts(P5), term_type: "supplemental_order", added_tokens_b: supB, added_price_per_1m: supPrice, added_fee_usd: fee(supB, supPrice), disclaimer: "independent_agreement" },
    clause: `Supplemental Order. This Supplemental Order is a new and independent agreement and does not modify the Prior Order. Customer purchases an additional ${supB}B tokens for use during the remaining ${P5.monthsLeft} months of the Prior Order at ${usd2(supPrice)} per 1M tokens (${usd(fee(supB, supPrice))}).`,
    context: priorContext(P5), deal: priorDeal(P5),
    computed: { change_timing: `${P5.monthsLeft} months before the Prior Order ends`, added_tokens_price_vs_ssp: `${usd2(supPrice)} per 1M tokens is ${vsRange(supPrice, [2.0, 2.2])}` },
    labels: { trigger: true, considerations: ["contract_modification"] },
    why: "Self-describing: it calls itself independent, but the added tokens are priced below SSP and tied to the Prior Order's remaining term, so it isn't a separate contract (606-10-25-12). It's a modification of the Prior Order.",
  },
];

// ---------------------------------------------------------------- write
const specs = [...f1, ...f2, ...f3, ...f4];
const rows = specs.map((s) => ({
  id: s.id,
  family: s.family,
  clause: s.clause,
  context: s.context,
  facts: s.facts,
  state: { deal: s.deal, computed: s.computed },
  labels: { ...s.labels, primary: "none" },
  difficulty: s.difficulty,
  why: s.why,
  status: "draft",
  split: "heldout",
}));

const path = new URL("../data/cases.jsonl", import.meta.url).pathname;
const existing = (await Bun.file(path).text()).trim().split("\n").filter((l) => JSON.parse(l).split !== "heldout");
await Bun.write(path, [...existing, ...rows.map((r) => JSON.stringify(r))].join("\n") + "\n");
console.log(`${rows.length} held-out cases written (${existing.length} other cases kept)`);
