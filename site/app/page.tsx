import type { CSSProperties, ReactNode } from "react";
import { tickmarkId } from "@vicwlau/tickmark";

import {
  A_BUILT,
  A_START,
  B_FLAG_AT,
  B_MARKERS,
  D_PLAY_MS,
  SHOW_FIGURE_D,
  SLOT_RATIO,
  USE_HAIRLINE,
} from "@/components/figure-config";
import { FigureSlot } from "@/components/figure-slot";
import { PileFigure, ScanFigure } from "@/components/figures";
import {
  beforeParen,
  CONSIDERATION,
  clauseBody,
  clauseHeading,
  money,
  monthYear,
  pct,
  pctRange,
  prob,
  sentenceCase,
  shortQuote,
  usdWhole,
} from "@/components/format";
import { CountUp, MOTION_BOOT, PlayScene, Reveal, ScanScene, ScrollScene } from "@/components/motion";
import { FixLine } from "@/components/prob-line";
import { RangeChart } from "@/components/range-chart";
import results from "@/data/results.json";

// The results page: one story in six frames and a footer. Frames 3 to 5 run from the general
// question (the review call, set up well), to the technical one (naming the ASC 606 issue), to what
// that setup still misses. I wrote the copy;
// keep it as written. Every figure comes from data/results.json. The contract framing (120 pages, section numbers,
// page references) is illustrative and lives in PAGES and PLACE below.

const { run, grid, byConsideration, cases, demo, calibrationExpert, questions, trainingCounts, optionPair, heldoutTrigger } = results;
const held = grid.heldout;

/** Frame 3's progression: the review call's accuracy on the held-out set with the rule written out (clause as written), then with the facts also computed. */
const TRIGGER_PCT = Math.round(held.prose.trigger.accuracy * 100);
const COMPUTED_PCT = Math.round(held.computed.trigger.accuracy * 100);
/** The review flag's runs over the test clauses, and how many of them were wrong. */
const TRIGGER_RUNS = heldoutTrigger.reduce((s, c) => s + c.runs, 0);
const TRIGGER_WRONG = TRIGGER_RUNS - heldoutTrigger.reduce((s, c) => s + c.right, 0);
// The per-clause tally of the same runs must land on the same figure.
if (heldoutTrigger.length !== run.heldoutCases || Math.round((100 * (TRIGGER_RUNS - TRIGGER_WRONG)) / TRIGGER_RUNS) !== TRIGGER_PCT)
  throw new Error(`results.json: heldoutTrigger (${TRIGGER_RUNS - TRIGGER_WRONG}/${TRIGGER_RUNS} over ${heldoutTrigger.length} clauses) disagrees with the trigger accuracy`);
// Frame 3's title says the review call is right on every test clause once code computes the facts.
if (held.computed.trigger.accuracy !== 1) throw new Error("results.json: the review flag isn't right on every test clause with facts computed");
/**
 * Frame 3's stakes line: how often Jev's middle-band answers come true under the full expert setup
 * (rule written out, facts computed in code), not the pooled table that includes by-name questions.
 */
const MIDDLE_BAND = (() => {
  const bin = calibrationExpert.find((b) => b.from === 0.5 && b.to === 0.7);
  if (!bin || !bin.count) throw new Error("results.json: calibrationExpert has no populated 0.5–0.7 bin");
  // the line says these answers were right "about half the time"
  if (Math.abs(bin.observedYes - 0.5) > 0.1) throw new Error(`results.json: the 0.5–0.7 bin came true ${bin.observedYes}, not about half the time`);
  return bin;
})();

/**
 * Frame 3's progression plays over PROGRESS_PLAY_MS once in view. The first step (bar to 93%, its
 * figure counting up) runs over PROGRESS_AT[0]; the second (the rest of the bar, the 100% counting
 * on from 93) starts at PROGRESS_AT[1][0]. Fractions of the duration.
 */
const PROGRESS_PLAY_MS = 1800;
const PROGRESS_AT: [[number, number], [number, number]] = [
  [0.02, 0.42],
  [0.5, 0.74],
];

const SHAPES = ["prose", "structured", "computed"] as const;
type Shape = (typeof SHAPES)[number];
type CaseMeans = Record<Shape, Record<string, number>>;
type FlagCase = { clause: string; means: { prose: { trigger: number } }; gold: { considerations: readonly string[] } };

/** The contract length in the opening line; the page counters run up to it. */
const PAGES = 120;
/** Where each flagged clause sits in the illustrative contract, in card order. */
const PLACE = [
  { id: demo.id, section: "4.3", page: 47 },
  { id: "rr-f2-h04", section: "6.2", page: 63 },
  { id: "rr-f4-h01", section: "9.1", page: 88 },
  { id: "rr-f3-h02", section: "11.4", page: 104 },
] as const;
const FLAG_CASES: Record<string, FlagCase> = {
  [demo.id]: demo,
  "rr-f2-h04": cases["rr-f2-h04"],
  "rr-f4-h01": cases["rr-f4-h01"],
  "rr-f3-h02": cases["rr-f3-h02"],
};

