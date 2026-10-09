# rev-rec: non-standard contract terms under ASC 606

This track tests whether Jev, TypeSafe's calibrated decision model, can do a deal-desk task I did
as a revenue accounting manager. A reviewer reads one non-standard clause with the deal's facts and
answers two questions:

- Does this deal need a revenue accounting review? (the review call)
- Which ASC 606 considerations does the clause raise?

When Jev gets one wrong, the design tells me whether it misread the clause, lacked the accounting
knowledge, or failed to apply a rule it was given ([`eval-design.md`](eval-design.md)). The
results are in [`report.md`](report.md).

The original plan was larger: 40 dev cases and about 60 held-out cases across 16 consideration
labels. I cut it to four clause families and six considerations, with 17 dev cases and 20
held-out cases.

## Families

Every case belongs to one family of non-standard clause. [`families.md`](families.md) describes
each one (the clause, the ASC 606 question, and the judgment it needs) and lists the families I
track for later rounds.

| ID | Family | Considerations it targets | Dev | Held-out |
|---|---|---|---|---|
| F1 | Prepaid tokens with add-on and overage pricing | `material_right`, `variable_consideration` | 5 | 5 |
| F2 | Refunds vs SLA credits | `refund_return`, `variable_consideration` | 4 | 5 |
| F3 | Long payment terms | `financing_component` | 4 | 5 |
| F4 | Early renewals and other contract changes | `contract_modification` | 4 | 5 |

## What the labels mean

Each case carries two labels. They answer different questions.

| Label | Question it answers | Scope |
|---|---|---|
| `trigger` | Does this deal need a revenue accounting review? It does when a term departs from the vendor's standard terms in a way that could change how much revenue is recognized, or when. | Deal desk |
| `considerations` | Which ASC 606 concepts apply to this clause, whether the term is standard or not? | Substance |

The six considerations:

- `material_right`: an option to buy more, or to renew, at a discount the customer wouldn't
  otherwise get (606-10-55-41 to 55-45).
- `variable_consideration`: the amount can vary, for example SLA credits, bonuses and penalties,
  price concessions, or refunds (606-10-32-5 to 32-9). Usage the customer chooses to buy at a fixed
  unit price, such as overage, is an optional purchase: it's tested as an option (`material_right`),
  not as variable consideration.
- `refund_return`: refund or return rights.
- `financing_component`: the timing of payments against transfer may create a significant
  financing component (606-10-32-15 to 32-20, including the one-year practical expedient).
- `contract_modification`: a change in the scope or price of an existing contract that both
  parties approve, such as an early renewal (606-10-25-10 to 25-13).
- `termination_convenience`: termination for convenience or other cancellation rights.

A consideration can apply without a trigger. A standard SLA's credits are variable consideration,
but the standard SLA is handled once at the policy level, so no deal review is needed (rr-f2-03).
A co-terminous add-on at SSP is a contract modification, but it's accounted for as a separate
contract, so the existing accounting doesn't change (rr-f4-03).

Four more conventions apply to every case:

- **A refund right is also variable consideration.** A clause that lets the customer get cash
  back carries both `refund_return` and `variable_consideration` (606-10-32-6). Breakage from
  expiring prepaid tokens has no label.
- **The vendor's standard is stated.** Where the trigger depends on what's standard for the
  vendor, the case states that standard: the SSP range (F1), the standard SLA (F2), or the
  standard payment terms (F3). Without it, the label would rest on knowledge Jev can't have.
- **The material-right rule is a screen.** It flags an option priced below the low end of the SSP
  range. A full assessment would also weigh how material the discount is and how likely the
  customer is to use it (606-10-55-41 to 55-44).
- **A renewal that starts at expiry is a new contract.** A renewal agreed during the term that
  starts when the current contract ends is labelled a new contract, not a modification (rr-f4-02,
  `tr-mod-01-b`). Many practitioners would call it a modification accounted for as a separate
  contract (606-10-25-12). The accounting is the same; the label follows the timing.

Cases also store `labels.primary`, the main consideration, which question sets v0 and v1 asked
for. I dropped that question in v2: "main" is subjective when a clause raises several issues, and
revenue accounting reviews every issue anyway. The field stays in the data, unused.

## Case format

`data/cases.jsonl` holds one case per line. A held-out case, shortened:

```json
{"id": "rr-f1-h01", "family": "F1",
 "clause": "Additional Tokens. At any time during the Term, Customer may order additional tokens, in increments of 50B, at $1.25 per 1M tokens.",
 "context": "Customer: enterprise AI platform customer on a three-year term. … SSP … $2.10 to $2.40 per 1M tokens. …",
 "facts": {"term_type": "add_on_option", "add_on_price_per_1m": 1.25, "ssp_range_per_1m": [2.1, 2.4], …},
 "state": {"deal": {…}, "computed": {"add_on_price_vs_ssp": "$1.25 per 1M tokens is 40% below the low end of the SSP range"}},
 "labels": {"trigger": true, "considerations": ["material_right"], "primary": "none"},
 "difficulty": "easy", "why": "$1.25 is 40% below the low end of SSP. …",
 "status": "draft", "split": "heldout"}
```

