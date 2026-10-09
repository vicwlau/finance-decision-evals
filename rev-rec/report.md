# Jev on ASC 606 contract terms: where a calibrated decision model is weak

> **Updated 2026-10-09.** Model `jev-1.13.0`. This is the detailed companion to the results page.
> Every number comes from the run logs in [`runs/`](runs/): directly, through the comparison
> tables `compare.ts` wrote there, through `site/data/results.json` (exported from the logs by
> `site/scripts/export-results.ts`), or from the probe logs under `probes/`. Totals marked "summed
> from the logs" were computed in code from the logs' `usage` and `cost_usd` fields.

## Summary

1. **The problem.** One sentence in a long contract can change how revenue is recognized. Finding
   it takes a trained revenue specialist, and most finance teams have too few to read every deal.
2. **The test.** I tested whether Jev can flag those clauses. It read one synthetic clause and its
   deal facts per request, and gave a probability for each of 13 yes-or-no questions: does the deal
   need a revenue accounting review (the review call), and which ASC 606 issues apply.
3. **The review call.** With the rule written out, Jev made the right review call on 93% of calls
   over 20 held-out clauses. With the facts also computed in code, it was right on all 20 (60 of 60
   calls). In that setup, answers between 0.5 and 0.7 came true 48% of the time (29 answers), so
   those calls belong with a person.
4. **Naming the issue is harder.** On material rights, Jev scores 70–75% when asked by name and
   85–95% with the rule written out. It reads terms of art such as "material right" and
   "significant financing component" in their everyday sense.
5. **Remaining misses.** With the full setup, 7 rule-question errors remain, all false alarms. Three
   trace to my question wording. Four come from how Jev reads a clause's structure, such as a
   committed purchase read as an option. Rewording the questions across three versions barely moved
   the scores.
6. **Training data.** Code can already measure a discount. Telling an option from a committed
   purchase is a reading judgment that training data could teach. I built 6 minimal pairs (12
   records, all approved by me); the featured pair sets a committed purchase beside an option
   at the same price.

## Setup

- **Cases.** Synthetic clauses in four families: prepaid tokens with add-on and overage pricing
  (F1), refunds vs SLA credits (F2), long payment terms (F3), and early renewals and other contract
  changes (F4). Dev has 17 cases (F1 5, the others 4 each; 10 need a review). Held-out has 20 (5 per
  family; 11 need a review; 13 marked hard). Held-out amounts are generated from facts in code
  (`scripts/build-heldout.ts`).
- **Freeze.** I froze held-out before its first run: SHA-256 `0e20378c…` over its lines in
  `data/cases.jsonl`, recorded with the method and timestamp in `data/heldout-freeze.json`.
  `run.ts --split heldout` refuses to run if the hash changes, and logs it on every record. I wrote
  and refined the questions on the 17 dev cases only, so the held-out cases played no part in
  shaping them. Held-out ran once, on question set v2.
