# Held-out review, agent 2: blind labels for rr-f*-h01..h05 (20 cases)

Reviewer: an independent Claude Opus 5.5 subagent, 2026-10-03, run after the held-out freeze
(`../../data/heldout-freeze.json`) and the v2 held-out run.
Labels: `agent2-blind-labels.jsonl`. Inputs: `agent2-packet/`. No repo file was edited.
No verdict was logged in `rev-rec/data/reviews.jsonl`.

## Setup

- **What it saw** (`agent2-packet/`):
  - `heldout-blind.jsonl`: each case's clause, prose context, `deal` fields, and `computed`
    comparisons. That's what Jev sees, with no labels and no `why`.
  - `guidelines.md`: label definitions, the project's recorded rules on labels and case design, and `families.md`.
    Held-out case IDs were removed.
  - `dev-examples.jsonl`: the 17 author-approved dev cases with their `why` and the author's notes,
    as precedent.
- **What it didn't see:** the draft labels, agent 1's labels or report, Jev's answers, and the v2
  questions. So v2's wording gaps couldn't steer it.
- **One leak:** the session's git status showed the commit subject "Record the owner's decision
  on rr-f4-h03". It told the reviewer the case had been contested, but not what was decided.
- **Weakness:** the drafter, agent 1, and agent 2 are all Claude Opus. Their agreement can hide
  a blind spot they share.

## Agreement

- **Agent 2 vs the draft labels:** 140 of 140 decisions (20 cases × trigger + 6
  considerations).
- **Agent 2 vs agent 1's blind labels:** 139 of 140. The one difference is rr-f2-h01
  `variable_consideration`. Agent 2 and the draft say yes; agent 1 said no when labelling blind,
  then agreed with the draft after review (the project has since written down that a refund right is
  also variable consideration).
- **Where Jev was wrong in every state shape** (f4-h03, f4-h05, f4-h04, f1-h05, f1-h04), agent 2
  agrees with the draft.

## Medium confidence (none low)

- **rr-f3-h05** (trigger true, financing). The gap tops one year only for the first month or so.
  The average gap is about 8 months, so the financing effect is likely insignificant. A reviewer
  applying the one-year expedient to the contract as a whole would say false. The label follows
  rr-f3-04: an assessment is needed, whatever its outcome.
- **rr-f4-h03** (trigger false, none). The customer exercises an add-on option already in the
  Prior Order, priced at SSP. That's an optional purchase, not a modification. Some reviewers
  would label `contract_modification` by analogy to rr-f4-03, which had no such option. The
  trigger stays false either way.

## Doubts on high-confidence labels

- **rr-f1-h02:** the price is fixed off list for three years. If list and SSP rise, the locked
  price could fall below SSP later.
- **rr-f1-h05:** whether the $0.80 tier is material depends on how likely the customer is to pass
  500B tokens a year.
- **rr-f2-h01:** the bigger issue is customer acceptance and when control transfers (606-10-55-85
  to 55-88). None of the six labels covers it.
- **rr-f2-h04:** the dollar effect is small (still capped at 10%). The trigger rests on the change
  from credit to cash, as in rr-f2-02.
- **rr-f3-h02:** extended payment on a license delivered up front can also raise collectibility
  and implied price concession questions (606-10-25-1(e), 32-7(b)). No label covers these.
- **rr-f4-h04:** the $100,000 price cut could be a price concession (`variable_consideration`) if
  it was given for past problems. Nothing in the case says so.

## Gaps in the cases

None changes a label. Fixing any of them changes the frozen held-out set and needs a new freeze
decision.

- **rr-f2-h05:** states the standard SLA, but not that the vendor's standard pricing has no
  success fees (the project's rule is to state the vendor's standard wherever the trigger
  depends on it). The trigger assumes a success fee is non-standard.
- **rr-f3-h03 and rr-f3-h04:** state standard payment terms (net days) but not standard billing
  frequency. f3-h04's trigger therefore rests on the gap of more than a year, not on a stated
  departure from the standard. f3-h03's label holds either way.
- **rr-f4-h01:** `computed` omits the new order's per-token price, $1.90 per 1M, 5% below the SSP
  low end. Other F4 cases compute price vs SSP.
- **rr-f3-h02:** `deal.subscription` holds a perpetual license. Only a field name.
- **rr-f2-h01:** the Exhibit B acceptance criteria aren't given. Whether they are objective
  affects timing, not the labels.

Every price, percentage, and day count in `computed` was re-checked. No inconsistencies between
`context`, `deal`, and `computed`.
