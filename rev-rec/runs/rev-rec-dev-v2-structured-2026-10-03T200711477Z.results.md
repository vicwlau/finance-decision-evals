# Results: rev-rec-dev-v2-structured-2026-10-03T200711477Z

Model jev-1.13.0 · question set v2 · state structured · 17 cases × 3 repeats = 51 calls · 50,970 input tokens · $0.0021

**Labels: 17 of 17 cases approved by the author.**

## Noul questions

Accuracy uses a 0.5 threshold. The prior baseline always predicts the share of positives for that question. Lower Brier is better.

| Question | Positives | Accuracy | Brier | Prior Brier |
|---|---|---|---|---|
| trigger | 10 of 17 | 88% | 0.116 | 0.242 |
| material_right | 3 of 17 | 94% | 0.039 | 0.145 |
| variable_consideration | 4 of 17 | 98% | 0.051 | 0.180 |
| refund_return | 3 of 17 | 100% | 0.003 | 0.145 |
| financing_component | 2 of 17 | 94% | 0.083 | 0.104 |
| contract_modification | 3 of 17 | 100% | 0.050 | 0.145 |
| termination_convenience | 1 of 17 | 100% | 0.029 | 0.055 |
| material_right_concept | 3 of 17 | 75% | 0.173 | 0.145 |
| variable_consideration_concept | 4 of 17 | 71% | 0.160 | 0.180 |
| refund_return_concept | 3 of 17 | 100% | 0.016 | 0.145 |
| financing_component_concept | 2 of 17 | 71% | 0.192 | 0.104 |
| contract_modification_concept | 3 of 17 | 100% | 0.065 | 0.145 |
| termination_convenience_concept | 1 of 17 | 100% | 0.003 | 0.055 |

## Trigger by family and difficulty

| Slice | Cases | Accuracy | Brier |
|---|---|---|---|
| F1 | 5 | 80% | 0.186 |
| F2 | 4 | 100% | 0.020 |
| F3 | 4 | 100% | 0.077 |
| F4 | 4 | 75% | 0.165 |
| easy | 6 | 100% | 0.070 |
| hard | 11 | 82% | 0.142 |

## Reliability (all Noul predictions)

| Predicted | Count | Mean predicted | Observed yes |
|---|---|---|---|
| 0.0–0.1 | 177 | 0.05 | 0% |
| 0.1–0.3 | 229 | 0.19 | 0% |
| 0.3–0.5 | 103 | 0.40 | 13% |
| 0.5–0.7 | 50 | 0.57 | 34% |
| 0.7–0.9 | 78 | 0.82 | 88% |
| 0.9–1.0 | 26 | 0.94 | 100% |

## Per case

Mean probability over repeats. ✗ marks a wrong side of 0.5 (gold in brackets). ~ marks repeats that disagreed.

| Case | Diff | Trigger | Considerations Jev flagged | Gold considerations | Primary (gold) |
|---|---|---|---|---|---|
| rr-f1-01 | easy | 0.52 | material_right 0.93 | material_right | — |
| rr-f1-02 | easy | 0.33 | — | none | — |
| rr-f1-03 | hard | 0.25 | material_right 0.51 ✗[0] ~ | none | — |
| rr-f1-04 | hard | 0.40 ✗[1] | material_right 0.86 | material_right | — |
| rr-f1-05 | hard | 0.60 | material_right 0.82 | material_right | — |
| rr-f2-01 | easy | 0.88 | variable_consideration 0.87<br>refund_return 0.95<br>termination_convenience 0.73 | refund_return, termination_convenience, variable_consideration | — |
| rr-f2-02 | easy | 0.86 | variable_consideration 0.96<br>refund_return 0.94 | variable_consideration, refund_return | — |
| rr-f2-03 | hard | 0.19 | variable_consideration 0.91 | variable_consideration | — |
| rr-f2-04 | hard | 0.90 | variable_consideration 0.96<br>refund_return 0.84 | variable_consideration, refund_return | — |
| rr-f3-01 | hard | 0.14 | — | none | — |
| rr-f3-02 | hard | 0.33 | — | none | — |
| rr-f3-03 | easy | 0.85 | financing_component 0.84 | financing_component | — |
| rr-f3-04 | hard | 0.60 | financing_component 0.31 ✗[1] | financing_component | — |
| rr-f4-01 | easy | 0.84 | contract_modification 0.87 | contract_modification | — |
| rr-f4-02 | hard | 0.62 ✗[0] | — | none | — |
| rr-f4-03 | hard | 0.47 | contract_modification 0.96 | contract_modification | — |
| rr-f4-04 | hard | 0.84 | contract_modification 0.71 | contract_modification | — |

## Wrong answers

- rr-f1-01 · variable_consideration_concept: Jev 0.59 vs gold 0
- rr-f1-02 · variable_consideration_concept: Jev 0.60 vs gold 0
- rr-f1-03 · material_right: Jev 0.51 vs gold 0
- rr-f1-03 · variable_consideration_concept: Jev 0.79 vs gold 0
- rr-f1-04 · trigger: Jev 0.40 vs gold 1
- rr-f1-04 · material_right_concept: Jev 0.50 vs gold 1
- rr-f1-04 · variable_consideration_concept: Jev 0.79 vs gold 0
- rr-f1-05 · material_right_concept: Jev 0.45 vs gold 1
- rr-f2-01 · material_right_concept: Jev 0.57 vs gold 0
- rr-f2-01 · variable_consideration_concept: Jev 0.47 vs gold 1
- rr-f2-04 · material_right_concept: Jev 0.60 vs gold 0
- rr-f3-01 · financing_component_concept: Jev 0.62 vs gold 0
- rr-f3-02 · financing_component_concept: Jev 0.73 vs gold 0
- rr-f3-04 · financing_component: Jev 0.31 vs gold 1
- rr-f4-01 · financing_component_concept: Jev 0.58 vs gold 0
- rr-f4-02 · trigger: Jev 0.62 vs gold 0
- rr-f4-02 · financing_component_concept: Jev 0.59 vs gold 0
- rr-f4-04 · financing_component_concept: Jev 0.51 vs gold 0
