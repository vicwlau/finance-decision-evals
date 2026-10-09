# Results: rev-rec-heldout-v2-computed-2026-10-03T234104845Z

Model jev-1.13.0 · question set v2 · state computed · 20 cases × 3 repeats = 60 calls · 62,100 input tokens · $0.0026

Held-out freeze: `0e20378cb97f26b950d557a18771673facf6863af56dbf78ee036a3a464d24c3`.

**Labels: 20 of 20 cases approved by the author.**

## Noul questions

Accuracy uses a 0.5 threshold. The prior baseline always predicts the share of positives for that question. Lower Brier is better.

| Question | Positives | Accuracy | Brier | Prior Brier |
|---|---|---|---|---|
| trigger | 11 of 20 | 100% | 0.043 | 0.248 |
| material_right | 2 of 20 | 85% | 0.091 | 0.090 |
| variable_consideration | 4 of 20 | 90% | 0.057 | 0.160 |
| refund_return | 2 of 20 | 100% | 0.009 | 0.090 |
| financing_component | 3 of 20 | 100% | 0.048 | 0.128 |
| contract_modification | 3 of 20 | 90% | 0.084 | 0.128 |
| termination_convenience | 0 of 20 | 100% | 0.030 | 0.000 |
| material_right_concept | 2 of 20 | 70% | 0.174 | 0.090 |
| variable_consideration_concept | 4 of 20 | 87% | 0.116 | 0.160 |
| refund_return_concept | 2 of 20 | 100% | 0.027 | 0.090 |
| financing_component_concept | 3 of 20 | 82% | 0.156 | 0.128 |
| contract_modification_concept | 3 of 20 | 85% | 0.103 | 0.128 |
| termination_convenience_concept | 0 of 20 | 100% | 0.002 | 0.000 |

## Trigger by family and difficulty

| Slice | Cases | Accuracy | Brier |
|---|---|---|---|
| F1 | 5 | 100% | 0.059 |
| F2 | 5 | 100% | 0.034 |
| F3 | 5 | 100% | 0.061 |
| F4 | 5 | 100% | 0.017 |
| easy | 7 | 100% | 0.051 |
| hard | 13 | 100% | 0.038 |

## Pre-registered held-out slices

Accuracy over every call and question in the slice. Slices were fixed when held-out was frozen.

| Slice | Cases | Trigger | Considerations (rule) | Considerations (concept) |
|---|---|---|---|---|
| unnamed_by_v2 | 8 | 100% | 94% | 92% |
| named_by_v2 | 2 | 100% | 92% | 92% |

## Reliability (all Noul predictions)

| Predicted | Count | Mean predicted | Observed yes |
|---|---|---|---|
| 0.0–0.1 | 258 | 0.05 | 0% |
| 0.1–0.3 | 278 | 0.18 | 0% |
| 0.3–0.5 | 70 | 0.40 | 7% |
| 0.5–0.7 | 69 | 0.60 | 39% |
| 0.7–0.9 | 75 | 0.80 | 77% |
| 0.9–1.0 | 30 | 0.94 | 90% |

## Per case

Mean probability over repeats. ✗ marks a wrong side of 0.5 (gold in brackets). ~ marks repeats that disagreed.

| Case | Diff | Trigger | Considerations Jev flagged | Gold considerations | Primary (gold) |
|---|---|---|---|---|---|
| rr-f1-h01 | easy | 0.65 | material_right 0.97 | material_right | — |
| rr-f1-h02 | hard | 0.22 | — | none | — |
| rr-f1-h03 | hard | 0.10 | — | none | — |
| rr-f1-h04 | hard | 0.27 | material_right 0.66 ✗[0] | none | — |
| rr-f1-h05 | hard | 0.79 | material_right 0.95<br>variable_consideration 0.62 ✗[0] | material_right | — |
| rr-f2-h01 | easy | 0.90 | variable_consideration 0.89<br>refund_return 0.96 | refund_return, variable_consideration | — |
| rr-f2-h02 | hard | 0.24 | — | none | — |
| rr-f2-h03 | hard | 0.21 | variable_consideration 0.95 | variable_consideration | — |
| rr-f2-h04 | easy | 0.84 | variable_consideration 0.66<br>refund_return 0.64 | variable_consideration, refund_return | — |
| rr-f2-h05 | hard | 0.81 | variable_consideration 0.96<br>contract_modification 0.56 ✗[0] | variable_consideration | — |
| rr-f3-h01 | easy | 0.14 | — | none | — |
| rr-f3-h02 | easy | 0.71 | financing_component 0.72 | financing_component | — |
| rr-f3-h03 | hard | 0.13 | — | none | — |
| rr-f3-h04 | easy | 0.74 | financing_component 0.75 | financing_component | — |
| rr-f3-h05 | hard | 0.67 | financing_component 0.56 | financing_component | — |
| rr-f4-h01 | easy | 0.84 | contract_modification 0.96 | contract_modification | — |
| rr-f4-h02 | hard | 0.10 | — | none | — |
| rr-f4-h03 | hard | 0.12 | contract_modification 0.91 ✗[0] | none | — |
| rr-f4-h04 | hard | 0.86 | material_right 0.58 ✗[0]<br>variable_consideration 0.62 ✗[0]<br>contract_modification 0.93 | contract_modification | — |
| rr-f4-h05 | hard | 0.86 | material_right 0.88 ✗[0]<br>contract_modification 0.72 | contract_modification | — |

## Wrong answers

- rr-f1-h01 · variable_consideration_concept: Jev 0.64 vs gold 0
- rr-f1-h02 · material_right_concept: Jev 0.55 vs gold 0
- rr-f1-h03 · financing_component_concept: Jev 0.50 vs gold 0
- rr-f1-h04 · material_right: Jev 0.66 vs gold 0
- rr-f1-h04 · material_right_concept: Jev 0.58 vs gold 0
- rr-f1-h05 · variable_consideration: Jev 0.62 vs gold 0
- rr-f1-h05 · variable_consideration_concept: Jev 0.80 vs gold 0
- rr-f2-h01 · material_right_concept: Jev 0.71 vs gold 0
- rr-f2-h01 · variable_consideration_concept: Jev 0.50 vs gold 1
- rr-f2-h01 · contract_modification_concept: Jev 0.56 vs gold 0
- rr-f2-h04 · material_right_concept: Jev 0.55 vs gold 0
- rr-f2-h05 · contract_modification: Jev 0.56 vs gold 0
- rr-f3-h01 · financing_component_concept: Jev 0.74 vs gold 0
- rr-f3-h03 · financing_component_concept: Jev 0.53 vs gold 0
- rr-f4-h01 · financing_component_concept: Jev 0.59 vs gold 0
- rr-f4-h03 · contract_modification: Jev 0.91 vs gold 0
- rr-f4-h03 · contract_modification_concept: Jev 0.73 vs gold 0
- rr-f4-h04 · material_right: Jev 0.58 vs gold 0
- rr-f4-h04 · variable_consideration: Jev 0.62 vs gold 0
- rr-f4-h04 · material_right_concept: Jev 0.67 vs gold 0
- rr-f4-h05 · material_right: Jev 0.88 vs gold 0
- rr-f4-h05 · material_right_concept: Jev 0.77 vs gold 0
- rr-f4-h05 · contract_modification_concept: Jev 0.33 vs gold 1
