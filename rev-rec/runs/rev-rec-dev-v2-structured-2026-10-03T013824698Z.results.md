# Results: rev-rec-dev-v2-structured-2026-10-03T013824698Z

Model jev-1.13.0 · question set v2 · state structured · 17 cases × 3 repeats = 51 calls · 50,475 input tokens · $0.0021

**Labels: 17 of 17 cases approved by the author.**

## Noul questions

Accuracy uses a 0.5 threshold. The prior baseline always predicts the share of positives for that question. Lower Brier is better.

| Question | Positives | Accuracy | Brier | Prior Brier |
|---|---|---|---|---|
| trigger | 10 of 17 | 86% | 0.135 | 0.242 |
| material_right | 3 of 17 | 94% | 0.040 | 0.145 |
| variable_consideration | 4 of 17 | 100% | 0.049 | 0.180 |
| refund_return | 3 of 17 | 100% | 0.003 | 0.145 |
| financing_component | 2 of 17 | 98% | 0.071 | 0.104 |
| contract_modification | 3 of 17 | 98% | 0.048 | 0.145 |
| termination_convenience | 1 of 17 | 100% | 0.028 | 0.055 |
| material_right_concept | 3 of 17 | 73% | 0.182 | 0.145 |
| variable_consideration_concept | 4 of 17 | 71% | 0.163 | 0.180 |
| refund_return_concept | 3 of 17 | 100% | 0.015 | 0.145 |
| financing_component_concept | 2 of 17 | 71% | 0.202 | 0.104 |
| contract_modification_concept | 3 of 17 | 98% | 0.058 | 0.145 |
| termination_convenience_concept | 1 of 17 | 100% | 0.003 | 0.055 |

## Trigger by family and difficulty

| Slice | Cases | Accuracy | Brier |
|---|---|---|---|
| F1 | 5 | 80% | 0.195 |
| F2 | 4 | 100% | 0.019 |
| F3 | 4 | 100% | 0.139 |
| F4 | 4 | 67% | 0.172 |
| easy | 6 | 100% | 0.077 |
| hard | 11 | 79% | 0.166 |

## Reliability (all Noul predictions)

| Predicted | Count | Mean predicted | Observed yes |
|---|---|---|---|
| 0.0–0.1 | 181 | 0.05 | 0% |
| 0.1–0.3 | 223 | 0.18 | 0% |
| 0.3–0.5 | 94 | 0.39 | 10% |
| 0.5–0.7 | 58 | 0.56 | 38% |
| 0.7–0.9 | 80 | 0.82 | 85% |
| 0.9–1.0 | 27 | 0.94 | 100% |

## Per case

Mean probability over repeats. ✗ marks a wrong side of 0.5 (gold in brackets). ~ marks repeats that disagreed.

| Case | Diff | Trigger | Considerations Jev flagged | Gold considerations | Primary (gold) |
|---|---|---|---|---|---|
| rr-f1-01 | easy | 0.52 | material_right 0.93 | material_right | — |
| rr-f1-02 | easy | 0.33 | material_right 0.52 ✗[0] ~ | none | — |
| rr-f1-03 | hard | 0.25 | — | none | — |
| rr-f1-04 | hard | 0.39 ✗[1] | material_right 0.86 | material_right | — |
| rr-f1-05 | hard | 0.56 | material_right 0.81 | material_right | — |
| rr-f2-01 | easy | 0.88 | variable_consideration 0.88<br>refund_return 0.94<br>termination_convenience 0.72 | refund_return, termination_convenience, variable_consideration | — |
| rr-f2-02 | easy | 0.86 | variable_consideration 0.96<br>refund_return 0.94 | variable_consideration, refund_return | — |
| rr-f2-03 | hard | 0.18 | variable_consideration 0.89 | variable_consideration | — |
| rr-f2-04 | hard | 0.90 | variable_consideration 0.96<br>refund_return 0.85 | variable_consideration, refund_return | — |
| rr-f3-01 | hard | 0.41 | — | none | — |
| rr-f3-02 | hard | 0.35 | — | none | — |
| rr-f3-03 | easy | 0.77 | financing_component 0.78 | financing_component | — |
| rr-f3-04 | hard | 0.54 | financing_component 0.53 | financing_component | — |
| rr-f4-01 | easy | 0.83 | contract_modification 0.90 | contract_modification | — |
| rr-f4-02 | hard | 0.63 ✗[0] | — | none | — |
| rr-f4-03 | hard | 0.48 ~ | contract_modification 0.96 | contract_modification | — |
| rr-f4-04 | hard | 0.84 | contract_modification 0.74 | contract_modification | — |

## Wrong answers

- rr-f1-01 · variable_consideration_concept: Jev 0.60 vs gold 0
- rr-f1-02 · material_right: Jev 0.52 vs gold 0
- rr-f1-02 · variable_consideration_concept: Jev 0.60 vs gold 0
- rr-f1-03 · variable_consideration_concept: Jev 0.80 vs gold 0
- rr-f1-04 · trigger: Jev 0.39 vs gold 1
- rr-f1-04 · variable_consideration_concept: Jev 0.80 vs gold 0
- rr-f1-05 · material_right_concept: Jev 0.37 vs gold 1
- rr-f2-01 · material_right_concept: Jev 0.57 vs gold 0
- rr-f2-01 · variable_consideration_concept: Jev 0.45 vs gold 1
- rr-f2-04 · material_right_concept: Jev 0.58 vs gold 0
- rr-f3-01 · financing_component_concept: Jev 0.75 vs gold 0
- rr-f3-02 · financing_component_concept: Jev 0.74 vs gold 0
- rr-f3-04 · material_right_concept: Jev 0.55 vs gold 0
- rr-f4-01 · financing_component_concept: Jev 0.58 vs gold 0
- rr-f4-02 · trigger: Jev 0.63 vs gold 0
- rr-f4-02 · financing_component_concept: Jev 0.61 vs gold 0
- rr-f4-04 · financing_component_concept: Jev 0.53 vs gold 0
