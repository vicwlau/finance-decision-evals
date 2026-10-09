# rev-rec families

The kinds of non-standard clauses the eval covers. They come from my deal-desk experience.
Claude wrote up each family's ASC 606 framing from my notes, and I reviewed it.

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
- **My notes**: The discount is measured against standalone selling price (SSP), expressed
  relative to list price. Each case states its own SSP range in its deal context, so no case
  depends on one vendor's actual range.
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
- **My notes**: Japan terms were typically 90 to 120 days, and none exceeded 12 months. Real
  cases I reviewed were all negatives. Positive cases (payment more than a year after
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
- **My notes**: Usually in year three, or in the last six months of the contract. Typically a
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
- **ASC 606 question**: Not yet confirmed. Likely: are these additional promised goods, or an
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
- **Why tracked**: Surfaced by research on existing contract datasets (CUAD's warranty
  category). I parked it.

### T6: Token structure, pool vs annual allotment

- **Clause**: The same overage clause, but tokens are either one pool for the whole term or an
  annual allotment that expires each year.
- **ASC 606 question**: When is an overage really an overage, and when are unused tokens breakage?
  With a pool, heavy early use draws the prepaid balance down sooner and overage starts only once
  the whole pool is used; annual expiry can create breakage each year.
- **Judgment**: The token structure changes the accounting without changing the clause's wording.
  An ideal minimal pair.
- **Labels**: `variable_consideration`; breakage has no label yet (see T4)
- **Why tracked**: I kept the first set simple (2026-10-03). Also parked here: whether
  usage-based overages are variable consideration in substance (F1-03 and F1-04 are currently
  labelled no).

### T7: Ratable vs consumption for committed token deals

- **Clause**: An enterprise deal with committed tokens, API access, and bundled customer success.
- **ASC 606 question**: Is the promise a stand-ready obligation (access over time, recognized
  ratably) or the delivery of a specified quantity of tokens (recognized as consumed)?
- **Judgment**: The nature of the promise. Some vendors recognize such deals ratably,
  treating API availability plus inseparable customer success as one stand-ready obligation.
  Others recognize capacity commitments as consumed.
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
- **Why tracked**: I raised it on rr-f4-03 (2026-10-03); kept out of the first set to
  keep it simple.
