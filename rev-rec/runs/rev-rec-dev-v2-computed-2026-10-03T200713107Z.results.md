# Results: rev-rec-dev-v2-computed-2026-10-03T200713107Z

Model jev-1.13.0 · question set v2 · state computed · 17 cases × 3 repeats = 51 calls · 52,866 input tokens · $0.0022

**Labels: 17 of 17 cases approved by the author.**

## Noul questions

Accuracy uses a 0.5 threshold. The prior baseline always predicts the share of positives for that question. Lower Brier is better.

| Question | Positives | Accuracy | Brier | Prior Brier |
|---|---|---|---|---|
| trigger | 10 of 17 | 92% | 0.075 | 0.242 |
| material_right | 3 of 17 | 96% | 0.032 | 0.145 |
| variable_consideration | 4 of 17 | 100% | 0.034 | 0.180 |
| refund_return | 3 of 17 | 100% | 0.003 | 0.145 |
| financing_component | 2 of 17 | 96% | 0.056 | 0.104 |
| contract_modification | 3 of 17 | 100% | 0.044 | 0.145 |
| termination_convenience | 1 of 17 | 100% | 0.031 | 0.055 |
| material_right_concept | 3 of 17 | 82% | 0.140 | 0.145 |
| variable_consideration_concept | 4 of 17 | 71% | 0.152 | 0.180 |
| refund_return_concept | 3 of 17 | 100% | 0.015 | 0.145 |
| financing_component_concept | 2 of 17 | 71% | 0.183 | 0.104 |
| contract_modification_concept | 3 of 17 | 88% | 0.068 | 0.145 |
| termination_convenience_concept | 1 of 17 | 100% | 0.003 | 0.055 |

## Trigger by family and difficulty

| Slice | Cases | Accuracy | Brier |
|---|---|---|---|
| F1 | 5 | 93% | 0.088 |
| F2 | 4 | 100% | 0.015 |
| F3 | 4 | 100% | 0.065 |
| F4 | 4 | 75% | 0.129 |
| easy | 6 | 100% | 0.038 |
| hard | 11 | 88% | 0.096 |

## Reliability (all Noul predictions)

| Predicted | Count | Mean predicted | Observed yes |
|---|---|---|---|
| 0.0–0.1 | 193 | 0.05 | 0% |
| 0.1–0.3 | 228 | 0.18 | 0% |
| 0.3–0.5 | 77 | 0.38 | 9% |
| 0.5–0.7 | 54 | 0.58 | 26% |
| 0.7–0.9 | 77 | 0.82 | 92% |
| 0.9–1.0 | 34 | 0.94 | 100% |

## Per case

Mean probability over repeats. ✗ marks a wrong side of 0.5 (gold in brackets). ~ marks repeats that disagreed.

| Case | Diff | Trigger | Considerations Jev flagged | Gold considerations | Primary (gold) |
|---|---|---|---|---|---|
| rr-f1-01 | easy | 0.74 | material_right 0.97 | material_right | — |
| rr-f1-02 | easy | 0.27 | material_right 0.53 ✗[0] ~ | none | — |
| rr-f1-03 | hard | 0.19 | — | none | — |
| rr-f1-04 | hard | 0.49 ✗[1] ~ | material_right 0.92 | material_right | — |
| rr-f1-05 | hard | 0.89 | material_right 0.90 | material_right | — |
| rr-f2-01 | easy | 0.87 | variable_consideration 0.87<br>refund_return 0.95<br>termination_convenience 0.74 | refund_return, termination_convenience, variable_consideration | — |
| rr-f2-02 | easy | 0.89 | variable_consideration 0.95<br>refund_return 0.97 | variable_consideration, refund_return | — |
| rr-f2-03 | hard | 0.14 | variable_consideration 0.91 | variable_consideration | — |
| rr-f2-04 | hard | 0.90 | variable_consideration 0.97<br>refund_return 0.87 | variable_consideration, refund_return | — |
| rr-f3-01 | hard | 0.12 | — | none | — |
| rr-f3-02 | hard | 0.27 | — | none | — |
| rr-f3-03 | easy | 0.84 | financing_component 0.88 | financing_component | — |
| rr-f3-04 | hard | 0.61 | financing_component 0.62 | financing_component | — |
| rr-f4-01 | easy | 0.82 | contract_modification 0.89 | contract_modification | — |
| rr-f4-02 | hard | 0.56 ✗[0] | — | none | — |
| rr-f4-03 | hard | 0.38 | contract_modification 0.96 | contract_modification | — |
| rr-f4-04 | hard | 0.83 | contract_modification 0.70 | contract_modification | — |

## Wrong answers

- rr-f1-01 · variable_consideration_concept: Jev 0.59 vs gold 0
- rr-f1-02 · material_right: Jev 0.53 vs gold 0
- rr-f1-02 · variable_consideration_concept: Jev 0.55 vs gold 0
- rr-f1-03 · variable_consideration_concept: Jev 0.73 vs gold 0
- rr-f1-04 · trigger: Jev 0.49 vs gold 1
- rr-f1-04 · variable_consideration_concept: Jev 0.82 vs gold 0
- rr-f2-01 · material_right_concept: Jev 0.58 vs gold 0
- rr-f2-01 · variable_consideration_concept: Jev 0.47 vs gold 1
- rr-f2-02 · material_right_concept: Jev 0.54 vs gold 0
- rr-f2-04 · material_right_concept: Jev 0.59 vs gold 0
- rr-f3-01 · financing_component_concept: Jev 0.67 vs gold 0
- rr-f3-02 · financing_component_concept: Jev 0.64 vs gold 0
- rr-f4-01 · financing_component_concept: Jev 0.59 vs gold 0
- rr-f4-02 · trigger: Jev 0.56 vs gold 0
- rr-f4-02 · financing_component_concept: Jev 0.56 vs gold 0
- rr-f4-02 · contract_modification_concept: Jev 0.54 vs gold 0
- rr-f4-04 · financing_component_concept: Jev 0.55 vs gold 0
- rr-f4-04 · contract_modification_concept: Jev 0.46 vs gold 1
