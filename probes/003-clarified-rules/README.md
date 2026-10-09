# 003: Do clarified rule questions fix the two "structure" misses?

Run: [`runs/003-clarified-rules-2026-10-09T193427044Z.jsonl`](runs/003-clarified-rules-2026-10-09T193427044Z.jsonl).
Script: [`run.ts`](run.ts) (`bun probes/003-clarified-rules/run.ts`).

## Asked

Two frozen held-out clauses that the results page's section 5 showed as Jev's own reading errors,
each asked the v2 rule question and a clarified version in the same request, in all three state
shapes, 3 repeats (18 calls, `jev-1.13.0`, $0.0005).

- rr-f4-h05 (a committed purchase of tokens below SSP), `material_right`. Clarified wording adds
  "A purchase the customer has already committed to is not an option" and says "below the low end
  of the … range".
- rr-f4-h04 (a fixed price cut plus a fixed credit), `variable_consideration`. Clarified wording
  adds "A fixed amount, or a fixed unit price on purchases the customer chooses to make, is not
  variable."

The clarified wording is the one drafted for the training examples (`rev-rec/scripts/build-training.ts`).

## Result (mean of 3, correct answer is no for both)

| Question | Shape | v2 | Clarified |
|---|---|---|---|
| material_right | prose | 0.70 | 0.53 |
| material_right | structured | 0.83 | 0.53 |
| material_right | computed | 0.89 | 0.58 |
| variable_consideration | prose | 0.57 | 0.12 |
| variable_consideration | structured | 0.64 | 0.16 |
| variable_consideration | computed | 0.60 | 0.19 |

## Reading

- The clarified rule fixes the variable-consideration miss in every shape. Its added sentence ("A
  fixed amount … is not variable") states the distinction the question tests, so it comes close to
  giving Jev the answer. I read it as a structure miss: a model that understands variable
  consideration should see from the clause that both amounts are fixed.
- The clarified rule moves the material-right miss from fairly confident (0.70–0.89) to near a coin
  flip (0.53–0.58), still on the wrong side. Telling a committed purchase from an option remains a
  structure miss.
- Diagnostic only, on two held-out clauses. It is not a held-out score. I wrote the clarified
  wording after seeing held-out errors, so scoring it needs fresh clauses.
