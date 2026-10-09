# Results: rev-rec-dev-v1-structured-2026-10-03T005336612Z

Model jev-1.13.0 · question set v1 · state structured · 17 cases × 3 repeats = 51 calls · 51,291 input tokens · $0.0022

**Labels: 17 of 17 cases approved by the author.**

## Noul questions

Accuracy uses a 0.5 threshold. The prior baseline always predicts the share of positives for that question. Lower Brier is better.

| Question | Positives | Accuracy | Brier | Prior Brier |
|---|---|---|---|---|
| trigger | 10 of 17 | 88% | 0.134 | 0.242 |
| material_right | 3 of 17 | 94% | 0.037 | 0.145 |
| variable_consideration | 4 of 17 | 69% | 0.172 | 0.180 |
| refund_return | 3 of 17 | 100% | 0.003 | 0.145 |
| financing_component | 2 of 17 | 100% | 0.072 | 0.104 |
| contract_modification | 3 of 17 | 71% | 0.153 | 0.145 |
| termination_convenience | 1 of 17 | 100% | 0.028 | 0.055 |

## Primary consideration (Choice)

Top-1 accuracy: 53%.

## Trigger by family and difficulty

| Slice | Cases | Accuracy | Brier |
|---|---|---|---|
| F1 | 5 | 80% | 0.196 |
| F2 | 4 | 100% | 0.020 |
| F3 | 4 | 100% | 0.132 |
| F4 | 4 | 75% | 0.173 |
| easy | 6 | 100% | 0.078 |
| hard | 11 | 82% | 0.165 |

## Reliability (all Noul predictions)

| Predicted | Count | Mean predicted | Observed yes |
|---|---|---|---|
| 0.0–0.1 | 77 | 0.04 | 0% |
| 0.1–0.3 | 115 | 0.18 | 0% |
| 0.3–0.5 | 53 | 0.38 | 6% |
| 0.5–0.7 | 49 | 0.58 | 29% |
| 0.7–0.9 | 40 | 0.81 | 95% |
| 0.9–1.0 | 23 | 0.94 | 100% |

## Per case

Mean probability over repeats. ✗ marks a wrong side of 0.5 (gold in brackets). ~ marks repeats that disagreed.

| Case | Diff | Trigger | Considerations Jev flagged | Gold considerations | Primary (gold) |
|---|---|---|---|---|---|
| rr-f1-01 | easy | 0.51 | material_right 0.90<br>contract_modification 0.66 ✗[0] | material_right | material_right (0.95) |
| rr-f1-02 | easy | 0.33 | material_right 0.54 ✗[0]<br>contract_modification 0.68 ✗[0] | none | material_right ✗[none] (0.89) |
| rr-f1-03 | hard | 0.25 | variable_consideration 0.60 ✗[0] | none | variable_consideration ✗[none] (0.86) |
| rr-f1-04 | hard | 0.37 ✗[1] | material_right 0.84<br>variable_consideration 0.58 ✗[0] | material_right | variable_consideration ✗[material_right] (0.56) |
| rr-f1-05 | hard | 0.58 | material_right 0.73 | material_right | material_right (0.85) |
| rr-f2-01 | easy | 0.88 | variable_consideration 0.89<br>refund_return 0.94<br>contract_modification 0.55 ✗[0]<br>termination_convenience 0.73 | refund_return, termination_convenience, variable_consideration | refund_return (0.79) |
| rr-f2-02 | easy | 0.86 | variable_consideration 0.96<br>refund_return 0.95<br>contract_modification 0.54 ✗[0] | variable_consideration, refund_return | variable_consideration (0.80) |
| rr-f2-03 | hard | 0.18 | variable_consideration 0.92 | variable_consideration | variable_consideration ✗[none] (0.99) |
| rr-f2-04 | hard | 0.90 | variable_consideration 0.96<br>refund_return 0.85<br>contract_modification 0.68 ✗[0] | variable_consideration, refund_return | variable_consideration (0.54) |
| rr-f3-01 | hard | 0.41 | — | none | financing_component ✗[none] (0.66) |
| rr-f3-02 | hard | 0.33 | variable_consideration 0.50 ✗[0] ~ | none | financing_component ✗[none] (0.66) |
| rr-f3-03 | easy | 0.77 | financing_component 0.78 | financing_component | financing_component (1.00) |
| rr-f3-04 | hard | 0.56 | financing_component 0.54 | financing_component | financing_component (0.93) |
| rr-f4-01 | easy | 0.82 | variable_consideration 0.55 ✗[0]<br>contract_modification 0.85 | contract_modification | contract_modification (1.00) |
| rr-f4-02 | hard | 0.64 ✗[0] | — | none | contract_modification ✗[none] (0.57) |
| rr-f4-03 | hard | 0.47 | variable_consideration 0.50 ✗[0] ~<br>contract_modification 0.96 | contract_modification | contract_modification ✗[none] (0.97) |
| rr-f4-04 | hard | 0.84 | variable_consideration 0.68 ✗[0]<br>contract_modification 0.66 | contract_modification | contract_modification (1.00) |

## Wrong answers

- rr-f1-01 · contract_modification: Jev 0.66 vs gold 0
- rr-f1-02 · material_right: Jev 0.54 vs gold 0
- rr-f1-02 · contract_modification: Jev 0.68 vs gold 0
- rr-f1-02 · primary: Jev material_right vs gold none
- rr-f1-03 · variable_consideration: Jev 0.60 vs gold 0
- rr-f1-03 · primary: Jev variable_consideration vs gold none
- rr-f1-04 · trigger: Jev 0.37 vs gold 1
- rr-f1-04 · variable_consideration: Jev 0.58 vs gold 0
- rr-f1-04 · primary: Jev variable_consideration vs gold material_right
- rr-f2-01 · contract_modification: Jev 0.55 vs gold 0
- rr-f2-02 · contract_modification: Jev 0.54 vs gold 0
- rr-f2-03 · primary: Jev variable_consideration vs gold none
- rr-f2-04 · contract_modification: Jev 0.68 vs gold 0
- rr-f3-01 · primary: Jev financing_component vs gold none
- rr-f3-02 · variable_consideration: Jev 0.50 vs gold 0
- rr-f3-02 · primary: Jev financing_component vs gold none
- rr-f4-01 · variable_consideration: Jev 0.55 vs gold 0
- rr-f4-02 · trigger: Jev 0.64 vs gold 0
- rr-f4-02 · primary: Jev contract_modification vs gold none
- rr-f4-03 · variable_consideration: Jev 0.50 vs gold 0
- rr-f4-03 · primary: Jev contract_modification vs gold none
- rr-f4-04 · variable_consideration: Jev 0.68 vs gold 0