/** The public repository; with null, links render as plain text. */
const REPO_URL: string | null = "https://github.com/vicwlau/finance-decision-evals";

const payment = cases["rr-f3-h02"];
// Frame 3's example states the installment count and the license fee.
if (!payment.facts.installments || !payment.facts.license_fee_usd)
  throw new Error("results.json: rr-f3-h02 lacks its installment count or license fee");
/** Frame 3's annotation: the gap code computed for the payment clause, from its computed facts ("17 months"). */
const PAYMENT_GAP = beforeParen(payment.computed.longest_gap_between_service_and_payment);
if (PAYMENT_GAP !== `${payment.facts.months_transfer_to_last_payment} months`)
  throw new Error(`results.json: rr-f3-h02's computed gap (${PAYMENT_GAP}) disagrees with its facts`);

/** Whether a case's label includes an ASC 606 consideration. */
const labelled = (c: { gold: { considerations: readonly string[] } }, key: string) => c.gold.considerations.includes(key);

const yesNo = (b: boolean) => (b ? "yes" : "no");

/** Frame 4's second card, and frame 5's first: a supplemental order that commits to a purchase. */
const independent = cases["rr-f4-h05"];

/**
 * How far a price sits below the low end of the normal price range, as a whole percent, checked
 * against the case's computed text ("$1.40 per 1M tokens is 30% below the low end of the SSP range").
 */
function belowNormal(id: string, price: number, low: number, computed: string) {
  const off = Math.round((1 - price / low) * 100);
  const says = `${money(price)} per 1M tokens is ${off}% below the low end of the SSP range`;
  if (computed !== says) throw new Error(`results.json: ${id}'s computed price reads “${computed}”, not “${says}”`);
  return off;
}

/** rr-f4-h05: how far its price sits below the normal range (30), for the cards' why lines. */
const INDEPENDENT_OFF = belowNormal(
  "rr-f4-h05",
  independent.facts.added_price_per_1m,
  independent.facts.ssp_range_per_1m[0],
  independent.computed.added_tokens_price_vs_ssp,
);

type QuestionKey = keyof typeof questions;

/** A question's exact instructions as the request sent them; throws if the export lacks it. */
function asked(key: QuestionKey) {
  const q = questions[key];
  if (!q?.instructions) throw new Error(`results.json: questions.${key} has no instructions`);
  return q as { type?: string; instructions: string };
}

/** A cut of a clause's body for a card: start at `from`, end after `until`, an ellipsis at each cut. */
type Cut = { from?: string; until?: string };

function cutBody(clause: string, cut?: Cut) {
  let body = clauseBody(clause);
  if (cut?.from) {
    const i = body.indexOf(cut.from);
    if (i < 0) throw new Error(`results.json: a clause lacks “${cut.from}”`);
    if (i > 0) body = `…${body.slice(i)}`;
  }
  if (cut?.until) {
    const i = body.indexOf(cut.until);
    if (i < 0) throw new Error(`results.json: a clause lacks “${cut.until}”`);
    const end = i + cut.until.length;
    if (end < body.length) body = `${body.slice(0, end)}\u00a0…`;
  }
  return body;
}

type CaseRecord = {
  clause: string;
  means: CaseMeans;
  gold: { considerations: readonly string[] };
  computed: Record<string, string>;
  deal?: Record<string, unknown>;
};
type CardSpec = {
  id: string;
  c: CaseRecord;
  /** The question as the request named it; its answer is the one shown. */
  question: QuestionKey;
  /** The consideration whose label is the correct answer. */
  issue: string;
  /** The decisive fact the state carried: a `computed` key and the essential phrase of its value. */
  fact: { key: string; value: string };
  /**
   * The part of the question's exact instructions to show: from `from` to the end of `to` (or to
   * the end of the text), with an ellipsis where it cuts.
   */
  ask: { from: string; to?: string };
  cut?: Cut;
  /** A short line above the excerpt, for a clause that already appeared earlier on the page. */
  note?: string;
  /** A second fact the state carried, by its path in the state (for example `deal.prior_order.add_on_option`). */
  also?: { path: string; value: string };
  why: string;
};

/**
 * A card's request and response, read from results.json: the decisive computed fact (its phrase
 * must appear in the real value), the tail of the question's exact instructions, and Jev's mean
 * answer with every fact computed (yes at 0.5 or above). The cards show misses, so Jev's answer
 * and the label must differ.
 */
