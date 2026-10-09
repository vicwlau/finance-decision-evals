# 002: Refund question as a Noul and as a yes/no Choice

Run: [`runs/002-refund-noul-vs-choice-2026-10-02T203441382Z.jsonl`](runs/002-refund-noul-vs-choice-2026-10-02T203441382Z.jsonl).
Script: [`run.ts`](run.ts) (`bun probes/002-refund-noul-vs-choice/run.ts`).

## Asked

The examples from TypeSafe's jev-1.13 jaggedness page, 5 repeats each, with the conditions
interleaved within each repeat:

- `noul_alone`: "Is the customer asking for a refund?" on *"I'm not happy with the fit. What are
  my options here?"*, as a Noul.
- `choice_alone`: the same question as a Choice with options `yes` and `no` (no descriptions).
- `batched`: both questions in one request.
- `negation_pair`: on *"I was charged twice for the same order. Can someone look into this?"*,
  the refund Noul and its negation ("…asking for something other than a refund?") in one
  request.

## Expected

- The docs' numbers: Noul 0.22; Choice P(yes) 0.01 with confidence 0.97; negation pair 0.72 and
  0.47, summing to 1.19.
- Small noise between identical requests.
- A third-party run on the `LocalLLaMA/typed-decisions` benchmark (Hugging Face) saw Jev's yes/no
  accuracy (agreement with the benchmark's model-generated labels) fall from 0.843 to 0.788 when
  questions were batched. Here, a check on whether batching moves these answers.

## Saw

| Condition | Question | Mean | SD | Range |
|---|---|---|---|---|
| noul_alone | refund (Noul) | 0.220 | 0.006 | 0.21–0.23 |
| choice_alone | refund (Choice, P(yes)) | 0.012 | 0.004 | 0.01–0.02 |
| batched | refund (Noul) | 0.222 | 0.008 | 0.21–0.23 |
| batched | refund (Choice, P(yes)) | 0.010 | 0.000 | 0.01–0.01 |
| negation_pair | refund | 0.708 | 0.017 | 0.68–0.73 |
| negation_pair | not refund | 0.440 | 0.016 | 0.43–0.47 |

- Choice confidence 0.97–0.98 on every run.
- Negation sums: 1.15, 1.18, 1.16, 1.12, 1.13.
- All 20 calls returned HTTP 200 from `jev-1.13.0`. 6,090 input tokens, $0.00026 in total. Median
  latency 0.085 s.

## Learned

- **The docs' numbers reproduce on `jev-1.13.0`.** The Noul and Choice disagree by a factor of
  about 20 on the same judgment (0.22 vs 0.01). A threshold tuned on one shape cannot carry over
  to the other.
- **A question and its negation don't sum to 1.** The sum was 1.12 to 1.18, every time. Code
  must not compute "no" as 1 − "yes" from a separately asked question.
- **Identical requests vary.** Standard deviation 0.004 to 0.017. The largest spread (0.68 to
  0.73) was on the most ambiguous ticket. A threshold near a case's value can flip between runs,
  so evals should repeat borderline cases.
- **Batching did not move these answers** (0.222 vs 0.220; 0.010 vs 0.012). This is one ticket
  with two questions, so it does not test the third-party finding, which used 2,000 decisions
  batched five at a time. That needs its own probe on my real cases.

## Verdict

Pass. The docs reproduce, and the noise floor is now measured.
