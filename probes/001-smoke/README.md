# 001: Smoke test

Run: [`runs/001-smoke-2026-10-02T192410Z.jsonl`](runs/001-smoke-2026-10-02T192410Z.jsonl). Request: [`request.json`](request.json).

## Asked

One tiny synthetic renewal clause, with three questions:

- one `noul`: does the clause give a renewal option?
- one `choice`: which topic does the clause mainly address?
- one `score`: how precisely does the clause state the renewal price? (three levels)

## Expected

- The API key authenticates.
- The response echoes the pinned version, `jev-1.13.0`.
- The response shape matches TypeSafe's docs.

## Saw

- HTTP 200 in 0.145 s.
- Model `jev-1.13.0`.
- `noul`: 0.98.
- `choice`: `renewal` at 1.0.
- `score`: 1.75, with probabilities 0.02 / 0.21 / 0.77 for levels 0 / 1 / 2.
- 473 input tokens, about $0.00002.
- The `x-typesafe-request-id` header is present.

## Learned

The score split comes from my level wording, not from the model.
The clause prices the renewal at "a 30% discount to the then-current list price".
That is a fixed formula, but the dollar amount is not in the clause.
My levels did not cover that case, so the model spread its probability between levels 1 and 2.
Writing score levels needs domain judgment.

## Verdict

Pass.
