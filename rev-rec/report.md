# Jev on ASC 606 contract terms: where a calibrated decision model is weak

> Model `jev-1.13.0`, October 2026. The companion to the
> [results page](https://jev-revrec.victorlau.dev). Every number comes from the run logs in
> [`runs/`](runs/).

## What I tested

Each request gave Jev one contract clause and its deal facts. Jev answered each yes-or-no question
with a probability. An answer is right when it falls on the correct side of 0.5.

**The review call:** does the deal need a revenue accounting review?

**The issues:** which of six ASC 606 issues apply?

- Material right
- Variable consideration
- Refund
- Financing component
- Contract modification
- Termination for convenience

**Two ways of asking about an issue,** both in the same request:

- **By name:** "Read with the deal information: under ASC 606, does `clause` give the customer a
  material right?"
- **Rule written out:** "Does `clause` give the customer an option to buy additional goods or
  services at a price below the standalone selling price stated in the deal information?"

**Three ways of giving the facts:**

- **As written:** the clause and a paragraph of deal facts.
- **Named fields:** the same facts as labelled fields.
- **Computed:** named fields plus comparisons computed in code, such as "17 months between
  delivery and the last payment".

The ways of asking test whether Jev knows the terms. The ways of giving the facts test whether it
reads them.

## How I built the clauses

I started from four families of non-standard terms I reviewed as a revenue accounting lead
([`families.md`](families.md)): token add-ons and overage pricing, refunds versus SLA credits, long
payment terms, and early renewals and other contract changes. For each family I wrote down the facts
that decide the accounting, such as a price against the customer's normal range, or the months
between delivery and payment.

- **17 development clauses,** written one at a time to shape the questions.
- **20 test clauses,** five per family, generated from those facts by a script. Changing a fact
  rewrites the clause and the deal description together, so the amounts always agree. Each family
  mixes clauses that need a review with look-alikes that don't, such as a discount inside the normal
  range or a standard SLA.
- **Training pairs,** which flip the one fact that decides the answer.

I locked the 20 test clauses and their labels before Jev saw them.

## Results

Test set: 20 clauses, 3 runs each. Issue rows give the share of answers right across all six issues.

| Question | Clause as written | Facts computed in code |
|---|---|---|
| Review call | 18 of 20 clauses (56 of 60 runs) | 20 of 20 (60 of 60 runs) |
| Six issues, rule written out | 94% | 94% |
| Six issues, by name | 89% | 87% |

- **Computing the facts fixed the review call,** but not naming the issue.
- **The rule written out matched or beat the name on every issue,** most of all on material right.
- **Jev's low answers were reliable; its middle ones weren't.** On the review call and the rule
  questions with computed facts, every answer below 0.5 was right. Answers from 0.5 to 0.7 were
  right about half the time, so that band should go to a person.

## Naming the issue

Accuracy per issue, by how the question was asked and how the facts were given, over 3 runs:

<table>
<thead>
<tr><th rowspan="2">Issue</th><th rowspan="2">Clauses where it applies</th><th colspan="3">By name</th><th colspan="3">Rule written out</th></tr>
<tr><th>As written</th><th>Named fields</th><th>Computed</th><th>As written</th><th>Named fields</th><th>Computed</th></tr>
</thead>
<tbody>
<tr><td>Material right</td><td>2 of 20</td><td>75%</td><td>75%</td><td>70%</td><td>95%</td><td>85%</td><td>85%</td></tr>
<tr><td>Variable consideration</td><td>4 of 20</td><td>90%</td><td>83%</td><td>87%</td><td>90%</td><td>90%</td><td>90%</td></tr>
<tr><td>Financing component</td><td>3 of 20</td><td>85%</td><td>83%</td><td>82%</td><td>85%</td><td>85%</td><td>100%</td></tr>
<tr><td>Contract modification</td><td>3 of 20</td><td>85%</td><td>85%</td><td>85%</td><td>93%</td><td>88%</td><td>90%</td></tr>
<tr><td>Refund</td><td>2 of 20</td><td>100%</td><td>100%</td><td>100%</td><td>100%</td><td>100%</td><td>100%</td></tr>
</tbody>
</table>

Each rate covers all 20 clauses, so it counts false alarms as well as misses. With 2 to 4 clauses
per issue, these rates describe these clauses, not Jev in general. No test clause raised
termination for convenience.

- **Terms of art read in their everyday sense.** By name, Jev finds a "material right" in a refund
  clause, as if the term meant an important right (rr-f2-h01, probability 0.68–0.71). It finds a
  "significant financing component" in net 90 terms (row 2 below).
- **A clause's description of itself is believed.** rr-f4-h05 calls itself "a new and independent
  agreement" but adds tokens while the old contract still runs. That changes the old contract's
  scope and price, so it's a modification (606-10-25-10). Nothing in the facts justifies its price,
  30% below the normal range, so it fails 606-10-25-12(b) and can't count as a separate contract.
  By name, Jev says it isn't a modification (row 3 below).

## Remaining errors

Jev's mean probability over 3 runs, as written / named fields / computed. Row 1 is the error that
computed facts fixed, and rows 2–3 are the by-name errors above. Rows 4–10 are every rule-question
error left with computed facts; all are false alarms. SSP is the standalone selling price, the
vendor's normal price range.

| # | Cause | Case | Clause, in short | Question | Correct | Jev |
|---|---|---|---|---|---|---|
| 1 | **Reading:** fixed by computed facts | rr-f3-h02 | $900,000 license delivered at signing, paid in 18 monthly installments | Rule: over a year between service and payment? | yes | 0.25 / 0.24 / **0.72** |
| 2 | **Knowledge:** term of art read in its everyday sense | rr-f3-h01 | Net 90, customer in Japan (90–120 days customary); longest gap about 9 months | By name: significant financing component? | no | 0.69 / 0.58 / 0.74 |
| 3 | **Knowledge:** self-description believed | rr-f4-h05 | "A new and independent agreement" adding tokens 30% below the SSP range for the last 6 months | By name: contract modification? | yes | 0.23 / 0.40 / 0.33 |
| 4 | **My wording:** rule says "below the standalone selling price"; SSP is a range | rr-f1-h04 | "Preferred rate" of $2.30, SSP range $2.10–2.40 | Rule: option below the stated SSP? | no | 0.21 / 0.83 / 0.66 |
| 5 | **My wording:** rule counts "adding purchased goods" as a change | rr-f4-h03 | Customer exercises an add-on option the old contract grants, within SSP | Rule: changes the contract's scope or price? | no | 0.88 / 0.89 / 0.91 |
| 6 | **My wording:** "depend on a future event" covers usage tiers | rr-f1-h05 | Add-on tokens drop to $0.80 after 500B a year | Rule: amount depends on a future event? | no | 0.68 / 0.65 / 0.62 |
| 7 | **Structure:** fixed price and fixed credit read as variable | rr-f4-h04 | Price cut to $1.80 for the last 6 months, $100,000 reduction credited, 12-month extension | Rule: amount depends on a future event? | no | 0.59 / 0.64 / 0.62 |
| 8 | **Structure:** committed purchase read as an option | rr-f4-h05 | Committed purchase of 300B tokens, 30% below the SSP range | Rule: option to buy more below SSP? | no | 0.70 / 0.83 / 0.88 |
| 9 | **Structure:** committed purchase read as an option | rr-f4-h04 | Committed 12-month extension at $1.80, 10% below the SSP range | Rule: option to buy more below SSP? | no | 0.44 / 0.45 / 0.58 |
| 10 | **Structure:** performance fee read as a contract change | rr-f2-h05 | $150,000 success fee to the vendor if the customer's cost per ticket falls 20% | Rule: changes the contract's scope or price? | no | 0.49 / 0.54 / 0.56 |

Fixes by cause:

- **Reading (row 1):** compute the facts in code. This works today.
- **My wording (rows 4–6):** I've clarified these rules for the training examples. I wrote the
  clarifications after seeing these errors, so they need fresh test clauses to be scored.
- **Knowledge and structure (rows 2–3, 7–10):** training data. A clarifying sentence fixed row 7 in
  a follow-up check ([probe 003](../probes/003-clarified-rules/README.md)). But it states the
  distinction the question tests, which nearly gives Jev the answer.

## Training data

I built six minimal pairs, each aimed at one kind of error above; all six are laid out side by side
in [`training-examples.md`](training-examples.md). Each pair changes only the fact that decides the
answer, so a model can't succeed by matching words.
For rows 8–9, one side says "Customer purchases" and the other "Customer may purchase up to".

Code derives each answer from the facts with a rule, and I approved every record. Jev hasn't been
run on them. For close calls, such as a price just under the normal range, I'd label the share of
reviewers who would say yes.