function verdictCard(spec: CardSpec) {
  const value = spec.c.means.computed[spec.question];
  if (typeof value !== "number") throw new Error(`results.json: ${spec.id} has no computed-shape answer to ${spec.question}`);
  const said = value >= 0.5;
  const gold = labelled(spec.c, spec.issue);
  if (said === gold) throw new Error(`results.json: Jev gets ${spec.id} right with every fact computed; its card shows a miss`);
  const sent = spec.c.computed[spec.fact.key];
  if (typeof sent !== "string" || !sent.includes(spec.fact.value))
    throw new Error(`results.json: ${spec.id}'s computed.${spec.fact.key} doesn't contain “${spec.fact.value}”`);
  const { instructions } = asked(spec.question);
  const at = instructions.indexOf(spec.ask.from);
  if (at < 0) throw new Error(`results.json: questions.${spec.question} doesn't contain “${spec.ask.from}”`);
  const stop = spec.ask.to ? instructions.indexOf(spec.ask.to, at) : -1;
  if (spec.ask.to && stop < 0) throw new Error(`results.json: questions.${spec.question} doesn't contain “${spec.ask.to}”`);
  const end = spec.ask.to ? stop + spec.ask.to.length : instructions.length;
  const tail = `${at > 0 ? "…" : ""}${instructions.slice(at, end)}${end < instructions.length ? "…" : ""}`;
  cutBody(spec.c.clause, spec.cut);
  if (spec.also) {
    const got = spec.also.path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), {
      deal: spec.c.deal,
      computed: spec.c.computed,
    });
    if (String(got) !== spec.also.value) throw new Error(`results.json: ${spec.id}'s ${spec.also.path} is “${String(got)}”, not “${spec.also.value}”`);
  }
  return { ...spec, value, said, gold, instructions, tail };
}
type Verdict = ReturnType<typeof verdictCard>;

/** Frame 4's cards: an ASC 606 term asked by name (the `_concept` questions). */
const BY_NAME_CARDS = [
  {
    id: "rr-f3-h01",
    c: cases["rr-f3-h01"],
    question: "financing_component_concept" as const,
    issue: "financing_component",
    fact: { key: "longest_gap_between_service_and_payment", value: "about 9 months" },
    ask: { from: "raise the question" },
    why: "ASC 606 lets a vendor skip the financing assessment when payment arrives within a year of delivery (606-10-32-18), and every payment here does.",
  },
  {
    id: "rr-f4-h05",
    c: independent,
    question: "contract_modification_concept" as const,
    issue: "contract_modification",
    fact: { key: "added_tokens_price_vs_ssp", value: "30% below the low end of the SSP range" },
    ask: { from: "is `clause`" },
    why: `It fails the separate-contract test (606-10-25-12) because its price is ${INDEPENDENT_OFF}% below the normal range, so it's accounted for as a change to the old contract.`,
  },
].map(verdictCard);

/** The issues frame 4's lead-in names, by consideration, in the words of its sentence. */
const SHORT_ISSUE: Record<string, string> = { financing_component: "financing", contract_modification: "contract modification" };

/**
 * Frame 4's lead-in above its cards. The issue names come from the cards' by-name question keys
 * (financing_component_concept → financing), so the sentence can't drift from the cards under it.
 */
const BY_NAME_LEAD = (() => {
  if (BY_NAME_CARDS.length !== 2) throw new Error(`page: frame 4's lead-in says two questions; it has ${BY_NAME_CARDS.length} cards`);
  const names = BY_NAME_CARDS.map((v) => {
    const issue = v.question.replace(/_concept$/, "");
    if (issue === v.question || issue !== v.issue) throw new Error(`page: ${v.id}'s question ${v.question} isn't the by-name question for ${v.issue}`);
    const name = SHORT_ISSUE[issue];
    if (!name) throw new Error(`page: frame 4's lead-in has no name for ${issue}`);
    return name;
  });
  return `Two more questions Jev missed when asked by name: ${names[0]} and ${names[1]}.`;
})();

/**
 * Frame 5's cards: held-out clauses Jev misreads with the rule written out and every fact computed.
 * Here `question` is the rule-written-out question, named like the consideration it labels.
 */
const STRUCTURE_CARDS = [
  {
    id: "rr-f4-h05",
    c: independent,
    question: "material_right" as const,
    issue: "material_right",
    fact: { key: "added_tokens_price_vs_ssp", value: "30% below the low end of the SSP range" },
    ask: { from: "Does `clause`" }, // the full question
    cut: { from: "Customer purchases" },
    also: { path: "deal.prior_order.add_on_option", value: "none" },
    why: `The price is ${INDEPENDENT_OFF}% below normal, but the customer has committed to buy, so there is no option.`,
  },
  {
    id: "rr-f4-h04",
    c: cases["rr-f4-h04"],
    question: "variable_consideration" as const,
    issue: "variable_consideration",
    fact: { key: "reduced_price_vs_ssp", value: "10% below the low end of the SSP range" },
    ask: { from: "Does `clause`" }, // the full question: cut, it hid what was asked
    cut: { until: "next invoice." },
    why: "The new price and the $100,000 credit are both fixed amounts; nothing depends on usage or performance.",
  },
].map(verdictCard);

