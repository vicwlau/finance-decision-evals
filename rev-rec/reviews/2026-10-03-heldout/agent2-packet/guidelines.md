# Labelling guidelines for rev-rec

You label each case with:
- `trigger`: true or false. Does this deal need a revenue accounting review (deal-desk scope)?
- `considerations`: the subset of these six ASC 606 concepts that apply **in substance**, whether the term is standard or not:
  - `material_right`: an option for the customer to buy future goods or services, or renew, at a discount it would not otherwise get (an incremental discount beyond the standalone selling price range).
  - `variable_consideration`: the amount of consideration can vary: SLA credits, bonuses and penalties, usage-based fees, price concessions, refunds, most-favored-nation pricing, price protection (606-10-32-5 to 32-9).
  - `refund_return`: refund or return rights.
  - `financing_component`: a significant financing component from the timing of payments versus transfer (606-10-32-15 to 32-20, including the one-year practical expedient in 32-18).
  - `contract_modification`: a change in scope or price of an existing contract approved by the parties, such as early renewals or terminating the old contract and signing a new one (606-10-25-10 to 25-13).
  - `termination_convenience`: termination for convenience or cancellation rights.

## What the labels mean (decision #004)

Each case carries two kinds of label (`primary` was dropped by decision #005). They answer different questions:

| Label | Question it answers | Scope |
|---|---|---|
| `considerations` | Which ASC 606 concepts apply to this clause, whether standard or not? | Substance |
| `trigger` | Does this deal need a revenue accounting review? | Deal desk |

A consideration can apply without a trigger. A standard SLA's credits are variable consideration,
but the standard SLA is handled once at the policy level, so no deal review is needed (rr-f2-03).
A co-terminous add-on at SSP is a contract modification, but it's accounted for as a separate
contract, so the existing accounting doesn't change (rr-f4-03).



## Binding conventions (project decisions)

## 004: Labels separate substance (considerations) from deal scope (trigger)

- **Date**: 2026-10-02 · **Tags**: labels, rev-rec
- **Decision**: In rev-rec cases:
  - `considerations` lists the ASC 606 concepts that apply in substance, whether the term is
    standard or not;
  - `trigger` says whether this deal needs a revenue accounting review (deal-desk scope);
  - `primary` is the main consideration to route on when the trigger is yes, otherwise `none`.

  The owner chose this while reviewing the first draft labels (rr-f2-03, rr-f4-03). Those labels
  had mixed the two ideas, so a substantively correct answer from the model was scored as wrong.
  Definitions are in `rev-rec/README.md`.
- **Alternatives**: Labelling considerations only when they trigger a deal review. That makes
  "is variable consideration present?" depend on the vendor's template, which the model can't
  know from the clause, and penalizes correct substance answers.
- **Tradeoff**: The trigger can no longer be derived from the considerations in code ("any
  consideration ≥ 0.5"); it needs its own judgment. Question wording must match each scope.
- **Revisit if**: The deal-desk scope proves too vendor-specific to label consistently, or the
  owner's later labels keep needing exceptions to this split.


## 005: Drop the primary-consideration question

- **Date**: 2026-10-03 · **Tags**: questions, rev-rec
- **Decision**: rev-rec no longer asks which consideration is the "main" issue. The trigger
  decides whether a deal needs review; the six consideration questions say which concepts
  apply. This supersedes the `primary` part of decision #004. The old `primary` values stay in
  `cases.jsonl`, unused, so the owner's approvals don't reset.
- **Alternatives**: Keep primary for routing to specialists. The owner judged "main" subjective
  when a clause has several issues, and revenue accounting reviews every issue anyway. Primary
  was also the weakest question (findings #001, #002): Jev matched the clause's topic rather
  than checking the condition. That finding stands without the question.
- **Tradeoff**: No single-label routing output.
- **Revisit if**: A downstream workflow needs one routing label per clause, for example routing
  to different specialists.


## 007: A refund right is also variable consideration

- **Date**: 2026-10-03 · **Tags**: labels, rev-rec
- **Decision**: When a clause lets the customer get cash back, label both `refund_return` and
  `variable_consideration`. Refunds are one of the ways consideration varies (606-10-32-6). Breakage is not variable
  consideration and has no label yet (families T4).
- **Alternatives**: Label refunds as `refund_return` only. That contradicts ASC 606 and the
  owner-approved rr-f2-01, and the independent held-out review flagged the convention as
  unwritten.
- **Tradeoff**: The two labels are correlated, so refund cases count twice in per-consideration
  numbers.
- **Revisit if**: The owner wants refund liabilities scored separately from other variable
  consideration.


## Lesson on the vendor's standard

## 010: State the vendor's standard wherever the trigger depends on it

- **Date**: 2026-10-03 · **Tags**: case-design, rev-rec
- **Issue**: The independent held-out review found cases whose trigger depends on what's
  standard for the vendor, with no standard given: token expiry and acceptance terms
 . F3 had the same gap with payment terms until the owner caught it.
- **Finding**: The trigger is deal scope ("departs from the vendor's standard terms"). Without
  the standard in the context, the label rests on knowledge the model can't have.
- **Resolution**: Every case whose trigger turns on "standard vs non-standard" states the
  vendor's standard in its context and structured `deal` fields, as F1 does with SSP, F2 with
  the standard SLA, and F3 with standard payment terms.


## Clause families (background)

# rev-rec families

The kinds of non-standard clauses the eval covers. They come from the owner's deal-desk
experience. The ASC 606 framing is Claude's draft for the owner to confirm.

Two lists:

- **In scope:** what the eval set covers now.
- **Tracked:** kept for completeness. Each item is a candidate to add later; nothing here is
  committed.

IDs never change. A family moving between lists keeps its ID.

## In scope

### F1: Prepaid tokens with overage pricing

- **Clause**: The customer prepays for a block of tokens used over the contract term (often three
  years). A price table sets add-on and overage prices.
- **ASC 606 question**: Is there a material right because add-on or overage prices are
  significantly discounted? (606-10-55-41 to 55-45)
- **Judgment**: Is an overage a new purchase decision (an option, tested for a material right)
  or part of the existing deal (variable consideration)? "Significantly discounted" depends on
  the customer's normal pricing, so the state needs that context.
- **Labels**: `material_right`, `variable_consideration`
- **Owner notes**: The discount is measured against standalone selling price (SSP), expressed
  relative to list price. The owner doesn't recall the normal range. Each case's
  `deal_context` states its own normal range, so any plausible range works.
- **Why first**: Current, context-dependent, and absent from existing datasets.

### F2: Refunds vs SLA credits

- **Clause**: Money-back terms: cash refunds, or service credits when uptime or performance
  commitments are missed.
- **ASC 606 question**: Variable consideration and refund liabilities: do these terms reduce or
  put at risk the transaction price?
- **Judgment**: A cash refund vs a credit capped at fees; conditional vs for any reason; a
  standard SLA vs an unusually generous one.
- **Labels**: `refund_return`, `variable_consideration`
- **Why first**: The most frequent deal-desk question, and a natural look-alike pair.

### F3: Long payment terms

- **Clause**: Payment terms longer than the North American norm, common with customers in Japan.
- **ASC 606 question**: Is there a significant financing component? (606-10-32-15 to 32-20; the
  one-year practical expedient)
- **Judgment**: Most customary long terms stay under a year, so they are look-alikes, not
  triggers. The day count is computed in code; the model judges only the significance.
- **Labels**: `financing_component`
- **Owner notes**: Japan terms were typically 90 to 120 days, and none exceeded 12 months. Real
  cases [redacted for the public copy: where the author reviewed them] were all negatives. Positive cases (payment more than a year after
  transfer, such as a license paid in installments) are synthetic, and are realistic elsewhere.
- **Why first**: Mostly hard negatives. It tests whether the model over-flags.

### F4: Early renewal (contract modification)

- **Clause**: The customer renews early. The old contract is terminated and a new one signed.
- **ASC 606 question**: How is the modification accounted for: as a separate contract, as a
  termination of the old contract and creation of a new one, or as a cumulative catch-up?
  (606-10-25-10 to 25-13)
- **Judgment**: Which treatment applies. The remaining value of the old contract spread over the
  new one is arithmetic, done in code.
- **Labels**: `contract_modification`
- **Owner notes**: Usually in year three, or in the last six months of the contract. Typically a
  new three-year deal at a higher volume, with a credit for the old contract.
- **Why first**: A major real-world pain point, and the hardest family: the state needs both
  contracts.

## Tracked

### T1: Consulting and engineering services

- **Clause**: Integration work, or the vendor's engineers building features for the customer.
- **ASC 606 question**: Is the service distinct, or part of the platform? (606-10-25-21:
  significant integration, customization, interdependence)
- **Judgment**: "How critical is the feature to the overall offering?" A genuine judgment call.
- **Labels**: `customization`
- **Why tracked**: Each case needs rich context to be fair. First candidate to swap in.

### T2: Token carryover

- **Clause**: Unused tokens roll into the next contract.
- **ASC 606 question**: Breakage (606-10-55-46 to 55-49), and possibly a material right at
  renewal.
- **Judgment**: How carryover changes the breakage estimate and the renewal.
- **Labels**: `material_right`; breakage has no label yet (see T4)
- **Why tracked**: Pairs naturally with F1 in a later round.

### T3: Acquired company's products

- **Clause**: The right to use a recently acquired company's products.
- **ASC 606 question**: Owner to confirm. Likely: are these additional promised goods, or an
  option (a material right) if free or discounted?
- **Judgment**: Specified vs unspecified products.
- **Labels**: `future_deliverables`?
- **Why tracked**: The accounting issue needs pinning down first.

### T4: Breakage label

- **Clause**: Any prepaid right the customer may never fully use.
- **ASC 606 question**: Recognize expected breakage in proportion to usage, or only when use
  becomes remote? (606-10-55-46 to 55-49)
- **Labels**: proposed `breakage`
- **Why tracked**: Only matters once T2 is in scope.

### T5: Service-type warranty label

- **Clause**: A warranty that goes beyond assuring the product works as specified.
- **ASC 606 question**: A separate performance obligation. (606-10-55-30 to 55-35)
- **Labels**: proposed `service_warranty`
- **Why tracked**: Surfaced by the dataset research (CUAD's warranty category); parked by the
  owner.

### T6: Token structure, pool vs annual allotment

- **Clause**: The same overage clause, but tokens are either one pool for the whole term or an
  annual allotment that expires each year.
- **ASC 606 question**: When is an overage really an overage, and when are unused tokens breakage?
  A pool used early creates a contract asset; annual expiry creates breakage.
- **Judgment**: The token structure changes the accounting without changing the clause's wording.
  An ideal minimal pair.
- **Labels**: `variable_consideration`; breakage has no label yet (see T4)
- **Why tracked**: The owner kept the first set simple (2026-10-03). Also parked here: whether
  usage-based overages are variable consideration in substance (F1-03 and F1-04 are currently
  labelled no).

### T7: Ratable vs consumption for committed token deals

- **Clause**: An enterprise deal with committed tokens, API access, and bundled customer success.
- **ASC 606 question**: Is the promise a stand-ready obligation (access over time, recognized
  ratably) or the delivery of a specified quantity of tokens (recognized as consumed)?
- **Judgment**: The nature of the promise. [Redacted for the public copy: one company's policy.] Some vendors recognize such deals
  ratably, treating API availability plus inseparable customer success as one stand-ready
  obligation. Others recognize capacity commitments as consumed.
- **Labels**: none yet (a measure-of-progress label would be new)
- **Why tracked**: A genuine policy judgment, and a strong soft-label candidate. Kept out of the
  first set to keep it simple.

### T8: A history of early renewals

- **Clause**: The same early-renewal or add-on terms, for a customer, or a vendor practice, with a
  pattern of renewing early and crediting unused prepaid value.
- **ASC 606 question**: Does a customary practice of early-renewal credits create variable
  consideration (an implicit price concession) in the original contract, shorten its enforceable
  term, or change the breakage estimate for unused tokens?
- **Judgment**: A credit that only moves value the customer already paid for is a modification,
  not a concession. A credit worth more than that, given routinely, starts to look like a price
  concession the original contract should have anticipated.
- **Labels**: `contract_modification`, possibly `variable_consideration`
- **Why tracked**: Raised by the owner on rr-f4-03 (2026-10-03); kept out of the first set to
  keep it simple.

