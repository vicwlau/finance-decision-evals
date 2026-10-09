// Figure settings shared by the page (server) and the motion code (client).

/** Draw the hairline figures (true) or the placeholder SVGs in figures.tsx (false), to compare. */
export const USE_HAIRLINE = true;

/** Box of each slot: the hairline figures draw in a 5:4 box (a 400 × 320 viewBox). */
export const SLOT_RATIO = USE_HAIRLINE ? { a: 5 / 4, b: 5 / 4, c: 5 / 4, d: 5 / 4 } : { a: 4 / 3, b: 16 / 10, c: 5 / 4, d: 5 / 4 };

/**
 * Figure A's progress at the top of the page, so the first screen shows a stack, not a thin slab.
 * The scene maps its scroll progress p to start + (1 − start) · p. Figure A (refit, drawing workspace 10d549f)
 * stages build 0–0.3, slide 0.3–0.7, dim 0.68, light 0.72, rise 0.72–0.9; at 0.2 the stack is
 * three-quarters built and the page hasn't moved.
 */
export const A_START = USE_HAIRLINE ? 0.2 : 0;

/** Figure A's progress at which the stack is complete; the page counter reaches 120 there. */
export const A_BUILT = 0.3;

/**
 * Figure B (scan-flags): the scroll progress at which each card and its marker switch on, in card
 * order. Flag k rises when the scan bar passes its clause, at progress 31, 51.4, 98.6 and 136.6
 * out of the scan's 164.6 units (0.19, 0.31, 0.60, 0.83; scan-flags.js at 41a025f). Each card
 * follows its flag a little later, once the slip has lifted. The number markers follow
 * fig.anchor("flag-N") live; B_MARKERS (the slips' left ends, measured at the rest pose)
 * are only where they sit before the anchors can be read.
 */
export const B_FLAG_AT = [0.22, 0.35, 0.63, 0.86];
export const B_MARKERS = [
  { x: 0.52, y: 0.219 },
  { x: 0.415, y: 0.284 },
  { x: 0.272, y: 0.406 },
  { x: 0.153, y: 0.547 },
];

/**
 * How long Figure C's test set and frame 6's Figure D play once in view, in ms.
 *
 * Figure C (hairline/locked-set.js), the case the twenty test clauses shut into, and the per-clause
 * marks that landed under it are off the page since my October review: frame 3 now shows
 * the review call's two steps instead. The figure's files and driver entry stay, as do the marks'
 * placement (markSpot) and PlayScene's tally; the marks' markup was removed from page.tsx.
 */
export const C_PLAY_MS = 1800;
export const D_PLAY_MS = 2600;

/**
 * Figure D (hairline/training-pair.js) is set aside. It draws a clause and its copy with a smaller
 * price block on the copy, which fits the old price-band pair. Frame 6 now shows a purchase and an
 * option at the same price, so the drawing would mislead. Its files, its driver entry and D_PLAY_MS
 * stay; true puts the figure back at the end of frame 6, played by a PlayScene.
 */
export const SHOW_FIGURE_D: boolean = false;

/**
 * The window, as fractions of C_PLAY_MS, in which the twenty marks land one by one and the score
 * counts up. It opens as Figure C's latch turns (0.66–0.88), after the lid has shut, so the set is
 * fixed before any result shows.
 */
export const C_TALLY: [number, number] = [0.78, 1.5];

/** A part's left and right edges and its foot, as fractions of a figure's box. */
export type Span = { x0: number; x1: number; y1: number };

/** The marks spread over the slot's width until Figure C has mounted (and without scripts). */
export const C_MARKS_FALLBACK: Span = { x0: 0, x1: 1, y1: 1 };

/**
 * Where mark k of n sits, as fractions of Figure C's box: in a row just under `under`
 * (the case, from fig.anchor("case")), spread evenly over its width. This is the one place that
 * decides it: once the figure tags each card (card-1 … card-20), mark k can sit on its card here.
 * The server uses it with C_MARKS_FALLBACK; the scene, with the live anchor.
 */
export const markSpot = (k: number, n: number, under: Span) => ({
  x: under.x0 + ((k + 0.5) / n) * (under.x1 - under.x0),
  y: under.y1,
});