| Field | Meaning |
|---|---|
| `clause` | The clause text Jev reads. |
| `context` | The deal facts as a paragraph, as an analyst would get them. |
| `facts` | The structured facts behind the text: term type, amounts, prices, ranges, dates and durations. They are kept complete enough to calculate from. |
| `state` | Held-out and demo cases only: the named `deal` fields and the code-computed `computed` comparisons Jev sees in the structured and computed shapes. Dev cases get these from `facts` at run time (`scripts/state.ts`). |
| `labels` | `trigger`, `considerations`, and the unused `primary`. |
| `difficulty` | `easy` or `hard`. Look-alikes and threshold cases are marked hard. |
| `why` | One line for the answer key, with the ASC 606 citation. |
| `status` | `"draft"` on every line. See below. |
| `split` | `dev`, `heldout`, or `demo` (the results page's example clause, never scored). |

**Approvals.** `status` stays `"draft"` on every line, approved or not. The held-out lines are
frozen by hash (`data/heldout-freeze.json`), so writing an approval into them would break the
freeze. Approvals live in `data/reviews.jsonl` instead, for every split. Each line there is one
verdict (`approve` or `note`) with the reviewer, the date, the run being reviewed, and a snapshot
of the case as it stood. `reviewer: "owner"` marks my verdicts, and `agent:claude-opus-5-5` marks
an independent Claude reviewer's. My verdict on a case supersedes an agent's. `score.ts` prints in
every results file how many cases I approved and how many only an agent approved.

The dev cases were written one at a time: Claude drafted them from my notes, and I reviewed and
edited them. One frozen held-out case, rr-f2-h03, names the substance-versus-scope rule in its `why`
by an internal reference; its text stays as frozen. The held-out cases are generated from their facts by
`scripts/build-heldout.ts`, so every amount in the text is computed in code.

## Questions

`questions/` holds the versioned question sets. Each run sends one set's `questions` object with
every case and logs the version.

- `v0.json`: one review question, one yes/no question per consideration, and a choice question
  for the primary consideration.
- `v1.json`: reworded so the review question is about deal scope and each consideration question
  is about substance.
- `v2.json`: no primary question. Each consideration is asked twice in the same request, by name
  (`<id>_concept`) and with the rule written out (`<id>`). That makes 13 questions per request.

I wrote and revised the questions on dev only. Held-out ran once, on v2.

## Folders

```
rev-rec/
  README.md                 this file
  report.md                 results and failure analysis
  eval-design.md            the two axes and how to read the results
  families.md               clause families: in scope and tracked
  training-examples.md      the training pairs, side by side (generated)
  data/
    cases.jsonl             dev, held-out and demo cases
    heldout-freeze.json     held-out hash, method, pre-registered slices, approvals at freeze
    reviews.jsonl           every review verdict and note
    training-examples.jsonl draft training records (minimal pairs)
  questions/                question sets v0, v1, v2
  runs/                     one JSONL log per run, its .results.md, and compare-*.md tables
  reviews/                  label-review evidence, one folder per review round
  scripts/                  see below
```

| Script | What it does |
|---|---|
| `run.ts` | Sends every case in a split to Jev in one state shape, with repeats, and logs each request and response to `runs/`. Refuses a held-out run if the freeze hash differs. |
| `score.ts` | Scores a run log against the labels and writes `<run>.results.md` beside it: accuracy, Brier score, a reliability table, and a per-case table. |
| `compare.ts` | Scores several runs side by side against the current labels and writes `runs/compare-<time>.md`. |
| `state.ts` | Builds what Jev sees for a case in each state shape: prose, structured, or computed. |
| `freeze.ts` | `check` verifies the held-out hash; `write` creates the freeze record and refuses if one exists. |
| `build-heldout.ts` | Builds the held-out cases from their facts. |
| `check-cases.ts` | Checks that the dollar totals and token volumes in each case's text follow from its facts. |
| `build-demo.ts` | Builds the results page's demo clause (`split: "demo"`). |
| `build-training.ts` | Builds the training pairs into `data/training-examples.jsonl`, deriving each answer from the facts with a rule in code. |
| `render-training.ts` | Renders `training-examples.md` from the training records. |

## How to run

The scripts need [Bun](https://bun.sh) and import nothing outside this repo. Run them from the
repo root:

```sh
bun rev-rec/scripts/freeze.ts check          # held-out unchanged since the freeze
bun rev-rec/scripts/check-cases.ts           # amounts in the text follow from the facts
export TYPESAFE_API_KEY=…                    # your own key; only run.ts calls the API
bun rev-rec/scripts/run.ts --split heldout --questions v2 --state computed --reps 3
bun rev-rec/scripts/score.ts rev-rec/runs/<run>.jsonl
bun rev-rec/scripts/compare.ts rev-rec/runs/<run>.jsonl ...
bun rev-rec/scripts/build-training.ts && bun rev-rec/scripts/render-training.ts
```

`run.ts` defaults to `--split dev --questions v0 --state prose --reps 3`. It calls `jev-1.13.0` on
TypeSafe's direct API (`POST https://api.typesafe.ai/v1/systemone`) with four requests in flight.
It retries timeouts, 429s and 5xx responses with backoff and honors `Retry-After`. Each log record
holds the run id, date, question-set version, state shape, requested and returned model, tokens,
and cost. A held-out run in one shape is 60 calls and costs well under a cent.
