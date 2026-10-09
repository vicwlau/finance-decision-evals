# Held-out review: rev-rec rr-f*-h01..h05 (20 cases)

Reviewer: independent Claude session standing in for the author, 2026-10-03.
Inputs: `rev-rec/README.md`, the project's recorded decisions on labels, questions and eval design, `rev-rec/eval-design.md`, `rev-rec/questions/v2.json`, the 17 dev cases and the author's notes on them (`rev-rec/data/reviews.jsonl`), `rev-rec/scripts/build-heldout.ts`, `rev-rec/scripts/state.ts`.
Blind labels (written before opening the drafts): `blind-labels.jsonl` in this folder.
No repo file was edited.

## 1. Verdicts

| Case | Verdict | One line |
|---|---|---|
| rr-f1-h01 | APPROVE | $1.25 vs $2.10 SSP floor; material right; easy positive |
| rr-f1-h02 | APPROVE | 10% off list = $2.34, inside SSP; good reading test |
| rr-f1-h03 | CHANGE | Labels right, but the context never states the vendor's standard on expiry, and the trigger depends on it |
| rr-f1-h04 | CHANGE | Labels right; clause is unrealistic (a vendor contract conceding a "material right"), which also muddies the trigger |
| rr-f1-h05 | APPROVE | Conditional $0.80 tier below the $1.80 floor; material right |
| rr-f2-h01 | CHANGE | Labels right (I was wrong on VC); context gives an SLA standard that can't apply to a perpetual license and no acceptance standard; `why` miscites the label rule |
| rr-f2-h02 | APPROVE | Negation boilerplate; good unnamed look-alike |
| rr-f2-h03 | APPROVE | Labels right per the label rule; but its trap is named outright by the v2 trigger question (guardrail) |
| rr-f2-h04 | APPROVE | Credit cash-out; VC + refund |
| rr-f2-h05 | APPROVE | Success fee to vendor; VC; good unnamed look-alike |
| rr-f3-h01 | CHANGE | Labels right; `computed` gap is wrong ("about 3 months"; the longest gap either way is about 9) |
| rr-f3-h02 | APPROVE | 18 installments; months 13–17 past one year; SFC assessment |
| rr-f3-h03 | CHANGE | Labels right; `computed` explanation measures the wrong direction |
| rr-f3-h04 | APPROVE | Two-year prepay; consistent with author-approved rr-f3-04 (trap named by "in either direction"; it's labelled easy) |
| rr-f3-h05 | APPROVE | Threshold case; trigger and financing label are right |
| rr-f4-h01 | APPROVE | Terminate-and-replace early renewal; modification |
| rr-f4-h02 | APPROVE | Administrative amendment; good unnamed look-alike |
| rr-f4-h03 | AUTHOR | Option exercise as "not a modification" is defensible (55-43), but it sits next to author-approved rr-f4-03 and against one reading of the v2 rule |
| rr-f4-h04 | APPROVE | Blend-and-extend below SSP; modification |
| rr-f4-h05 | APPROVE | "Independent" supplemental order below SSP; modification in substance |

Totals: 14 APPROVE, 5 CHANGE, 1 AUTHOR. None of the five CHANGEs alters a label. Four fix what Jev is shown (context or `computed`); the fifth (h04) rewrites an unrealistic clause.

## 2. Blind vs draft agreement

| Label | Agree | Rate |
|---|---|---|
| trigger | 20/20 | 100% |
| material_right | 20/20 | 100% |
| variable_consideration | 19/20 | 95% |
| refund_return | 20/20 | 100% |
| financing_component | 20/20 | 100% |
| contract_modification | 20/20 | 100% |
| termination_convenience | 20/20 | 100% |
| All 140 label decisions | 139/140 | 99.3% |
| Case-level exact match | 19/20 | 95% |

The single disagreement: rr-f2-h01 `variable_consideration` (draft yes, blind no). After reconsidering, **the draft is right.** 606-10-32-6 lists "refunds" among the items that make consideration variable. 55-23 to 55-25 measure return rights with the variable-consideration and constraint guidance. The author approved the same convention on dev rr-f2-01, and the v2 VC rule question names refunds. I had treated `refund_return` as exclusive of VC; that was wrong under this project's labels.

**How much this agreement is worth.** Less than 99% suggests:
- **Not fully blind.** The task prompt revealed the draft labels for rr-f1-h03, rr-f2-h03, and rr-f4-h03, and the framing of rr-f3-h05, before I labelled. Agreement on those four carries little weight.
- **Same model family as the drafter.** Correlated blind spots are likely. Independent agreement is weak evidence of correctness.
- My confidence was low or medium on rr-f1-h02, h03, h04, rr-f2-h01, h04, rr-f3-h04, h05, rr-f4-h03. The author's spot-check should start there.

## 3. Per-case detail

Arithmetic was re-checked in code. Every amount in clause, context, `facts`, and `computed` agrees, except the two F3 `computed` strings noted below. Only `facts.state.deal` and `facts.state.computed` reach Jev (`state.ts`, `buildState`), so top-level `term_type` and `disclaimer` don't leak.

### F1

**rr-f1-h01: APPROVE.** $1.25 is 40.5% below the $2.10 SSP floor and 52% below list. Material right (606-10-55-42, 55-43). Customer-elected orders are options, not VC. `computed` is neutral. Near-duplicate of dev rr-f1-01; fine as an easy positive.

**rr-f1-h02: APPROVE.** $2.60 × 0.9 = $2.34, inside $2.10–$2.40. Option at SSP is a marketing offer (55-43). A good reading test, and no v2 question names it. Minor residual: "list price in effect on the Effective Date" is a three-year price lock. It would matter only if list were expected to rise; nothing says so. No change needed.

**rr-f1-h03: CHANGE.** Labels agree with mine: trigger no, considerations none. Breakage (55-46 to 55-49) changes the timing of revenue, not the fixed $5.4M transaction price. So it's not VC, and the clause negates refunds.
- **Problem:** the `why` says "Use-it-or-lose-it expiry is standard," but nothing in the context says so. The v2 trigger asks whether the term "departs from the vendor's standard terms." Annual expiry (versus expiry at term end) accelerates breakage. An analyst who can't see the standard could fairly route it.
- **Fix (context):** append " Under the vendor's standard order form, prepaid tokens are allotted by contract year, and unused tokens expire at the end of each contract year."
- **Fix (deal):** add `"standard_token_terms": "allotted by contract year; unused tokens expire at the end of each contract year"`.
- **Fix (why):** "Look-alike: a token clause with no option, refund, or financing. Annual expiry matches the vendor's standard order form. Unused tokens become breakage (606-10-55-46 to 55-49), which changes timing, not the fixed transaction price, so it isn't variable consideration."
- **Caveat for scoring:** 55-48 points breakage estimates to the VC constraint. A knowledgeable model may answer "yes" to the concept question "does the clause involve variable consideration?" Read concept-framed VC misses here as a definitional edge, not a knowledge gap.

**rr-f1-h04: CHANGE.** Labels agree with mine: no trigger, no considerations. $2.30 is inside SSP and above the $2.25 committed price, so there's no material right (55-43).
- **Problem: realism.** "Material right" is an accounting term of art. No vendor's legal team would concede one in a customer contract. The dev mirror rr-f1-05 (disclaiming a material right) is at least the protective direction a vendor might write. The odd text also creates a fair argument for trigger = yes: a contract asserting an accounting conclusion is non-standard language that a cautious desk would route or strike.
- **Fix (clause):** "Preferred Add-On Pricing. In recognition of Customer's prepaid commitment, Customer may purchase additional tokens during the Term at a preferred rate of $2.30 per 1M tokens."
- **Fix (facts):** drop `disclaimer: "is_material_right"`.
- **Fix (why):** "Look-alike: 'preferred rate' language, but $2.30 is inside the SSP range and above the $2.25 committed price, so there's no incremental discount and no material right (606-10-55-43)."
- **If the author wants to keep the exact reverse mirror of rr-f1-05,** the trigger becomes an AUTHOR call.

**rr-f1-h05: APPROVE.** $0.80 is 56% below the $1.80 volume floor. The condition affects likelihood of exercise in allocation (55-44), not whether the right exists. Same kind as dev rr-f1-04 (tier below the volume floor), so it's not an unseen look-alike.
- **Optional fix:** the clause never prices the first 500B of add-ons. An analyst would ask, and the schedule track needs it (README: facts complete enough to calculate from). Suggested clause: "Volume Add-On. Customer may purchase add-on tokens at $2.40 per 1M tokens. Once Customer's add-on purchases in a contract year exceed 500B tokens, Customer may purchase further tokens in that contract year at $0.80 per 1M tokens." Add `base_add_on_price_per_1m: 2.4` to facts.

### F2

**rr-f2-h01: CHANGE.** Labels right: trigger yes, `refund_return` + `variable_consideration`. My blind omission of VC was wrong (section 2). Customer acceptance with custom criteria (55-85 to 55-88) can also defer control. That isn't one of the six, but it reinforces the trigger.
- **Problem 1:** the context's only "standard" is an SLA "of up to 10% of the monthly fee." A perpetual on-premise license has no monthly fee. The relevant standard (acceptance and warranty) is missing.
- **Problem 2:** `deal.subscription` holds a perpetual license.
- **Problem 3:** the `why` cites the label rule (considerations vs trigger; see `../../README.md#what-the-labels-mean`) for "refund ⇒ VC". That rule doesn't say that.
- **Fix (context):** replace "The vendor's standard SLA gives service credits of up to 10% of the monthly fee, applied against future invoices." with "The vendor's standard license terms treat the Software as accepted on delivery and give a 90-day warranty that it conforms to its documentation, with repair or replacement as the remedy."
- **Fix (deal):** rename `subscription` to `license`. Replace `standard_sla` with `standard_license_terms` holding the same text.
- **Fix (why):** "Cash back if acceptance fails puts the fee at risk: a refund right, and so variable consideration (606-10-32-6 lists refunds; same convention as rr-f2-01). Custom acceptance criteria and a refund remedy depart from standard acceptance on delivery."

**rr-f2-h02: APPROVE.** Standard non-refundability boilerplate. No dev case has a negation, and no v2 question names one: a true unseen look-alike.

**rr-f2-h03: APPROVE (labels), guardrail flag.** VC yes (32-6), trigger no. The clause matches the stated standard on cap (15%), mechanism (on request), and form (future-invoice credits). That's consistent with the label rule and author-approved rr-f2-03. Moving the standard to 15% (dev used 10%) is a good touch: it defeats a model that memorized "10% is standard."
- **Guardrail:** the v2 trigger names this trap outright. The true criterion cites "credits or penalties beyond the standard SLA". The false criterion reads "matches the vendor's standard terms … even if an ASC 606 concept technically applies." It's also the same kind as dev rr-f2-03. Don't count it among the unnamed look-alikes. "Hard" is generous under rule framing.
- **Minor:** the context gives the standard's cap and mechanism but not its threshold or step schedule. `computed` "same as the standard SLA" covers two attributes only. Acceptable.

**rr-f2-h04: APPROVE.** Converting unused credits to cash is a cash refund of fees received (32-10), on top of the VC credits. Clear departure from the credit-only standard. Realistic.

**rr-f2-h05: APPROVE.** Contingent $150k bonus: estimate and constrain (32-5 to 32-13), allocate (32-39 to 32-41). The v2 VC rule covers it generically, but no example names a bonus paid to the vendor. A good unseen look-alike for both trigger and VC.

### F3

**rr-f3-h01: CHANGE (state text).** Labels right: within the customary Japan range; expedient applies (32-18).
- **Problem:** `computed.longest_gap_between_service_and_payment` = "about 3 months (payment due 90 days after each annual invoice)". The string is hand-typed in `build-heldout.ts`, not computed. It also measures only service-before-payment. v2's financing question says "in either direction," and rr-f3-h04 counts the prepayment direction. Each annual payment lands at day 90, about 9 months before the year's service ends. The longest gap is about 9 months, not 3. Label-neutral (still under 12), but it's a false statement in the computed state.
- **Fix:** "about 9 months (payment is due 90 days into each 12-month service year, about 9 months before that year's service ends)". Generate it in code.

**rr-f3-h02: APPROVE.** 18 × $50,000 = $900,000. Installments in months 13–17 (about $250k) fall more than a year after transfer, so the expedient isn't available; assess the SFC (32-15, 32-16).
- **Optional:** `deal.subscription` holds a perpetual license; rename to `license`.

**rr-f3-h03: CHANGE (state text).** Labels right.
- **Problem:** `computed` = "about 1 month (each quarter is paid within 30 days of its start)". Hand-typed, and the explanation describes the wrong direction. Payment at day 30 precedes the quarter's last service by about 2 months.
- **Fix:** "about 2 months (payment is due 30 days into each 3-month quarter, about 2 months before that quarter's service ends)".

**rr-f3-h04: APPROVE.** Matches author-approved rr-f3-04 (prepay, trigger yes, financing). The author noted on rr-f3-04 that they weren't sure of the end accounting; the label is "must assess," which is right (32-15 to 32-17).
- **Guardrail:** the trap (advance payment counts) is named by the v2 rule's "in either direction," and dev rr-f3-04 is the same kind. Correctly labelled easy.

**rr-f3-h05: APPROVE.** See section 4.

### F4

**rr-f4-h01: APPROVE.** Terminate-and-replace is a modification (25-10). $1.90 is below the $2.00 SSP floor, so it fails 25-12(b); prospective under 25-13(a). Near-duplicate of dev rr-f4-01; fine as an easy positive.
- **Optional:** `computed` lacks the new-price comparison that other F4 cases carry. Add `"new_price_vs_ssp": "$1.90 per 1M tokens is 5% below the low end of the SSP range"`.

**rr-f4-h02: APPROVE.** Billing-contact change is neither scope nor price (25-10). True unseen look-alike.

**rr-f4-h03: AUTHOR.** See section 4.

**rr-f4-h04: APPROVE.** Price cut on the remaining 500B (a $100k concession on fees already billed) plus a 12-month extension at $1.80, 10% below the SSP floor. Modification (25-10), not a separate contract (25-12), prospective (25-13(a)). The `why`'s reasoning is valid. It could also mention that the extension fails 25-12(b).
- **Optional:** the clause doesn't say how the $100k reduction is settled. Adding "The resulting $100,000 reduction is credited against the extension invoice." completes the facts for the schedule track and keeps `refund_return` clearly false.

**rr-f4-h05: APPROVE.** The label doesn't control. An add-on 30% below the SSP floor fails 25-12(b), so it's a modification of the Prior Order (25-10, 25-11). Realistic wording. Same trap kind (self-described separateness) as dev rr-f4-04.

## 4. Specific-attention cases

### rr-f4-h03: option exercise labelled "not a modification" (AUTHOR)

**For the draft label (no `contract_modification`):**
- 25-10 defines a modification as a change in scope or price "approved by the parties." Exercising Section 4.2 changes neither; the price and right were agreed at inception.
- 55-43: an option at SSP is a marketing offer, accounted for "only when the customer exercises the option." That means a new purchase under existing terms, not a modification.
- The author anticipated exactly this distinction in a note on rr-f4-03 (2026-10-03): "assuming a contract without add-on token pricing, would it be consider contract mod since that term isn't in the original contract?" This case is the other half of that pair.
- My blind label agreed (medium confidence).

**Against, or for the author to decide:**
- In practice, many people call any add-on purchase "a modification accounted for as a separate contract" (25-12). That gives the identical accounting outcome, and it's the framing the author approved on rr-f4-03.
- The v2 rule question is ambiguous on this case. "…for example by adding purchased goods or services" points to yes; "An option to buy more later is not a change" points to no. Jev's rule-framed answer may be scored on a coin-flip reading of the question, not on judgment. The second sentence also half-names the trap (guardrail).
- The clause ends with amendment boilerplate, "All other terms of the Prior Order remain unchanged." That implies the document changes the Prior Order, which works against the draft's own rationale ("the parties approve no change").

**Recommendation:** keep the draft label (it's the more precise reading, and 55-43 supports it). Replace the last sentence of the clause with "This order is placed under, and governed by, the Prior Order." Report this case separately from the unnamed look-alikes.

### rr-f3-h05: threshold on the one-year expedient (APPROVE)

- **Timing:** invoiced at month 12, net 60, so paid at about month 14. Service in the first ~2 months (about $60k of $360k) is paid more than 12 months after delivery. The weighted-average gap is about 8 months. The `computed` "about 13 months" measures from the end of the first month; from day one it's about 14. Either is fine.
- **Why the labels are right:** 32-18 is worded per good or service ("when the entity transfers a promised good or service … and when the customer pays for that good or service"). For the early months that exceeds a year, so the expedient doesn't clearly cover the contract.
- **The project's convention fits:** "the consideration applies = the SFC must be assessed" (rr-f3-04, author-approved), and significance is the assessment's outcome. The `why` correctly says it's likely insignificant.
- **The v2 rule question reads the same way:** "more than one year separate…" is true for the early service.
- **The trigger has a second, independent support:** billing a full year in arrears plus net 60 departs sharply from the net 30 standard. A deal desk would route it on that alone.
- **Alternative view, rejected:** averaging across the contract (about 8 months) puts it inside the expedient. Practice varies on measuring one payment against service delivered over time, which is why this is a fair "hard" threshold. I don't think it's a label error.

### rr-f2-h03: standard SLA, VC but no trigger (APPROVE)

Correct under the label rule and identical in kind to author-approved rr-f2-03. Clause and standard match on cap, mechanism, and form. Main issue is the guardrail: the v2 trigger's own criteria spell out this exact trap (section 3).

### rr-f1-h03: token expiry, no considerations (CHANGE, labels unchanged)

The "no considerations" label is right. Breakage isn't among the six, and annual expiry changes timing, not the transaction price. The case needs the vendor's standard stated so the trigger is decidable. Exact fix in section 3.

## 5. Look-alike guardrail against v2

| Case | Trap | Named by a v2 rule question? |
|---|---|---|
| rr-f1-h02 | discount as % of list | No |
| rr-f1-h03 | expiry / breakage | No |
| rr-f1-h04 | self-label "material right" | No (dev mirror rr-f1-05) |
| rr-f1-h05 | conditional tier | No (dev kin rr-f1-04) |
| rr-f2-h02 | negation | No |
| rr-f2-h03 | standard SLA | **Yes.** Trigger criteria: "beyond the standard SLA" / "matches the vendor's standard terms … even if an ASC 606 concept technically applies" |
| rr-f2-h05 | bonus to vendor | No (VC rule covers it generically) |
| rr-f3-h03 | "installments" quarterly | No |
| rr-f3-h04 (easy) | prepayment counts | **Yes.** Financing rule: "in either direction" |
| rr-f3-h05 | threshold from earliest service | No (the one-year line is named; the measurement trap isn't) |
| rr-f4-h02 | administrative amendment | No |
| rr-f4-h03 | option exercise | **Partly.** CM rule: "An option to buy more later is not a change", while "adding purchased goods" points the other way |
| rr-f4-h05 | self-described independence | No (dev mirror rr-f4-04) |

The builder header and the project's session notes both say held-out look-alikes are "ones no v2 rule question names." That's not true for rr-f2-h03 or rr-f4-h03; correct both claims. The eval-design guardrail (`../../eval-design.md`) only requires that look-alikes *include* unnamed kinds, which the set does (8 unnamed, unseen look-alikes). Report that subset separately: rr-f1-h02, f1-h03, f2-h02, f2-h05, f3-h03, f3-h05, f4-h02, f4-h04, plus f2-h01, f2-h04, f3-h02 as new positives.

## 6. Systemic issues

1. **Guardrail overstated** (section 5). Also, 8 of 20 cases mirror a dev kind: f1-h01↔rr-f1-01, f1-h04↔rr-f1-05, f1-h05↔rr-f1-04, f2-h03↔rr-f2-03, f3-h01↔rr-f3-01, f3-h04↔rr-f3-04, f4-h01↔rr-f4-01, f4-h05↔rr-f4-04. The headline held-out number partly measures dev kinds again.
2. **Thin positives per consideration.** Held-out positives: material_right 2, refund_return 2, VC 4, financing 3, contract_modification 3, termination_convenience **0**.
   - termination_convenience recall and calibration can't be measured on held-out.
   - The README's own look-alike, termination for cause vs for convenience, appears nowhere (dev or held-out).
   - With 2 positives, one miss reads as 50% recall. Report counts next to rates.
3. **Unwritten label convention.** "A refund right is also variable consideration" is applied in rr-f2-01, rr-f2-h01, and rr-f2-h04, and is sound (606-10-32-6). But it's cited to the label rule, which doesn't contain it.
   - **Candidate decision or README line:** "A refund or cash-back right is also labelled `variable_consideration` (606-10-32-6). Breakage from expiry is not, because the transaction price is fixed."
4. **Vendor standard missing where the trigger needs it.** The v2 trigger turns on "departs from the vendor's standard terms." F2 and F3 contexts state the standard, but rr-f1-h03 (expiry) and rr-f2-h01 (acceptance/warranty) don't state the relevant one.
   - **Candidate lesson:** every case whose trigger depends on a non-price term states the vendor's standard for that term.
5. **F3 `computed` strings for h01 and h03 are hand-typed.** The project rules say arithmetic stays in code, and the session notes say "amounts are computed in code".
   - Both measure only one direction, against v2's "either direction" and h04's own convention.
   - Gap conventions also differ across cases: h04 measures to the start of the last month, h05 from the end of the first.
   - **Fix:** pick one convention and compute every F3 gap in code.
6. **`status` is "draft" on every row, including the 17 approved dev cases.** Approvals live in `rev-rec/data/reviews.jsonl`. The freeze, scoring, and "only approved cases count" logic must read `reviews.jsonl`, not `status`. Alternatively, set `status` on approval.
7. **Review independence** (section 2). Author spot-check priority: rr-f4-h03, rr-f1-h04, rr-f1-h03, rr-f3-h05, rr-f2-h01.
