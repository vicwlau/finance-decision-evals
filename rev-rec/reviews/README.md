# Reviews

Evidence from label reviews: blind labels, reports, and the inputs reviewers saw. One folder per
review round, named `<date>-<split>`. Inside, files are prefixed by reviewer (`agent1-`,
`agent2-`, and `owner-` for mine).

Saving a review here approves nothing. Verdicts that count live in `../data/reviews.jsonl`.

## My notes in the log

I wrote my `note` verdicts to the drafting model during review. Many are questions that test its
reasoning, such as "Why do you disagree here?". The answers are in each case's final label and
`why`. Two notes changed a label (rr-f2-03 and rr-f4-03, which set the rule that labels record
substance and the review call records deal scope), one caught a unit error in a draft (rr-f1-01),
and one became a tracked family (rr-f4-03's early-renewal question, T8 in `../families.md`).
rr-f3-04 raises a contested point: whether a prepayment made for reasons other than financing needs
a financing assessment at all (606-10-32-17(c)). I labelled the need to assess, not its outcome.

For this public copy I tidied my notes in the log: typos, casing and punctuation, and "the owner"
became "I". One edit changes words: on rr-f3-04, "there is fixed add-on token purchase" became
"there is no fixed add-on token purchase", which is what I meant. The originals are verbatim in
`2026-10-03-heldout/agent2-packet/dev-examples.jsonl` (`owner_notes`). Nothing else in the log
changed.

The log also approves six example records from a record-format guide that isn't in this repo
(`rr-mr-0001-a`, `rr-mr-0001-b`, `rr-mr-0002-a`, `rr-fc-0001-a`, `rr-tc-0001-a`, `rr-tc-0001-b`),
so it lists 18 approved example records against the 12 training records here.

## Rounds

| Round | Cases | Reviewers |
|---|---|---|
| `2026-10-03-heldout/` | 20 held-out cases, frozen at `0e20378c…` (`../data/heldout-freeze.json`) | agent 1 (blind, then audit), agent 2 (blind only) |

The agent reviews were written by independent Claude sessions. Agent 1 describes itself as
"standing in for the author": it labelled the cases blind, as I would, before I reviewed them. My
review came after, in the log. When a report cites
`rev-rec/README.md`, it means the original track plan, which that file held at the time.

For this public copy, I made two kinds of edit to the agent reports (`agent1-review.md`,
`agent2-review.md`). References to my private project notes and files became plain descriptions,
and "the owner" became "the author" outside quotations. Nothing else in them changed. The blind labels are
unedited. `agent2-packet/` is unedited except two redactions in `guidelines.md`, marked in
brackets, that removed a former employer's practice. The packet's `guidelines.md` cites my project
decisions by number, and it quotes in full the decisions and the lesson it relies on.

Agent 1's files were first saved as `rev-rec/reviews/2026-10-03-heldout-agent-review.md` and
`…-agent-blind-labels.jsonl`. Verdict notes in `reviews.jsonl` still cite those paths.