/** Frame 3's example question: the exact instructions, split around `clause` so it can be set in mono. */
const FINANCING_ASK = (() => {
  const parts = asked("financing_component").instructions.split("`clause`");
  if (parts.length !== 2) throw new Error("results.json: questions.financing_component doesn't name `clause` once");
  return parts as [string, string];
})();

/** Frame 6's pair as excerpts. The section number is illustrative, like PLACE. */
const PAIR_SECTION = "3.2";
/** The two sides of frame 6's pair, in order: the phrase the pen marks and the label under it. */
const PAIR_SIDES = [
  { option: false, mark: "purchases", answer: "no material right", why: "the customer has already committed to the purchase" },
  { option: true, mark: "may purchase up to", answer: "material right", why: "it is an option at a discount below the normal price range" },
] as const;
const pairSides = PAIR_SIDES.map((side) => {
  const record = optionPair.find((r) => r.facts.is_option === side.option);
  if (!record) throw new Error(`results.json: optionPair has no ${side.option ? "option" : "committed purchase"}`);
  if (record.gold.material_right.noul !== (side.option ? 1 : 0))
    throw new Error(`results.json: ${record.id}'s material-right label disagrees with “${side.answer}”`);
  if (!clauseBody(record.clause).includes(side.mark)) throw new Error(`results.json: ${record.id}'s clause lacks “${side.mark}”`);
  return { ...side, record };
});
// The note under the pair says the two clauses share a price and a token count.
{
  const [a, b] = pairSides.map((s) => s.record.facts);
  if (a.price_per_1m !== b.price_per_1m || a.tokens_b !== b.tokens_b)
    throw new Error("results.json: optionPair's clauses differ in price or tokens");
}

function RepoLink({ path, children }: { path: string; children: ReactNode }) {
  if (!REPO_URL) return <span className="link-pending" title="Link to come">{children}</span>;
  return <a href={path ? `${REPO_URL}/blob/main/${path}` : REPO_URL}>{children}</a>;
}

/** A clause set as if lifted from the contract: section, small-caps heading, page reference. */
function Excerpt({
  section,
  clause,
  page,
  quote,
  small,
  cut,
  mark,
}: {
  /** The illustrative section number; the frame 4 and 5 cards, quoting separate test clauses, have none. */
  section?: string;
  clause: string;
  page?: number;
  /** Frame 2: the clause's first sentence, shortened and in quotation marks. */
  quote?: boolean;
  /** The smaller card size (frames 2, 3 and 5). */
  small?: boolean;
  cut?: Cut;
  /** A phrase of the body the reviewer's pen marks (frames 1 and 6); ignored if the body doesn't contain it. */
  mark?: string;
}) {
  const body = cutBody(clause, cut);
  const at = mark ? body.indexOf(mark) : -1;
  const text: ReactNode =
    at >= 0 && mark ? (
      <>
        {body.slice(0, at)}
        <span className="pen-phrase" data-pen>
          {mark}
        </span>
        {body.slice(at + mark.length)}
      </>
    ) : (
      body
    );
  return (
    <div className={`excerpt ${quote || small ? "excerpt-sm" : ""}`}>
      <p className="excerpt-head">
        {section ? <span className="excerpt-sec">§ {section}</span> : null}
        <span className="excerpt-title">{clauseHeading(clause)}</span>
        {page ? (
          <span className="excerpt-page">
            p. {page} of {PAGES}
          </span>
        ) : null}
      </p>
      <p className="excerpt-body">{quote ? `“${shortQuote(body)}”` : text}</p>
    </div>
  );
}

/**
 * A card for frames 4 and 5: the clause as a reader sees it, then three lines of the request and
 * response (the decisive fact sent, the question asked, Jev's answer against the correct one), and why.
 */
