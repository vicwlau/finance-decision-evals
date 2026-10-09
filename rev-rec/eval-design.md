# How I test Jev (eval design)

What rev-rec measures, and how to read the results. The labels are defined in
[`README.md`](README.md#what-the-labels-mean).

## Goal

Can Jev do deal-desk triage on non-standard contract clauses? When it fails, is the failure in
**reading**, in **knowledge**, or in **applying a rule**?

## Terms

| Term | Meaning |
|---|---|
| Case | One clause plus the deal context an analyst would have, with my labels |
| Trigger | Label and question: does this deal need a revenue accounting review? Deal scope. |
| Considerations | Labels and questions: which of the six ASC 606 concepts apply? Substance. |
| State shape | Axis 1: how the case is packaged for Jev |
| Question framing | Axis 2: how each consideration question is asked |
| Cell | One state shape × one question framing |
| Run | Every case sent to Jev in one state shape, 3 repeats, with both framings in the same request |

## Axis 1: state shape (reading vs judgment)

Scale: Jev does more → code does more

| Level | What Jev gets | What Jev must do |
|---|---|---|
| Prose | The clause, and the deal context as a paragraph | Find the facts, compare the numbers, judge |
| Structured | The clause, and the deal context as named fields | Read the clause and judge; the context is tidy |
| Computed | Structured, plus comparisons done in code ("50% below the low end of the SSP range") | Judge only; the reading is done for it |

## Axis 2: question framing (knowledge vs application)

Scale: relies on knowledge → relies on the stated rule

| Level | Example | Relies on |
|---|---|---|
| Concept | "Is this clause a contract modification under ASC 606?" | Jev knowing the accounting |
| Rule | "Does the clause change the scope or price of an existing contract with this customer …? An option to buy more later is not a change …" | Jev applying a stated condition |

The trigger is always rule-framed: it's a process question, not an accounting concept.

How runs record framing: a question set lists its considerations. From v2 on, the concept
version of each is asked under `<id>_concept`, declared in the set's `framings` field. The
consideration questions in v0 and v1 spell out their conditions, so they count as rule framing.

## The grid

| Framing | Prose | Structured | Computed |
|---|---|---|---|
| Concept | Knowledge, end to end | Knowledge, clean context | Knowledge alone |
| Rule | Headline: how a TypeSafe customer would use Jev on real contracts | Rule application, clean context | Rule application alone |

- **Headline number:** prose × rule.
- **Diagnosis:** the full grid, on dev and once on held-out.

## Reading the results

| Failure | Pattern | Means | Training data should |
|---|---|---|---|
| Reading | Fails in prose, fine in computed | A reading or number problem | Teach reading clauses that contain numbers |
| Knowledge | Fails on concept, fine on rule | Missing ASC 606 knowledge | Teach the concepts |
| Application | Fails on rule, even with the computed state | A rule-application or judgment problem | Teach minimal pairs and look-alikes |

## Guardrails

- Rule questions that name look-alikes seen on dev improve dev scores almost by construction.
  Held-out look-alikes must include kinds no question names.
- `computed` holds neutral comparisons, never conclusions, and is built only from business facts
  (prices, ranges, dates, durations), never from label-like facts.
- TypeSafe's docs say questions in one request are answered independently, so changing one
  question's wording shouldn't move the others' answers. I assume this rather than measure it:
  probe 002 saw no change on one small check, and a third-party benchmark saw batching lower
  accuracy.
