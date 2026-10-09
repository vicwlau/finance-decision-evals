# Results: rev-rec-dev-v1-computed-2026-10-03T005337985Z

Model jev-1.13.0 · question set v1 · state computed · 17 cases × 3 repeats = 51 calls · 53,187 input tokens · $0.0022

**Labels: 17 of 17 cases approved by the author.**

## Noul questions

Accuracy uses a 0.5 threshold. The prior baseline always predicts the share of positives for that question. Lower Brier is better.

| Question | Positives | Accuracy | Brier | Prior Brier |
|---|---|---|---|---|
| trigger | 10 of 17 | 92% | 0.081 | 0.242 |
| material_right | 3 of 17 | 100% | 0.025 | 0.145 |
| variable_consideration | 4 of 17 | 65% | 0.185 | 0.180 |
| refund_return | 3 of 17 | 100% | 0.003 | 0.145 |
| financing_component | 2 of 17 | 100% | 0.052 | 0.104 |
| contract_modification | 3 of 17 | 76% | 0.140 | 0.145 |
| termination_convenience | 1 of 17 | 100% | 0.032 | 0.055 |

## Primary consideration (Choice)

Top-1 accuracy: 65%.

## Trigger by family and difficulty

| Slice | Cases | Accuracy | Brier |
|---|---|---|---|
| F1 | 5 | 93% | 0.088 |
| F2 | 4 | 100% | 0.014 |
| F3 | 4 | 100% | 0.091 |
| F4 | 4 | 75% | 0.129 |
| easy | 6 | 100% | 0.045 |
| hard | 11 | 88% | 0.101 |

## Reliability (all Noul predictions)

| Predicted | Count | Mean predicted | Observed yes |
|---|---|---|---|
| 0.0–0.1 | 85 | 0.04 | 0% |
| 0.1–0.3 | 124 | 0.18 | 0% |
| 0.3–0.5 | 38 | 0.41 | 3% |
| 0.5–0.7 | 41 | 0.60 | 20% |
| 0.7–0.9 | 41 | 0.82 | 100% |
| 0.9–1.0 | 28 | 0.94 | 100% |

## Per case

Mean probability over repeats. ✗ marks a wrong side of 0.5 (gold in brackets). ~ marks repeats that disagreed.

| Case | Diff | Trigger | Considerations Jev flagged | Gold considerations | Primary (gold) |
|---|---|---|---|---|---|
| rr-f1-01 | easy | 0.74 | material_right 0.96<br>variable_consideration 0.56 ✗[0]<br>contract_modification 0.69 ✗[0] | material_right | material_right (0.99) |
| rr-f1-02 | easy | 0.27 | contract_modification 0.61 ✗[0] | none | material_right ✗[none] (0.80) |
| rr-f1-03 | hard | 0.19 | variable_consideration 0.66 ✗[0] | none | variable_consideration ✗[none] (0.82) |
| rr-f1-04 | hard | 0.49 ✗[1] ~ | material_right 0.89<br>variable_consideration 0.61 ✗[0] | material_right | variable_consideration ✗[material_right] (0.45) |
| rr-f1-05 | hard | 0.89 | material_right 0.91 | material_right | material_right (0.98) |
| rr-f2-01 | easy | 0.88 | variable_consideration 0.88<br>refund_return 0.94<br>contract_modification 0.59 ✗[0]<br>termination_convenience 0.73 | refund_return, termination_convenience, variable_consideration | refund_return (0.79) |
| rr-f2-02 | easy | 0.88 | variable_consideration 0.95<br>refund_return 0.97 | variable_consideration, refund_return | variable_consideration (0.73) |
| rr-f2-03 | hard | 0.14 | variable_consideration 0.93 | variable_consideration | variable_consideration ✗[none] (0.98) |
| rr-f2-04 | hard | 0.91 | variable_consideration 0.96<br>refund_return 0.85<br>contract_modification 0.68 ✗[0] | variable_consideration, refund_return | variable_consideration (0.52) |
| rr-f3-01 | hard | 0.30 | — | none | none (0.55) |
| rr-f3-02 | hard | 0.23 | — | none | none (0.57) |
| rr-f3-03 | easy | 0.73 | financing_component 0.85 | financing_component | financing_component (0.96) |
| rr-f3-04 | hard | 0.61 | financing_component 0.75 | financing_component | financing_component (0.95) |
| rr-f4-01 | easy | 0.82 | variable_consideration 0.56 ✗[0]<br>contract_modification 0.84 | contract_modification | contract_modification (1.00) |
| rr-f4-02 | hard | 0.55 ✗[0] | — | none | contract_modification ✗[none] (0.65) |
| rr-f4-03 | hard | 0.39 | variable_consideration 0.54 ✗[0]<br>contract_modification 0.96 | contract_modification | contract_modification ✗[none] (0.97) |
| rr-f4-04 | hard | 0.83 | variable_consideration 0.65 ✗[0]<br>contract_modification 0.60 | contract_modification | contract_modification (1.00) |

## Wrong answers

- rr-f1-01 · variable_consideration: Jev 0.56 vs gold 0
- rr-f1-01 · contract_modification: Jev 0.69 vs gold 0
- rr-f1-02 · contract_modification: Jev 0.61 vs gold 0
- rr-f1-02 · primary: Jev material_right vs gold none
- rr-f1-03 · variable_consideration: Jev 0.66 vs gold 0
- rr-f1-03 · primary: Jev variable_consideration vs gold none
- rr-f1-04 · trigger: Jev 0.49 vs gold 1
- rr-f1-04 · variable_consideration: Jev 0.61 vs gold 0
- rr-f1-04 · primary: Jev variable_consideration vs gold material_right
- rr-f2-01 · contract_modification: Jev 0.59 vs gold 0
- rr-f2-03 · primary: Jev variable_consideration vs gold none
- rr-f2-04 · contract_modification: Jev 0.68 vs gold 0
- rr-f4-01 · variable_consideration: Jev 0.56 vs gold 0
- rr-f4-02 · trigger: Jev 0.55 vs gold 0
- rr-f4-02 · primary: Jev contract_modification vs gold none
- rr-f4-03 · variable_consideration: Jev 0.54 vs gold 0
- rr-f4-03 · primary: Jev contract_modification vs gold none
- rr-f4-04 · variable_consideration: Jev 0.65 vs gold 0