function VerdictCard({ v, tick }: { v: Verdict; tick: string }) {
  return (
    <Reveal as="article" className="case-card verdict-card" tick={tick} lift={0.15}>
      {/* the note shares the excerpt's grid row, so side-by-side cards keep their three rows aligned */}
      <div className="case-head">
        {v.note ? <p className="case-note">{v.note}</p> : null}
        <Excerpt clause={v.c.clause} cut={v.cut} small />
      </div>
      {/* the request on the ledger ground: muted red where Jev's answer is wrong */}
      <div className={`req pad${v.said === v.gold ? "" : " is-miss"}`} data-tickmark={tickmarkId("site", "request", v.id, v.question)}>
        <span className="req-key">fact sent</span>
        <span className="req-val">
          <span className="req-k">
            {/* the key may break after a dot or an underscore, so a wrap never splits a word */}
            {`computed.${v.fact.key}:`.split(/(?<=[._])/).map((part, k) => (
              <span key={k}>
                {k ? <wbr /> : null}
                {part}
              </span>
            ))}
          </span>{" "}
          {JSON.stringify(v.fact.value)}
        </span>
        {v.also ? (
          <>
            <span className="req-key">fact sent</span>
            <span className="req-val">
              <span className="req-k">
                {`${v.also.path}:`.split(/(?<=[._])/).map((part, k) => (
                  <span key={k}>
                    {k ? <wbr /> : null}
                    {part}
                  </span>
                ))}
              </span>{" "}
              {JSON.stringify(v.also.value)}
            </span>
          </>
        ) : null}
        <span className="req-key">asked</span>
        <span className="req-val" title={v.instructions}>
          {JSON.stringify(v.tail)}
        </span>
        <span className="req-key">Jev</span>
        <span className="req-val req-answer">
          <span className={v.said === v.gold ? "req-jev" : "req-jev is-wrong"}>
            {prob(v.value)} → {yesNo(v.said)}
          </span>
          <span className="req-gold">correct: {yesNo(v.gold)}</span>
        </span>
      </div>
      <p className="case-why">{v.why}</p>
    </Reveal>
  );
}

/**
 * A frame's heading block, opened by its number and name set on a rule. As it scrolls in, the rule
 * draws from behind the label, then the heading settles (globals.css, "section labels").
 */
function FrameHead({ n, name, children }: { n: string; name: string; children: ReactNode }) {
  return (
    <Reveal className="frame-head" lift={0.12}>
      <p className="mk" data-tickmark={tickmarkId("site", "label", n)}>
        <b>{n}</b>
        <span>{name}</span>
      </p>
      {children}
    </Reveal>
  );
}

