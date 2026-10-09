# Results: rev-rec-dev-v2-computed-2026-10-03T013825959Z

Model jev-1.13.0 · question set v2 · state computed · 17 cases × 3 repeats = 51 calls · 52,371 input tokens · $0.0022

**Labels: 17 of 17 cases approved by the author.**

## Noul questions

Accuracy uses a 0.5 threshold. The prior baseline always predicts the share of positives for that question. Lower Brier is better.

| Question | Positives | Accuracy | Brier | Prior Brier |
|---|---|---|---|---|
| trigger | 10 of 17 | 94% | 0.079 | 0.242 |
| material_right | 3 of 17 | 96% | 0.029 | 0.145 |
| variable_consideration | 4 of 17 | 100% | 0.034 | 0.180 |
| refund_return | 3 of 17 | 100% | 0.003 | 0.145 |
| financing_component | 2 of 17 | 100% | 0.051 | 0.104 |
| contract_modification | 3 of 17 | 100% | 0.044 | 0.145 |
| termination_convenience | 1 of 17 | 100% | 0.032 | 0.055 |
| material_right_concept | 3 of 17 | 76% | 0.156 | 0.145 |
| variable_consideration_concept | 4 of 17 | 73% | 0.153 | 0.180 |
| refund_return_concept | 3 of 17 | 100% | 0.014 | 0.145 |
| financing_component_concept | 2 of 17 | 71% | 0.178 | 0.104 |
| contract_modification_concept | 3 of 17 | 88% | 0.065 | 0.145 |
| termination_convenience_concept | 1 of 17 | 100% | 0.003 | 0.055 |

## Trigger by family and difficulty

| Slice | Cases | Accuracy | Brier |
|---|---|---|---|
| F1 | 5 | 100% | 0.082 |
| F2 | 4 | 100% | 0.014 |
| F3 | 4 | 100% | 0.091 |
| F4 | 4 | 75% | 0.128 |
| easy | 6 | 100% | 0.043 |
| hard | 11 | 91% | 0.099 |

## Reliability (all Noul predictions)

| Predicted | Count | Mean predicted | Observed yes |
|---|---|---|---|
| 0.0–0.1 | 191 | 0.05 | 0% |
| 0.1–0.3 | 225 | 0.18 | 0% |
| 0.3–0.5 | 79 | 0.38 | 6% |
| 0.5–0.7 | 57 | 0.58 | 28% |
| 0.7–0.9 | 76 | 0.82 | 92% |
| 0.9–1.0 | 35 | 0.94 | 100% |

## Per case

Mean probability over repeats. ✗ marks a wrong side of 0.5 (gold in brackets). ~ marks repeats that disagreed.

| Case | Diff | Trigger | Considerations Jev flagged | Gold considerations | Primary (gold) |
|---|---|---|---|---|---|
| rr-f1-02 | easy | 0.25 | — | none | — |
| rr-f1-01 | easy | 0.75 | material_right 0.97 | material_right | — |
| rr-f1-03 | hard | 0.19 | — | none | — |
| rr-f1-04 | hard | 0.52 | material_right 0.93 | material_right | — |
| rr-f1-05 | hard | 0.88 | material_right 0.91 | material_right | — |
| rr-f2-01 | easy | 0.88 | variable_consideration 0.87<br>refund_return 0.94<br>termination_convenience 0.72 | refund_return, termination_convenience, variable_consideration | — |
| rr-f2-02 | easy | 0.88 | variable_consideration 0.96<br>refund_return 0.96 | variable_consideration, refund_return | — |
| rr-f2-03 | hard | 0.14 | variable_consideration 0.91 | variable_consideration | — |
| rr-f2-04 | hard | 0.91 | variable_consideration 0.96<br>refund_return 0.86 | variable_consideration, refund_return | — |
| rr-f3-01 | hard | 0.30 | — | none | — |
| rr-f3-02 | hard | 0.23 | — | none | — |
| rr-f3-03 | easy | 0.73 | financing_component 0.86 | financing_component | — |
| rr-f3-04 | hard | 0.61 | financing_component 0.76 | financing_component | — |
| rr-f4-01 | easy | 0.82 | contract_modification 0.89 | contract_modification | — |
| rr-f4-02 | hard | 0.55 ✗[0] | — | none | — |
| rr-f4-03 | hard | 0.39 | contract_modification 0.96 | contract_modification | — |
| rr-f4-04 | hard | 0.83 | contract_modification 0.69 | contract_modification | — |

## Wrong answers

- rr-f1-02 · variable_consideration_concept: Jev 0.52 vs gold 0
- rr-f1-01 · variable_consideration_concept: Jev 0.61 vs gold 0
- rr-f1-03 · variable_consideration_concept: Jev 0.74 vs gold 0
- rr-f1-04 · variable_consideration_concept: Jev 0.82 vs gold 0
- rr-f2-01 · material_right_concept: Jev 0.59 vs gold 0
- rr-f2-01 · variable_consideration_concept: Jev 0.47 vs gold 1
- rr-f2-02 · material_right_concept: Jev 0.55 vs gold 0
- rr-f2-04 · material_right_concept: Jev 0.60 vs gold 0
- rr-f3-01 · financing_component_concept: Jev 0.68 vs gold 0
- rr-f3-02 · financing_component_concept: Jev 0.61 vs gold 0
- rr-f3-04 · material_right_concept: Jev 0.54 vs gold 0
- rr-f4-01 · financing_component_concept: Jev 0.58 vs gold 0
- rr-f4-02 · trigger: Jev 0.55 vs gold 0
- rr-f4-02 · financing_component_concept: Jev 0.57 vs gold 0
- rr-f4-02 · contract_modification_concept: Jev 0.55 vs gold 0
- rr-f4-04 · financing_component_concept: Jev 0.55 vs gold 0
- rr-f4-04 · contract_modification_concept: Jev 0.43 vs gold 1
