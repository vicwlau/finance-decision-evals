// Formatting helpers for numbers that come from data/results.json. The page never types a
// figure by hand; it formats what the export wrote.

const whole = (x: number) => Math.round(x * 100);

/** 0.933 -> "93%" */
export const pct = (x: number) => `${whole(x)}%`;

/** [0.75, 0.75, 0.7] -> "70–75%" (or "75%" when every value rounds the same) */
export function pctRange(xs: number[]) {
  const lo = whole(Math.min(...xs));
  const hi = whole(Math.max(...xs));
  return lo === hi ? `${lo}%` : `${lo}–${hi}%`;
}

/** 0.253 -> "0.25" */
export const prob = (x: number) => x.toFixed(2);

/** [0.233, 0.397, 0.33] -> "0.23–0.40" */
export function probRange(xs: number[]) {
  const lo = prob(Math.min(...xs));
  const hi = prob(Math.max(...xs));
  return lo === hi ? lo : `${lo}–${hi}`;
}

/** 1.85 -> "$1.85" */
export const money = (x: number) => `$${x.toFixed(2)}`;

/** 38 -> "$38"; 960000 -> "$960,000" */
export const usdWhole = (x: number) => `$${Math.round(x).toLocaleString("en-US")}`;

/**
 * A short quote of a clause body for an excerpt card: its first sentence, trimmed from the front
 * (the deciding term usually sits at the end) to about `max` characters, with ellipses where text
 * was cut. It prefers to start after a comma when that leaves most of the sentence.
 */
export function shortQuote(body: string, max = 120) {
  const sentences = body.match(/[^.]+(?:\.(?=\s|$)|$)/g) ?? [body];
  let first = sentences[0].trim();
  const more = sentences.length > 1;
  let cutFront = false;
  if (first.length > max) {
    for (let i = first.indexOf(", "); i >= 0; i = first.indexOf(", ", i + 2)) {
      const rest = first.slice(i + 2);
      if (rest.length <= max && rest.length >= max * 0.6) {
        first = rest.charAt(0).toUpperCase() + rest.slice(1);
        cutFront = true;
        break;
      }
    }
  }
  while (first.length > max && first.includes(" ")) {
    first = first.slice(first.indexOf(" ") + 1);
    cutFront = true;
  }
  return `${cutFront ? "…" : ""}${first}${more ? " …" : ""}`;
}

/** 5400000 -> "$5.4M" */
export function compactUsd(x: number) {
  if (x >= 1e6) return `$${(x / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (x >= 1e3) return `$${(x / 1e3).toFixed(0)}K`;
  return `$${x}`;
}

/** "Additional Tokens" -> "Additional tokens" */
export const sentenceCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** Small counts as words, for prose: 4 -> "four". */
export function words(n: number) {
  const w = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen",
    "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  return w[n] ?? String(n);
}

/** "Payment. The license fee…" -> "Payment" (the clause's own heading). */
export const clauseHeading = (clause: string) => clause.slice(0, clause.indexOf("."));

/** "Payment. The license fee…" -> "The license fee…" */
export const clauseBody = (clause: string) => clause.slice(clause.indexOf(".") + 1).trim();

/** "about 9 months (payment is due…)" -> "about 9 months" */
export const beforeParen = (s: string) => s.split(" (")[0];

/** ISO timestamp -> "October 2026" */
export const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** ISO timestamp -> "3 Oct 2026" (the UTC date) */
export const dayMonthYear = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** A SHA-256 hex digest -> its first eight characters and an ellipsis: "0e20378c…" */
export const shortHash = (hex: string) => `${hex.slice(0, 8)}…`;

/** ASC 606 consideration keys as readers name them. */
export const CONSIDERATION: Record<string, string> = {
  material_right: "Material right",
  variable_consideration: "Variable consideration",
  refund_return: "Refund",
  financing_component: "Financing component",
  contract_modification: "Contract modification",
  termination_convenience: "Termination for convenience",
};
