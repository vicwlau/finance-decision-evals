// Build the `state` sent to Jev for a case, in one of three shapes:
//   prose       {clause, context}: the case's written context paragraph (v0 shape)
//   structured  {clause, deal}: the same information as named fields, built from `facts`
//   computed    {clause, deal, computed}: plus neutral comparisons done in code
// `computed` holds comparisons only ("50% below the low end of the SSP range"), never
// conclusions ("a material right"), and never uses label-like facts such as `disclaimer`.

export type StateMode = "prose" | "structured" | "computed";
export const STATE_MODES: StateMode[] = ["prose", "structured", "computed"];

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const usd2 = (n: number) => `$${n.toFixed(2)}`;
const int = (n: number) => n.toLocaleString("en-US");

/** Position of a price relative to a [low, high] range, in words. */
export function vsRange(price: number, [lo, hi]: [number, number], what = "the SSP range"): string {
  if (price < lo) return `${Math.round((1 - price / lo) * 100)}% below the low end of ${what}`;
  if (price > hi) return `${Math.round((price / hi - 1) * 100)}% above the high end of ${what}`;
  return `within ${what}`;
}

function vsFloor(price: number, floor: number): string {
  if (price === floor) return "equal to the standard volume price floor";
  const pct = Math.round(Math.abs(1 - price / floor) * 100);
  return `${pct}% ${price < floor ? "below" : "above"} the standard volume price floor`;
}

/** The vendor's standard payment terms by region, when the case states them. */
function standardTerms(f: Record<string, any>): Record<string, unknown> {
  return f.standard_payment_terms ? { vendor_standard_payment_terms: f.standard_payment_terms } : {};
}

type Case = {
  id: string;
  family: string;
  clause: string;
  context: string;
  facts: Record<string, any>;
  state?: { deal: Record<string, unknown>; computed: Record<string, unknown> };
};

function deal(c: Case): Record<string, unknown> {
  const f = c.facts;
  switch (c.family) {
    case "F1":
      return {
        customer: "mid-market AI software company",
        term: `${f.term_years} years`,
        prepaid_commitment: `${int(f.prepaid_tokens_b)}B tokens for ${usd(f.prepaid_fee_usd)} (${usd2(f.prepaid_price_per_1m)} per 1M tokens)`,
        ssp_per_1m_tokens: `${usd2(f.ssp_range_per_1m[0])} to ${usd2(f.ssp_range_per_1m[1])}`,
        list_price_per_1m_tokens: usd2(f.list_price_per_1m),
        ...(f.standard_volume_floor_per_1m != null && {
          standard_volume_price_floor_per_1m_tokens: usd2(f.standard_volume_floor_per_1m),
        }),
      };
    case "F2":
      return {
        customer: "enterprise",
        subscription: "three-year SaaS subscription, billed annually in advance",
        standard_sla: "service credits of up to 10% of the monthly fee, applied against future invoices",
      };
    case "F3":
      return f.service_months
        ? {
            customer_location: "Japan",
            subscription: `three-year subscription, ${usd(f.fee_usd)} in total`,
            service_delivery: `evenly over ${f.service_months} months`,
            ...standardTerms(f),
          }
        : {
            customer_location: "Japan",
            subscription: "$600,000 per year for three years, invoiced annually in advance at the start of each year",
            service_delivery: "evenly over each year",
            ...standardTerms(f),
          };
    case "F4":
      return {
        prior_order: {
          term: "1 April 2024 to 31 March 2027",
          tokens: `${int(f.prior_tokens_b)}B`,
          fee: `${usd(f.prior_fee_usd)}, billed ${usd(f.annual_fee_usd)} annually in advance`,
          add_on_option: f.prior_order_add_on_option ? "yes" : "none",
        },
        as_of: "1 October 2026",
        months_remaining_on_prior_order: f.months_remaining,
        unused_prepaid_value: usd(f.unused_prepaid_usd),
        ssp_per_1m_tokens: `${usd2(f.ssp_range_per_1m[0])} to ${usd2(f.ssp_range_per_1m[1])}`,
      };
    default:
      throw new Error(`no structured state for family ${c.family}`);
  }
}

