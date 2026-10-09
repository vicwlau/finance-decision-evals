# Probes

Probes are small numbered experiments that show how TypeSafe's API and Jev respond. Each one answers a single question before I rely on the answer in the eval code. A probe folder holds a `README.md` (asked, expected, saw, learned), the request it sent or the script that sent it, and its run logs under `runs/`.

| # | Probe | Question | Verdict |
|---|-------|----------|---------|
| 001 | [smoke](001-smoke/) | Does a direct API call with a pinned version work, and does the response match the docs? | Pass |
| 002 | [refund-noul-vs-choice](002-refund-noul-vs-choice/) | Do the docs' Noul vs Choice and negation numbers reproduce on `jev-1.13.0`, and how noisy are repeats? | Pass: reproduce; repeat SD 0.004–0.017 |
| 003 | [clarified-rules](003-clarified-rules/) | Do clarified rule questions fix the two held-out misses caused by how Jev reads a clause's structure? | Partly: fixes the variable-consideration miss; the material-right miss moves to about 0.55, still wrong |
