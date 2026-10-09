// Freeze the held-out split, or check that it is still frozen.
// Usage: bun rev-rec/scripts/freeze.ts check | write
//   check  compare the held-out lines of data/cases.jsonl with data/heldout-freeze.json (exit 1 on mismatch)
//   write  create data/heldout-freeze.json; refuses if it already exists
// The hash covers each held-out line exactly as stored, in file order, each ending in "\n", so a shell
// one-liner reproduces it: grep '"split":"heldout"' rev-rec/data/cases.jsonl | shasum -a 256
// Approvals live in data/reviews.jsonl and can change after the freeze (my spot-check upgrades an
// agent approval), so they are recorded for reference but left out of the hash.

const root = new URL("..", import.meta.url).pathname;
export const MANIFEST = `${root}data/heldout-freeze.json`;

export async function heldoutHash() {
  const lines = (await Bun.file(`${root}data/cases.jsonl`).text())
    .trim()
    .split("\n")
    .filter((l) => JSON.parse(l).split === "heldout");
  const sha256 = new Bun.CryptoHasher("sha256").update(lines.map((l) => l + "\n").join("")).digest("hex");
  return { sha256, ids: lines.map((l) => JSON.parse(l).id as string) };
}

/** Throws unless the held-out lines match the recorded freeze. */
export async function assertFrozen() {
  const file = Bun.file(MANIFEST);
  if (!(await file.exists())) throw new Error("held-out is not frozen: run `bun rev-rec/scripts/freeze.ts write` first");
  const { sha256: want } = await file.json();
  const { sha256: got } = await heldoutHash();
  if (got !== want) throw new Error(`held-out cases changed since the freeze (expected ${want}, got ${got})`);
  return got;
}

/** A JSON value with its object keys sorted, so two values compare equal whatever their key order. */
const canonical = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(canonical).join(",")}]`
    : v && typeof v === "object"
      ? `{${Object.keys(v)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`)
          .join(",")}}`
      : JSON.stringify(v);
export const sameJson = (a: unknown, b: unknown) => canonical(a) === canonical(b);

/**
 * Who approved each case: my verdict (reviewer "owner") supersedes an agent's. As in the review
 * console, an approval counts only while the case still matches the snapshot it was given on.
 */
export async function approvals(ids: string[]) {
  const current = new Map(
    (await Bun.file(`${root}data/cases.jsonl`).text())
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l))
      .map((c) => [c.id as string, c]),
  );
  const reviews = (await Bun.file(`${root}data/reviews.jsonl`).text())
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l))
    .filter((r) => r.kind === "case" && r.verdict === "approve");
  const tier = (id: string) => {
    const mine = reviews.filter((r) => r.item_id === id && sameJson(r.snapshot, current.get(id)));
    if (mine.some((r) => r.reviewer === "owner")) return "owner";
    return mine.find((r) => r.reviewer.startsWith("agent:"))?.reviewer ?? "unreviewed";
  };
  return Object.fromEntries(ids.map((id) => [id, tier(id)]));
}

if (import.meta.main) {
  const mode = Bun.argv[2];
  if (mode === "check") {
    const sha = await assertFrozen().catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
    console.log(`held-out frozen and unchanged: ${sha}`);
  } else if (mode === "write") {
    if (await Bun.file(MANIFEST).exists()) throw new Error(`${MANIFEST} already exists; held-out is frozen`);
    const { sha256, ids } = await heldoutHash();
    const manifest = {
      frozen_at: new Date().toISOString(),
      sha256,
      count: ids.length,
      method:
        "SHA-256 of the split:heldout lines of rev-rec/data/cases.jsonl as stored, in file order, each ending in a newline. " +
        `Reproduce: grep '"split":"heldout"' rev-rec/data/cases.jsonl | shasum -a 256`,
      // Slices fixed before the first held-out run, so none is chosen after seeing results.
      slices: {
        unnamed_by_v2: {
          note: "Patterns no v2 question names (handoff, 2026-10-03): the clean test of whether v2's rule questions generalize.",
          ids: ["rr-f1-h02", "rr-f1-h03", "rr-f2-h02", "rr-f2-h05", "rr-f3-h03", "rr-f3-h05", "rr-f4-h02", "rr-f4-h04"],
        },
        named_by_v2: {
          note: "Traps a v2 question names: the v2 trigger names f2-h03's; the modification rule half-names f4-h03's.",
          ids: ["rr-f2-h03", "rr-f4-h03"],
        },
      },
      approvals_at_freeze: await approvals(ids),
    };
    await Bun.write(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`froze ${ids.length} held-out cases: ${sha256}`);
  } else {
    throw new Error("usage: bun rev-rec/scripts/freeze.ts check | write");
  }
}
