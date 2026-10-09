# Results: rev-rec-heldout-v2-prose-2026-10-03T234104845Z

Model jev-1.13.0 · question set v2 · state prose · 20 cases × 3 repeats = 60 calls · 59,127 input tokens · $0.0025

Held-out freeze: `0e20378cb97f26b950d557a18771673facf6863af56dbf78ee036a3a464d24c3`.

**Labels: 20 of 20 cases approved by the author.**

## Noul questions

Accuracy uses a 0.5 threshold. The prior baseline always predicts the share of positives for that question. Lower Brier is better.

| Question | Positives | Accuracy | Brier | Prior Brier |
|---|---|---|---|---|
| trigger | 11 of 20 | 93% | 0.071 | 0.248 |
| material_right | 2 of 20 | 95% | 0.048 | 0.090 |
| variable_consideration | 4 of 20 | 90% | 0.069 | 0.160 |
| refund_return | 2 of 20 | 100% | 0.008 | 0.090 |
| financing_component | 3 of 20 | 85% | 0.111 | 0.128 |
| contract_modification | 3 of 20 | 93% | 0.083 | 0.128 |
| termination_convenience | 0 of 20 | 100% | 0.027 | 0.000 |
| material_right_concept | 2 of 20 | 75% | 0.170 | 0.090 |
| variable_consideration_concept | 4 of 20 | 90% | 0.106 | 0.160 |
| refund_return_concept | 2 of 20 | 100% | 0.027 | 0.090 |
| financing_component_concept | 3 of 20 | 85% | 0.140 | 0.128 |
| contract_modification_concept | 3 of 20 | 85% | 0.120 | 0.128 |
| termination_convenience_concept | 0 of 20 | 100% | 0.002 | 0.000 |

## Trigger by family and difficulty

| Slice | Cases | Accuracy | Brier |
|---|---|---|---|
| F1 | 5 | 87% | 0.110 |
| F2 | 5 | 100% | 0.047 |
| F3 | 5 | 87% | 0.100 |
| F4 | 5 | 100% | 0.029 |
| easy | 7 | 100% | 0.069 |
| hard | 13 | 90% | 0.073 |

## Pre-registered held-out slices

Accuracy over every call and question in the slice. Slices were fixed when held-out was frozen.

| Slice | Cases | Trigger | Considerations (rule) | Considerations (concept) |
|---|---|---|---|---|
| unnamed_by_v2 | 8 | 83% | 95% | 94% |
| named_by_v2 | 2 | 100% | 92% | 92% |

## Reliability (all Noul predictions)

| Predicted | Count | Mean predicted | Observed yes |
|---|---|---|---|
| 0.0–0.1 | 255 | 0.05 | 0% |
| 0.1–0.3 | 280 | 0.18 | 3% |
| 0.3–0.5 | 93 | 0.39 | 8% |
| 0.5–0.7 | 60 | 0.59 | 48% |
| 0.7–0.9 | 64 | 0.80 | 70% |
| 0.9–1.0 | 28 | 0.93 | 100% |

## Per case

Mean probability over repeats. ✗ marks a wrong side of 0.5 (gold in brackets). ~ marks repeats that disagreed.

| Case | Diff | Trigger | Considerations Jev flagged | Gold considerations | Primary (gold) |
|---|---|---|---|---|---|
| rr-f1-h01 | easy | 0.57 | material_right 0.94 | material_right | — |
| rr-f1-h02 | hard | 0.50 ~ | — | none | — |
| rr-f1-h03 | hard | 0.09 | — | none | — |
| rr-f1-h04 | hard | 0.25 | — | none | — |
| rr-f1-h05 | hard | 0.78 | material_right 0.94<br>variable_consideration 0.68 ✗[0] | material_right | — |
| rr-f2-h01 | easy | 0.90 | variable_consideration 0.91<br>refund_return 0.95 | refund_return, variable_consideration | — |
| rr-f2-h02 | hard | 0.35 | — | none | — |
| rr-f2-h03 | hard | 0.18 | variable_consideration 0.94 | variable_consideration | — |
| rr-f2-h04 | easy | 0.82 | variable_consideration 0.59<br>refund_return 0.68 | variable_consideration, refund_return | — |
| rr-f2-h05 | hard | 0.81 | variable_consideration 0.96 | variable_consideration | — |
| rr-f3-h01 | easy | 0.16 | — | none | — |
| rr-f3-h02 | easy | 0.61 | financing_component 0.25 ✗[1] | financing_component | — |
| rr-f3-h03 | hard | 0.13 | — | none | — |
| rr-f3-h04 | easy | 0.78 | financing_component 0.41 ✗[1] | financing_component | — |
| rr-f3-h05 | hard | 0.49 ✗[1] ~ | financing_component 0.28 ✗[1] | financing_component | — |
| rr-f4-h01 | easy | 0.83 | contract_modification 0.94 | contract_modification | — |
| rr-f4-h02 | hard | 0.09 | — | none | — |
| rr-f4-h03 | hard | 0.16 | contract_modification 0.88 ✗[0] | none | — |
| rr-f4-h04 | hard | 0.83 | variable_consideration 0.59 ✗[0]<br>contract_modification 0.94 | contract_modification | — |
| rr-f4-h05 | hard | 0.77 | material_right 0.70 ✗[0]<br>contract_modification 0.65 | contract_modification | — |

## Wrong answers

- rr-f1-h01 · variable_consideration_concept: Jev 0.57 vs gold 0
- rr-f1-h02 · material_right_concept: Jev 0.51 vs gold 0
- rr-f1-h05 · variable_consideration: Jev 0.68 vs gold 0
- rr-f1-h05 · variable_consideration_concept: Jev 0.78 vs gold 0
- rr-f2-h01 · material_right_concept: Jev 0.68 vs gold 0
- rr-f2-h01 · contract_modification_concept: Jev 0.64 vs gold 0
- rr-f3-h01 · financing_component_concept: Jev 0.69 vs gold 0
- rr-f3-h02 · financing_component: Jev 0.25 vs gold 1
- rr-f3-h03 · financing_component_concept: Jev 0.53 vs gold 0
- rr-f3-h04 · financing_component: Jev 0.41 vs gold 1
- rr-f3-h05 · trigger: Jev 0.49 vs gold 1
- rr-f3-h05 · financing_component: Jev 0.28 vs gold 1
- rr-f4-h01 · material_right_concept: Jev 0.52 vs gold 0
- rr-f4-h01 · financing_component_concept: Jev 0.58 vs gold 0
- rr-f4-h03 · contract_modification: Jev 0.88 vs gold 0
- rr-f4-h03 · contract_modification_concept: Jev 0.76 vs gold 0
- rr-f4-h04 · variable_consideration: Jev 0.59 vs gold 0
- rr-f4-h04 · material_right_concept: Jev 0.72 vs gold 0
- rr-f4-h05 · material_right: Jev 0.70 vs gold 0
- rr-f4-h05 · material_right_concept: Jev 0.70 vs gold 0
- rr-f4-h05 · contract_modification_concept: Jev 0.23 vs gold 1
