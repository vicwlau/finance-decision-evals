// The seam between the page's scroll code and whatever is drawn in a FigureSlot.
//
// Each scroll scene computes one progress number from 0 to 1, where 1 is the figure's rest pose,
// and hands it to the slot's driver on every frame. A slot is attached once and starts at rest
// (1). Under reduced motion the scenes attach but never wire scroll, so the figure stays at rest.
//
// With USE_HAIRLINE, attaching a slot mounts its hairline figure (components/hairline/, drawn
// with the hairline engine; see its NOTICE) into a stage inside the slot, at the latest
// progress, and hides the server-rendered placeholder SVG. Without JavaScript the placeholder
// stays, at rest. With USE_HAIRLINE off, the placeholders read the progress as --fp.

import { USE_HAIRLINE } from "./figure-config";

export type FigureDriver = {
  /** Progress from 0 to 1; 1 is the rest pose. The figure eases to it. */
  setProgress: (p: number) => void;
  /**
   * Puts the figure at p at once, without easing, by drawing it afresh. For resetting a scene
   * while it is off screen: the hairline loop sleeps there, so an eased reset would play back
   * as the reader returns.
   */
  jump: (p: number) => void;
};

/** A part of the drawing as fractions of the 5:4 box, or null when it isn't drawn. */
export type Part = { x: number; y: number; x0: number; y0: number; x1: number; y1: number } | null;
type Hairline = { value: (v: number) => void; bright: () => Part; anchor: (name: string) => Part; destroy: () => void };
type MountFigure = (stage: HTMLElement, figure: unknown, opts: { value?: number }) => Hairline;
type Mounted = {
  driver: FigureDriver;
  latest: number;
  fig: Hairline | null;
  stage: HTMLElement | null;
  /** Draws the figure afresh at p; set once it has mounted. */
  remount: ((p: number) => void) | null;
};

/** The hairline figure for each slot id. Loaded on the client only: the host touches the DOM. */
const FIGURES: Record<string, () => Promise<{ default: unknown }>> = {
  a: () => import("./hairline/contract-page.js"),
  b: () => import("./hairline/scan-flags.js"),
  c: () => import("./hairline/locked-set.js"),
  d: () => import("./hairline/training-pair.js"),
};

/** The named part a leader line points at, per slot; otherwise the bright part. */
const LEADER_PART: Record<string, string> = { a: "sentence" };

/** One figure per slot, however often a scene attaches (React runs effects twice in development). */
const slots = new WeakMap<HTMLElement, Mounted>();

export function attachFigure(slot: HTMLElement): FigureDriver {
  const known = slots.get(slot);
  if (known) return known.driver;
  const m: Mounted = {
    latest: 1,
    fig: null,
    stage: null,
    remount: null,
    driver: {
      setProgress: (p) => {
        m.latest = p;
        slot.style.setProperty("--fp", p.toFixed(4));
        m.fig?.value(p);
      },
      jump: (p) => {
        m.latest = p;
        slot.style.setProperty("--fp", p.toFixed(4));
        // before it mounts, the figure will simply mount at p
        m.remount?.(p);
      },
    },
  };
  slots.set(slot, m);
  slot.style.setProperty("--fp", "1");
  const load = FIGURES[slot.dataset.figureSlot ?? ""];
  if (USE_HAIRLINE && load) void mountHairline(slot, load, m);
  return m.driver;
}

async function mountHairline(slot: HTMLElement, load: () => Promise<{ default: unknown }>, m: Mounted) {
  const [host, mod] = await Promise.all([import("./hairline/host.js"), load()]);
  const mountFigure = (host as unknown as { mountFigure: MountFigure }).mountFigure;
  const stage = document.createElement("div");
  stage.className = "hairline-stage";
  stage.dataset.hairlineTheme = "light";
  slot.appendChild(stage);
  // The page's wording, not the figure's internal description; the slot stops being the image.
  const label = slot.getAttribute("aria-label");
  const draw = (p: number) => {
    const fig = mountFigure(stage, mod.default, { value: p });
    // mountFigure labels the stage with the figure's own description; put the page's back
    if (label) stage.setAttribute("aria-label", label);
    return fig;
  };
  // Mounted at the latest progress: 1 (rest) unless a scene is already driving it.
  m.fig = draw(m.latest);
  slot.removeAttribute("role");
  slot.removeAttribute("aria-label");
  m.stage = stage;
  m.remount = (p) => {
    m.fig?.destroy();
    m.fig = draw(p);
  };
  slot.dataset.mounted = "";
}

/** A named part of the mounted hairline figure (fig.anchor), as fractions of its box; null before mount. */
export function figurePart(slot: HTMLElement, name: string): Part {
  return slots.get(slot)?.fig?.anchor(name) ?? null;
}

/**
 * Where the figure's highlighted part is on screen, for the leader line to the contract excerpt:
 * the hairline figure's named part (Figure A's "sentence") or bright() box, or the placeholder's
 * [data-anchor] until it mounts. Null while nothing is drawn there. Nothing else looks it up.
 */
export function figureAnchor(slot: HTMLElement): DOMRect | null {
  const m = slots.get(slot);
  if (m?.fig && m.stage) {
    const name = LEADER_PART[slot.dataset.figureSlot ?? ""];
    const b = (name ? m.fig.anchor(name) : null) ?? m.fig.bright();
    if (!b) return null;
    const r = m.stage.getBoundingClientRect();
    return new DOMRect(r.left + b.x0 * r.width, r.top + b.y0 * r.height, (b.x1 - b.x0) * r.width, (b.y1 - b.y0) * r.height);
  }
  return slot.querySelector("[data-anchor]")?.getBoundingClientRect() ?? null;
}