function computed(c: Case): Record<string, unknown> {
  const f = c.facts;
  const out: Record<string, unknown> = {};
  if (f.add_on_price_per_1m != null)
    out.add_on_price_vs_ssp = `${usd2(f.add_on_price_per_1m)} per 1M tokens is ${vsRange(f.add_on_price_per_1m, f.ssp_range_per_1m)}`;
  if (f.overage_price_per_1m != null)
    out.overage_price_vs_ssp = `${usd2(f.overage_price_per_1m)} per 1M tokens is ${vsRange(f.overage_price_per_1m, f.ssp_range_per_1m)}`;
  if (f.tiers_per_1m)
    out.overage_tiers_vs_ssp = f.tiers_per_1m.map(([volume, price]: [number | null, number]) => {
      const tier = volume ? `next ${int(volume)}B tokens` : "after that";
      const floor = f.standard_volume_floor_per_1m != null ? `, and ${vsFloor(price, f.standard_volume_floor_per_1m)}` : "";
      return `${usd2(price)} per 1M tokens (${tier}) is ${vsRange(price, f.ssp_range_per_1m)}${floor}`;
    });
  if (f.term_type === "sla") {
    const cap = Math.round(f.cap_pct_monthly_fee * 100);
    out.sla_vs_standard = [
      cap === 10 ? "maximum credit 10% of the monthly fee, same as the standard SLA" : `maximum credit ${cap}% of the monthly fee, vs 10% in the standard SLA`,
      f.cash_option ? "cash payment allowed, vs credits only in the standard SLA" : "credits only, same as the standard SLA",
    ];
  }
  if (c.family === "F3") {
    // Annual invoices in advance, paid D days into the service year: the longest gap in either
    // direction is the larger of D (service before payment) and 365 - D (payment before service).
    const due = f.days_invoice_to_payment ?? f.max_days_invoice_to_payment;
    if (due != null) {
      const gap = Math.max(due, 365 - due);
      out.longest_gap_between_service_and_payment = `about ${Math.round(gap / 30)} months (payment is due about ${due} days into each 12-month service year, about ${Math.round((365 - due) / 30)} months before that year's service ends)`;
    }
    else if (f.payment_month != null)
      out.longest_gap_between_service_and_payment = `${f.payment_month - 1} months (service delivered before payment)`;
    else if (f.service_months != null)
      out.longest_gap_between_service_and_payment = `${f.service_months - 1} months (payment made before service)`;
  }
  if (c.family === "F4") {
    out.change_timing =
      f.term_type === "renewal_at_expiry"
        ? "the new term starts when the Prior Order expires"
        : `${f.months_remaining} months before the Prior Order ends`;
    if (f.credit_usd != null) out.credit_carried_from_prior_order = usd(f.credit_usd);
    if (f.added_price_per_1m != null)
      out.added_tokens_price_vs_ssp = `${usd2(f.added_price_per_1m)} per 1M tokens is ${vsRange(f.added_price_per_1m, f.ssp_range_per_1m)}`;
  }
  return out;
}

export function buildState(c: Case, mode: StateMode): Record<string, unknown> {
  if (mode === "prose") return { clause: c.clause, context: c.context };
  // Held-out cases carry their structured state, built from facts by build-heldout.ts.
  const pre = c.state;
  if (pre) {
    const state: Record<string, unknown> = { clause: c.clause, deal: pre.deal };
    if (mode === "computed" && Object.keys(pre.computed).length) state.computed = pre.computed;
    return state;
  }
  const state: Record<string, unknown> = { clause: c.clause, deal: deal(c) };
  if (mode === "computed") {
    const extra = computed(c);
    if (Object.keys(extra).length) state.computed = extra;
  }
  return state;
}
