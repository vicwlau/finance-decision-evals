# site

The results page: one page that tells the rev-rec results in six sections as the reader scrolls.
It's a Next.js app. The full write-up is [`rev-rec/report.md`](../rev-rec/report.md).

## Run it

From the repo root:

```sh
bun install
bun run --cwd site dev        # http://localhost:4200
```

Other scripts: `bun run --cwd site build`, `bun run --cwd site typecheck`, and
`bun run --cwd site data` (below).

## Where the numbers come from

Every result on the page comes from `data/results.json`. `scripts/export-results.ts` computes that
file from the run logs in `rev-rec/runs/`, with the cases, the v2 question set, the held-out freeze
record and the training records. `bun run --cwd site data` re-exports it. The contract framing (a 120-page contract, its
section numbers and page references) is made up for the illustrations and set in `app/page.tsx`.

## Layout

- `app/page.tsx`: the page and its copy.
- `app/globals.css`: all styles. Each element's default style is its end state, so the page reads
  in full without JavaScript and under reduced motion.
- `components/motion.tsx`: the scroll-driven scenes and reveals.
- `components/figure-*.ts(x)`: the slots the illustrations draw into, and their timing.
- `components/figures.tsx`: still placeholder drawings, shown until a figure mounts.
- `components/hairline/`: the illustrations (below).

## Illustrations

The illustrations are drawn with the hairline engine by Lucas Marques (MIT), in
`components/hairline/`. `hairline-kernel.js` is the engine. The figure files and `host.js` were
drawn with it in my private drawing workspace and are covered by this repo's MIT license. See
`components/hairline/NOTICE` and `components/hairline/LICENSE`.

## Commenting overlay

In development only, the page loads a commenting overlay from `@vicwlau/tickmark` (packed in
`vendor/`): press Alt+C, click an element, and leave a comment. `app/api/tickmark/route.ts` stores
the comments in a local JSONL file. Production builds don't render the overlay, and the route
answers 404.