export default function Page() {
  const opening = PLACE[0];
  const openingIssue = CONSIDERATION[demo.gold.considerations[0]].toLowerCase();
  const sspLow = demo.facts.ssp_range_per_bn[0];
  const discount = Math.round((1 - demo.facts.add_on_price_per_bn / sspLow) * 100);
  const finGold = labelled(payment, "financing_component");
  /** The payment clause's place in the illustrative contract, as frame 2's fourth flag shows it. */
  const paymentPlace = PLACE.find((p) => p.id === "rr-f3-h02") ?? PLACE[3];

  const mr = byConsideration.material_right;
  const mrByName = SHAPES.map((s) => mr[s].concept.accuracy);
  const mrRule = SHAPES.map((s) => mr[s].rule.accuracy);

  /** Figure D, set aside (SHOW_FIGURE_D in figure-config.ts). When shown, it closes frame 6 and plays as it comes into view. */
  const pairFigure =
    SHOW_FIGURE_D && USE_HAIRLINE ? (
      <figure className="pair-figure" data-tickmark={tickmarkId("site", "pair-figure", "d")}>
        <FigureSlot id="d" ratio={SLOT_RATIO.d} label="A clause and its copy; on the copy, the price is lower and highlighted">
          <></>
        </FigureSlot>
      </figure>
    ) : null;
  const dataBody = (
    <>
      <FrameHead n="06" name="Training data">
        <h2 id="f6">Where training data could help</h2>
        <p>
          Code can already measure how large a discount is. Recognizing whether a clause grants an option or commits to a purchase
          is a reading judgment, which pairs like this one could teach.
        </p>
      </FrameHead>
      <Reveal as="p" className="pair-lead" tick={tickmarkId("site", "pair", "lead")}>
        One training pair keeps the clause the same and changes the phrase that decides the answer.
      </Reveal>
      {/* each side plays as it comes into view: the excerpt, then the pen on the deciding words, then the label */}
      <div className="pair" data-tickmark={tickmarkId("site", "pair", "tr-mr-02")}>
        {pairSides.map(({ record, mark, option, answer, why }) => (
          <Reveal key={record.id} className="pair-side" tick={tickmarkId("site", "pair-clause", record.id)} pen lift={0.3}>
            <Excerpt section={PAIR_SECTION} clause={record.clause} mark={mark} />
            <p
              className={`pair-label ${option ? "is-yes" : "is-no"}`}
              data-pen-to
              data-tickmark={tickmarkId("site", "pair-label", record.id)}
            >
              <span className="pair-label-key">Correct answer:</span> <strong>{answer}</strong>, because {why}.
            </p>
            <svg className="pen" data-pen-svg data-pen-route="margin" aria-hidden="true">
              <path className="pen-line" pathLength={1} />
              <path className="pen-link" pathLength={1} />
            </svg>
          </Reveal>
        ))}
      </div>
      <p className="pair-evidence" data-tickmark={tickmarkId("site", "pair", "evidence")}>
        This pair targets the first error above, where Jev read a committed purchase as an option.
      </p>
      <p className="honest pair-close" data-tickmark={tickmarkId("site", "pair", "close")}>
        I built {trainingCounts.records} examples in {trainingCounts.pairs} pairs like this, each labelled from its facts. For close
        calls, such as a price just under the normal range, the label should be the share of reviewers who would say yes rather
        than a plain yes or no. <RepoLink path="rev-rec/training-examples.md">See the training examples</RepoLink>
      </p>
      {pairFigure}
    </>
  );

  return (
    <div className="page" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
      <header className="masthead" data-tickmark={tickmarkId("site", "masthead")}>
        <div className="wrap">
          <strong>Jev on ASC 606 contract terms</strong>
          <span>Research note, {monthYear(results.generatedAt)}</span>
        </div>
      </header>

      <main>
        {/* 1. The problem: a pinned scroll scene */}
        <ScrollScene
          className="scene"
          tick={tickmarkId("site", "frame", "problem")}
          label="The problem"
          figureStart={A_START}
          figureEnd={0.72}
          impactAt={0.8}
          counter={{ to: PAGES, until: A_BUILT, one: "page", many: "pages" }}
          leader={[0.56, 0.7]}
        >
          <div className="scene-pin" data-pin>
            <div className="wrap scene-grid">
              {/* "reg": crop marks at the headline's corners */}
              <div className="scene-intro reg">
                <h1>One sentence in this {PAGES}-page contract could change how revenue is recognized.</h1>
                <p className="standfirst">
                  Finding that sentence takes a trained revenue specialist, and most finance teams have too few of them to read
                  every deal.
                </p>
                <p className="stamp" data-tickmark={tickmarkId("site", "stamp")}>
                  <span>Test run</span>
                  <span>
                    <b>{run.model}</b>
                  </span>
                  <span>
                    <b>{run.heldoutCalls}</b> calls
                  </span>
                  <span>
                    <b>${run.heldoutCostUsd}</b> total
                  </span>
                </p>
              </div>
              <div className="scene-focus" data-focus>
                <figure className="scene-figure" data-tail>
                  <FigureSlot id="a" ratio={SLOT_RATIO.a} label="A 120-page contract; one page slides out and one sentence on it is highlighted">
                    <PileFigure />
                  </FigureSlot>
                  <p className="scene-counter" data-counter aria-hidden="true">
                    {PAGES} pages
                  </p>
                </figure>
                <div className="scene-callout" data-tail data-tickmark={tickmarkId("site", "excerpt", demo.id)}>
                  <div data-leader-to>
                    <Excerpt
                      section={opening.section}
                      page={opening.page}
                      clause={demo.clause}
                      mark={`at ${usdWhole(demo.facts.add_on_price_per_bn)} per billion input tokens`}
                    />
                  </div>
                  <p className="flag-tag impact-tag" data-pen-to data-tickmark={tickmarkId("site", "impact", demo.id)}>
                    <svg className="tick-glyph" viewBox="0 0 14 14" aria-hidden="true">
                      <path d="M2 7.5 L5.5 11 L12 2.5" />
                    </svg>
                    Revenue impact: {openingIssue}
                  </p>
                  <p className="callout-line impact-line pad">
                    Customers this size pay at least {usdWhole(sspLow)} per billion, so a {discount}% discount on future purchases
                    is a separate right, and part of the {usdWhole(demo.facts.committed_fee_usd)} fee must be deferred.
                  </p>
                  <svg className="pen" data-pen-svg aria-hidden="true">
                    <path className="pen-line" pathLength={1} />
                    <path className="pen-tick" pathLength={1} />
                    <path className="pen-link" pathLength={1} />
                  </svg>
                </div>
                <svg className="leader" data-leader aria-hidden="true">
                  <path pathLength={1} />
                  <circle r={3.5} />
                  <circle r={3.5} />
                </svg>
              </div>
            </div>
          </div>
        </ScrollScene>

        {/* 2. Where Jev fits: Jev reads the contract as the page scrolls, and each flag's card appears as its clause rises */}
        <ScanScene
          className="frame wrap scan"
          tick={tickmarkId("site", "frame", "where-jev-fits")}
          label="Where Jev fits"
          {...(USE_HAIRLINE
            ? { thresholds: B_FLAG_AT }
            : { duration: 5200, pages: PAGES, flags: PLACE.map((p) => p.page), pause: 560 })}
        >
          <div className="scan-stage" data-track>
            <FrameHead n="02" name="Where Jev fits">
              <h2>Testing Jev on flagging revenue recognition issues</h2>
            </FrameHead>
            <div className="fits">
              <figure className="fits-figure">
                <FigureSlot id="b" ratio={SLOT_RATIO.b} label="A contract’s pages being scanned, with four clauses flagged">
                  <ScanFigure />
                  {USE_HAIRLINE ? (
                    <div className="slot-markers">
                      {B_MARKERS.map((m, k) => (
                        <span
                          key={PLACE[k].id}
                          className="slot-marker"
                          data-step={k}
                          data-link={k}
                          data-marker={`flag-${k + 1}`}
                          data-tickmark={tickmarkId("site", "flag-marker", PLACE[k].id)}
                          tabIndex={0}
                          aria-label={`Flag ${k + 1}: ${sentenceCase(clauseHeading(FLAG_CASES[PLACE[k].id].clause))}`}
                          style={{ "--x": m.x, "--y": m.y } as CSSProperties}
                        >
                          {k + 1}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </FigureSlot>
                {USE_HAIRLINE ? null : (
                  <p className="scene-counter" data-page-counter aria-hidden="true">
                    p. {PAGES} of {PAGES}
                  </p>
                )}
              </figure>
              <ol className="flags">
                {PLACE.map((place, k) => {
                  const c = FLAG_CASES[place.id];
                  const p = c.means.prose.trigger;
                  return (
                    <li
                      className="flag"
                      key={place.id}
                      data-step={k}
                      data-link={k}
                      data-card
                      tabIndex={0}
                      data-tickmark={tickmarkId("site", "flag", place.id)}
                    >
                      <span className="flag-n" aria-hidden="true">
                        {k + 1}
                      </span>
                      <Excerpt section={place.section} clause={c.clause} quote />
                      <p className="margin-note">
                        <span className="margin-note-key">Label</span>{" "}
                        <i>{c.gold.considerations.map((key) => CONSIDERATION[key].toLowerCase()).join(", ")}</i>
                      </p>
                      <div className="jev" data-tickmark={tickmarkId("site", "jev-readout", place.id)}>
                        <p className="jev-top">
                          <span className="jev-mark">
                            <i aria-hidden="true" />
                            Jev
                          </span>
                          <code className="jev-field">trigger</code>
                          <b className="jev-value" data-count-to={prob(p)}>
                            {prob(p)}
                          </b>
                        </p>
                        <p className="jev-q">needs revenue review?</p>
                        <p className="jev-row">
                          <span className="jev-bar" style={{ "--w": `${p * 100}%` } as CSSProperties} aria-hidden="true">
                            <i />
                          </span>
                          <span className="jev-verdict">{p >= 0.5 ? "flag" : "no flag"}</span>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
          {/* the room the pinned stage scrolls through on wide screens (globals.css) */}
          <div className="scan-runway" data-runway aria-hidden="true" />
        </ScanScene>

        {/* 3. The general question, set up well: the review call's two steps count up in order; then the payment clause shows the second step */}
        <PlayScene
          className="frame frame-test frame-expert wrap"
          tick={tickmarkId("site", "frame", "test")}
          label="The expert setup"
          duration={PROGRESS_PLAY_MS}
          thresholds={[0.02, PROGRESS_AT[1][0]]}
        >
          <FrameHead n="03" name="The general question">
            <h2 id="f3">
              With the rule written out and the facts computed, Jev made the right review call on all {run.heldoutCases} test
              clauses.
            </h2>
          </FrameHead>
          {/* step 0 draws the block's top rule as the scene starts */}
          <div className="progress pad" data-play-start data-step={0} data-tickmark={tickmarkId("site", "progress", "review-call")}>
            <div className="progress-steps">
              <p className="progress-step">
                <span className="fig-n">
                  <CountUp value={TRIGGER_PCT} at={PROGRESS_AT[0]} />
                  <span className="pct">%</span>
                </span>
                <span className="progress-label">Rule written out</span>
              </p>
              <p className="progress-step is-final" data-step={1}>
                <span className="fig-n accent">
                  <CountUp value={COMPUTED_PCT} from={TRIGGER_PCT} at={PROGRESS_AT[1]} />
                  <span className="pct">%</span>
                </span>
                <span className="progress-label">Facts also computed</span>
              </p>
            </div>
            <div className="progress-bar" aria-hidden="true">
              <i className="progress-fill" data-step={0} style={{ "--a": 0, "--b": TRIGGER_PCT / 100 } as CSSProperties} />
              <i
                className="progress-fill is-final"
                data-step={1}
                style={{ "--a": TRIGGER_PCT / 100, "--b": COMPUTED_PCT / 100 } as CSSProperties}
              />
            </div>
          </div>
          <Reveal className="lever" lift={0.4}>
            <div className="fix-demo" data-tickmark={tickmarkId("site", "before-after", "rr-f3-h02")}>
              <p className="fix-lead">
                <strong>Example: the {payment.facts.installments}-installment payment clause.</strong> The license is delivered at
                signing and paid over {payment.facts.installments} months. If payment trails delivery by more than a year, part of the{" "}
                {usdWhole(payment.facts.license_fee_usd)} may be interest, so less revenue is recognized at delivery.
              </p>
              <p className="fix-lead fix-ask">
                I asked Jev: “{FINANCING_ASK[0]}
                <code>clause</code>
                {FINANCING_ASK[1]}”{" "}
                <span className="nowrap">
                  Correct answer: <b>{yesNo(finGold)}</b>.
                </span>
              </p>
              <Excerpt section={paymentPlace.section} page={paymentPlace.page} clause={payment.clause} />
              <p className="computed-note">
                <svg className="computed-tick" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2.6 8.9 C3.9 9.9 4.9 11.2 6 12.9 C7.9 8.6 10.4 5.2 13.6 2.6" pathLength={1} />
                </svg>
                <code>Computed in code: {PAYMENT_GAP} between delivery and the last payment</code>
              </p>
              <FixLine
                gold={finGold}
                before={payment.means.prose.financing_component}
                after={payment.means.computed.financing_component}
                beforeLabel="Reading the clause alone"
                afterLabel={`With “${PAYMENT_GAP}” computed in code`}
              />
            </div>
          </Reveal>
          <p className="stakes" data-tickmark={tickmarkId("site", "stakes", "middle-band")}>
            When Jev was unsure, with an answer between {MIDDLE_BAND.from} and {MIDDLE_BAND.to}, it was right only about half the
            time ({pct(MIDDLE_BAND.observedYes)} of {MIDDLE_BAND.count} answers). Those are the calls to send to a person.
          </p>
        </PlayScene>

        {/* 4. The technical question: naming the specific ASC 606 issue */}
        <section className="frame wrap" data-tickmark={tickmarkId("site", "frame", "knowledge")} aria-labelledby="f4">
          <div className="knowledge">
            <FrameHead n="04" name="The technical question">
              <h2 id="f4">
                Naming the specific ASC 606 issue is harder: on material rights, Jev reaches {pctRange(mrRule)} even with the rule
                written out.
              </h2>
            </FrameHead>
            <Reveal className="knowledge-chart">
              <figure data-tickmark={tickmarkId("site", "chart", "material-right")}>
                <RangeChart
                  label={`Material right, held-out: by name ${pctRange(mrByName)}, rule written out ${pctRange(mrRule)}`}
                  from={0.5}
                  to={1}
                  step={0.1}
                  rows={[
                    { key: "name", label: "By name", values: mrByName },
                    { key: "rule", label: "Rule written out", values: mrRule, strong: true },
                  ]}
                />
              </figure>
            </Reveal>
          </div>
          <Reveal as="p" className="pair-lead cards-lead" tick={tickmarkId("site", "cards-lead", "by-name")}>
            {BY_NAME_LEAD}
          </Reveal>
          <div className="case-cards">
            {BY_NAME_CARDS.map((v) => (
              <VerdictCard key={v.id} v={v} tick={tickmarkId("site", "case-card", v.id)} />
            ))}
          </div>
        </section>

        {/* 5. What's left: misreadings that survive the expert setup */}
        <section className="frame wrap" data-tickmark={tickmarkId("site", "frame", "structure")} aria-labelledby="f5">
          <FrameHead n="05" name="What’s left">
            <h2 id="f5">Most of the remaining misses come from how Jev reads a clause’s structure.</h2>
            <p>These errors persist with the rule written out and the facts computed, so better questions won’t fix them.</p>
          </FrameHead>
          <div className="case-cards">
            {STRUCTURE_CARDS.map((v) => (
              <VerdictCard key={v.id} v={v} tick={tickmarkId("site", "structure-card", v.id)} />
            ))}
          </div>
          <p className="honest" data-tickmark={tickmarkId("site", "honest", "question-wording")}>
            <RepoLink path="rev-rec/report.md">The report</RepoLink> lists the misses that came from my own question wording.
          </p>
        </section>

        {/* 6. Data: one training pair, a committed purchase beside an option */}
        {pairFigure ? (
          <PlayScene className="frame wrap frame-data" tick={tickmarkId("site", "frame", "data")} label="Training data" duration={D_PLAY_MS}>
            {dataBody}
          </PlayScene>
        ) : (
          <section className="frame wrap frame-data" data-tickmark={tickmarkId("site", "frame", "data")} aria-labelledby="f6">
            {dataBody}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="site-footer" data-tickmark={tickmarkId("site", "footer")}>
        <div className="wrap footer-row">
          <div data-tickmark={tickmarkId("site", "footer", "links")}>
            <ul className="footer-links">
              <li>
                <RepoLink path="rev-rec/report.md">Full report</RepoLink>
              </li>
              <li>
                <RepoLink path="rev-rec/training-examples.md">Training examples</RepoLink>
              </li>
              <li>
                <RepoLink path="">Repository</RepoLink>
              </li>
            </ul>
            <p className="footer-note" data-tickmark={tickmarkId("site", "footer", "report-note")}>
              How I ran it, and its limits, are in the full report.
            </p>
          </div>
          <div className="footer-meta">
            <p className="footer-author">Victor Lau</p>
            <p className="credit">Illustrations drawn with hairline (MIT, Lucas Marques).</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