- **Labels.** The clause families and label rules come from my experience running ASC 606
  deal-desk review. Claude drafted the cases and labels from my notes and rules, and I reviewed
  every one. My notes on two dev drafts (rr-f2-03, rr-f4-03) changed their labels and set the
  substance-versus-deal-scope rule below. Two blind AI reviews checked the held-out labels first:
  they agreed with the drafts on 139 and 140 of 140 decisions and passed one case to me
  (rr-f4-h03), which I decided before the run. I approved the other 19 on 9 October 2026, after it;
  the freeze hash shows they are the labels Jev was scored against. The reviews are in
  `reviews/2026-10-03-heldout/`. Each case carries two labels: whether the deal needs a review, and
  which ASC 606 considerations apply in substance ([`README.md`](README.md#what-the-labels-mean)). A
  consideration can apply without a review, for example a standard SLA's credits.
- **Questions** (`questions/v2.json`, 13 per request). One review question: does the clause depart
  from the vendor's standard terms in a way that could change how much revenue is recognized, or
  when? Then six considerations (material right, variable consideration, refund, financing,
  contract modification, termination for convenience), each asked two ways in the same request:
  - **by name:** "Read with the deal information: under ASC 606, does `clause` give the customer a
    material right?"
  - **rule written out:** "Does `clause` give the customer an option to buy additional goods or
    services at a price below the standalone selling price stated in the deal information?"
- **State shapes.** The same facts three ways: **prose** (the clause as written and a paragraph of
  deal facts), **structured** (named fields), and **computed** (named fields plus comparisons done
  in code, such as "17 months (last installment after the license is transferred)").
- **Runs and cost.** 3 repeats per case and shape, TypeSafe's direct API, every response
  `jev-1.13.0`. Cost counts input tokens at TypeSafe's list price of $0.042 per million; output
  tokens aren't charged. Held-out: 180 calls, $0.0076; 181,260 input and 45,720 output tokens (summed from
  the logs). Dev grid: 153 calls, $0.0065 (summed from the logs). All 738 logged calls, probes
  included, cost $0.030 (summed from the logs).

## Results

Accuracy per call at a 0.5 threshold, Brier score in brackets (lower is better). The consideration
rows pool all six considerations.

| Held-out, 20 cases | Prose | Structured | Computed |
|---|---|---|---|
| Review call (60 calls) | **93%** (0.071) | 93% (0.082) | **100%** (0.043) |
| Considerations, rule written out (360) | 94% (0.058) | 91% (0.065) | 94% (0.053) |
| Considerations, by name (360) | 89% (0.094) | 88% (0.094) | 87% (0.096) |

| Dev, 17 cases | Prose | Structured | Computed |
|---|---|---|---|
| Review call (51 calls) | 76% (0.119) | 88% (0.116) | 92% (0.075) |
| Considerations, rule written out (306) | 98% (0.039) | 98% (0.042) | 99% (0.033) |
| Considerations, by name (306) | 86% (0.098) | 86% (0.102) | 85% (0.093) |

- **Across a row,** computed facts lift the review call and leave by-name accuracy flat.
- **Down a column,** the rule written out beats the name at every state shape.
- **From dev to held-out,** rule accuracy drops 4–7 points. I refined the rule questions against
  dev failures, so part of their dev score is fit to dev. By-name accuracy rises 2–3 points.
- **The review call scored higher on held-out than on dev** (93% vs 76% in prose). I wrote the
  held-out cases after learning that the review call depends on knowing the vendor's standard
  terms, so every held-out case states them. This run can't separate that from case difficulty.

## The review call

- **Misses.** In prose, Jev missed 4 of 60 calls: 2 of 3 on rr-f1-h02 (10% off list, inside the
  SSP range; no review needed) and 2 of 3 on rr-f3-h05 (fees invoiced at the end of a 12-month term
  and paid 60 days later; review needed). With the facts computed, it got all 60 right.
- **Example, rr-f3-h02.** A $900,000 license is delivered at signing and paid in 18 monthly
  installments, so the last payment comes 17 months after delivery. Past one year, the practical
  expedient (606-10-32-18) no longer applies, and part of the fee may be financing. Asked "Under
  `clause`, does more than one year separate when the customer receives the service and when it
  pays, in either direction?" (correct: yes), Jev answered 0.25 from the clause alone and 0.72 with
  "17 months" computed in code. The other two financing positives moved the same way: rr-f3-h04
  0.41 → 0.75, rr-f3-h05 0.28 → 0.56. Financing accuracy goes from 85% to 100%.
- **Where to send a person.** In the expert setup (the review question and the six rule questions,
  computed shape, 420 answers), answers between 0.5 and 0.7 came true 48% of the time (29 answers;
  `calibrationExpert` in `site/data/results.json`). None of the 324 answers below 0.5 came true. A
  workflow that routes on Jev's probability should send the 0.5–0.7 band to a person.

## Naming the issue

Held-out accuracy per consideration, prose · structured · computed:

| Consideration | Held-out clauses where it applies | By name | Rule written out |
|---|---|---|---|
| Material right | 2 of 20 | 75 · 75 · 70% | 95 · 85 · 85% |
| Variable consideration | 4 of 20 | 90 · 83 · 87% | 90 · 90 · 90% |
| Financing component | 3 of 20 | 85 · 83 · 82% | 85 · 85 · 100% |
| Contract modification | 3 of 20 | 85 · 85 · 85% | 93 · 88 · 90% |
| Refund | 2 of 20 | 100% at every shape | 100% at every shape |
| Termination for convenience | 0 of 20 | 100% (no positives) | 100% (no positives) |

Each rate covers all 20 clauses, so it counts false alarms as well as misses. With 2 to 4 clauses
where an issue applies, these rates describe these clauses, not Jev in general.

- **Material right is the weakest cell.** Computed facts don't close the by-name gap. On these
  clauses that points to a knowledge gap: Jev applies a stated condition but misses the term when
  asked by name.
- **Terms of art read in their everyday sense.** By name, "material right" fires on refund clauses
  as if it meant an important right (dev rr-f2-01, rr-f2-02 and rr-f2-04, listed in
  `runs/compare-2026-10-03T234214110Z.md`; held-out rr-f2-h01 at 0.68–0.71). "Significant
  financing component" fires on net 90 for a customer in Japan, where every payment arrives within
  a year (rr-f3-h01, 0.58–0.74, correct: no).
- **A clause's description of itself sways the by-name answer.** rr-f4-h05 calls itself "a new and
  independent agreement" while adding tokens 30% below the SSP range for the last 6 months of the
  old contract. It changes the existing contract's scope and price, so it is a modification
  (606-10-25-10). Priced 30% below the SSP range, with nothing in the facts to justify the
  discount, it fails 606-10-25-12(b), so it isn't accounted for as a separate contract. By name, Jev says no (0.23–0.40). With the rule written out it says yes
  (0.65–0.74).

## Remaining misses

Jev's mean probability over 3 repeats, prose / structured / computed, from the held-out logs. Rows
4–10 are every rule-question error left in the computed shape: 21 of 360 calls, all false alarms
(counted in code from `runs/rev-rec-heldout-v2-computed-2026-10-03T234104845Z.jsonl`).

| # | Cause | Case | Clause, in short | Question | Correct | Jev |
|---|---|---|---|---|---|---|
| 1 | **Reading:** fixed by computed facts | rr-f3-h02 | $900,000 license delivered at signing, paid in 18 monthly installments | Rule: more than a year between service and payment? | yes | 0.25 / 0.24 / **0.72** |
| 2 | **Knowledge:** term of art read in its everyday sense | rr-f3-h01 | Net 90 for a customer in Japan, where net 90–120 is customary; the longest gap is about 9 months | By name: a significant financing component? | no | 0.69 / 0.58 / 0.74 |
| 3 | **Knowledge:** the clause's self-description believed | rr-f4-h05 | "A new and independent agreement" adding tokens 30% below the SSP range for the last 6 months | By name: a contract modification? | yes | 0.23 / 0.40 / 0.33 |
| 4 | **My wording:** SSP is a range, and the rule says "below the standalone selling price" | rr-f1-h04 | "Preferred rate" of $2.30 against an SSP range of $2.10–2.40 | Rule: option below the stated SSP? | no | 0.21 / 0.83 / 0.66 |
| 5 | **My wording:** the rule counts "adding purchased goods" as a change | rr-f4-h03 | Customer exercises an add-on option already in the Prior Order, priced within SSP | Rule: changes the scope or price of the existing contract? | no | 0.88 / 0.89 / 0.91 |
| 6 | **My wording:** "depend on a future event" covers usage tiers | rr-f1-h05 | Add-on tokens drop to $0.80 after 500B a year | Rule: amount depends on a future event? | no | 0.68 / 0.65 / 0.62 |
| 7 | **Structure:** a fixed new price and a fixed credit read as variable; a clarifying sentence that states the distinction removes it (probe 003) | rr-f4-h04 | Price cut to $1.80 for the last 6 months, the $100,000 reduction credited, plus a 12-month extension | Rule: amount depends on a future event? | no | 0.59 / 0.64 / 0.62 |
| 8 | **Structure:** a committed purchase read as an option | rr-f4-h05 | Committed purchase of 300B tokens at 30% below the SSP range | Rule: option to buy more below SSP? | no | 0.70 / 0.83 / 0.88 |
| 9 | **Structure:** a committed purchase read as an option | rr-f4-h04 | Committed 12-month extension at $1.80, 10% below the SSP range | Rule: option to buy more below SSP? | no | 0.44 / 0.45 / 0.58 |
| 10 | **Structure:** a performance fee read as a contract change | rr-f2-h05 | $150,000 success fee to the vendor if the customer's cost per ticket falls 20% | Rule: changes the scope or price of the existing contract? | no | 0.49 / 0.54 / 0.56 |

Fixes by cause:

- **Reading:** compute the facts in code. This works today, as held-out shows.
- **My wording:** the clarified rules in `scripts/build-training.ts` close these gaps: "below the low
  end of the standalone selling price range"; "Exercising an option the existing contract already
  grants, on its stated terms, is not a change"; and, for usage tiers, "a fixed unit price on purchases
  the customer chooses to make, is not variable." I wrote them after seeing held-out errors, so
  they need fresh held-out cases before they can be scored.
- **Knowledge and structure:** training data (below).

**Rewording barely moved the scores.** I rescored the prose runs of every question version against
today's labels (`runs/compare-2026-10-07T190949650Z.md`):

| Clause as written | Dev v0 | Dev v1 | Dev v2 | Held-out v2 |
|---|---|---|---|---|
| Review call | 76% | 78% | 76% | 93% |
| Considerations, rule written out | 98% | 89% | 98% | 94% |
| Considerations, by name | — | — | 86% | 89% |

v0 already spelled out each test, so it started at 98%. My v1 rewrite made the considerations worse
(89%), and v2 recovered them. The scores moved with the setup: computed facts (review call 76 → 92%
on dev, 93 → 100% on held-out), the rule written out in place of the term's name (dev 86 → 98%),
and possibly the vendor's standard terms stated in every case (see Results).

**Probe 003** ([`probes/003-clarified-rules/README.md`](../probes/003-clarified-rules/README.md)). I
asked the two clauses on the results page's section 5 the v2 rule and a clarified rule in the same
request, in all three shapes (18 calls, $0.0005). Range of means across the shapes:

| Clause | Question | v2 rule | Clarified rule | Correct |
|---|---|---|---|---|
| rr-f4-h04 | Variable consideration | 0.57–0.64 | 0.12–0.19 | no |
| rr-f4-h05 | Material right | 0.70–0.89 | 0.53–0.58 | no |

The clarifying sentence fixed the variable-consideration miss in every shape. It moved the
material-right miss to about 0.55, still on the wrong side. The two sentences ("A fixed amount … is
not variable"; "A purchase the customer has already committed to is not an option") state the
distinction each question tests, so they border on giving Jev the answer. I read both as
structure misses: a model that understands these concepts should infer the distinction from the
clause.
The probe covers two
held-out clauses and is diagnostic only. It is not a held-out score.

## Calibration

Held-out, from `calibration` and `calibrationExpert` in `site/data/results.json`. The prose columns
cover all 13 questions (780 answers). The expert-setup columns cover the review question and the
six rule questions in the computed shape (420 answers).

| Jev's probability | Prose: answers | Mean | Came true | Expert setup: answers | Mean | Came true |
|---|---|---|---|---|---|---|
| 0.0–0.1 | 255 | 0.05 | 0% | 151 | 0.04 | 0% |
| 0.1–0.3 | 280 | 0.18 | 3% | 161 | 0.17 | 0% |
| 0.3–0.5 | 93 | 0.39 | 8% | 12 | 0.39 | 0% |
| 0.5–0.7 | 60 | 0.59 | 48% | 29 | 0.62 | 48% |
| 0.7–0.9 | 64 | 0.80 | 70% | 40 | 0.80 | 93% |
| 0.9–1.0 | 28 | 0.93 | 100% | 27 | 0.94 | 89% |

Answers below 0.3 are reliable in both setups. In the 0.5–0.7 band, answers came true 48% of the
time in both, below Jev's mean probability of about 0.6. In prose, Jev leans toward yes through the
middle range: the 0.3–0.5 and 0.7–0.9 bands came true 8% and 70% of the time. The expert setup's 3
wrong answers at or above 0.9 are all rr-f4-h03's contract-modification answers (row 5, my wording).

## Training-data recipe

Each pair keeps the clause wording and the deal fixed and changes only the fact that decides the
answer, so a model can't succeed by matching words. The six pairs in `scripts/build-training.ts`:

| Pair | Weakness, with the rows above that motivate it | Yes side | No side |
|---|---|---|---|
| Purchase vs option (on the results page) | A committed purchase below SSP read as a material right (rows 8–9) | Material right: "Customer may purchase up to 300B additional tokens" at $1.50, 17% below the SSP range | The same clause with "Customer purchases" |
| Financing: the one-year line | Long-looking terms read as financing (rows 1–2) | Financing: 16 monthly installments, the last 15 months after transfer | 12 installments, the last 11 months after transfer |
| Self-description | "Independent" believed (row 3) | Modification: an "independent" order adding tokens while the old contract runs | The same order starting when the old contract expires |
| "Preferred rate" inside vs below SSP | Discount language read as a material right without checking the range (row 4) | Material right: a "preferred rate" of $1.55, 14% below the SSP range | The same clause at $1.85, inside the range |
| Fixed vs variable | A fixed amount read as variable (rows 6–7) | Variable: a 10% credit if usage passes 600B tokens | The same credit, unconditional |
| Existing option vs new scope | Exercising an existing option read as a modification (row 5) | Modification: an add-on the Prior Order doesn't provide for | The same add-on under an option the Prior Order grants |

[`training-examples.md`](training-examples.md) shows each pair side by side: the clauses with the
deciding phrase in bold, the deal, the questions, the answers, and the rationale with its ASC 606
citation. The raw records are in `data/training-examples.jsonl`. `build-training.ts` computes every
amount and gap and derives each answer from the facts with a rule in code. Each record asks the term
by name and the clarified rule, so the rule side carries the wording fixes above. For close calls,
such as a price just under the SSP range, I would label the share of reviewers who would say yes.
I reviewed and approved all 12 records. Jev hasn't been run on them.

## Limits

- **One clause at a time.** Jev saw one clause and its deal facts per request. It never saw a whole
  contract. Scanning a long contract is the workflow the results page illustrates, and I didn't
  measure it.
- **Small.** 20 held-out cases × 3 repeats. One case moves a cell by up to 5 points.
- **One expert labeller.** I approved every label, dev and held-out. The two blind reviews are
  Claude models, as is the drafter, so they don't stand in for a second expert, and another
  accountant might call the close cases differently.
- **Termination for convenience has no held-out positives.** Its 100% means only "no false alarms".
- **One model version,** `jev-1.13.0`. Run-to-run variation is 0.004–0.017 standard deviation on
  identical requests ([probe 002](../probes/002-refund-noul-vs-choice/README.md)).
- **Five case gaps** found by the second reviewer, none changing a label
  (`reviews/2026-10-03-heldout/agent2-review.md`).
- **The wording fixes are unscored.** Probe 003 tested two clarified rules on two held-out clauses.

## Reproduce

```sh
bun rev-rec/scripts/freeze.ts check                    # held-out unchanged since the freeze
bun rev-rec/scripts/run.ts --split heldout --questions v2 --state computed --reps 3
bun rev-rec/scripts/score.ts rev-rec/runs/<run>.jsonl
bun rev-rec/scripts/compare.ts rev-rec/runs/<run>.jsonl ...   # runs side by side
bun probes/003-clarified-rules/run.ts                  # probe 003
bun rev-rec/scripts/build-training.ts && bun rev-rec/scripts/render-training.ts
bun run --cwd site data                                # re-export site/data/results.json
```

`run.ts` and the probe need `TYPESAFE_API_KEY`. Every request and response is logged in
`rev-rec/runs/` and `probes/003-clarified-rules/runs/`.
