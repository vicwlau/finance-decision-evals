"use client";

// Scroll-driven motion, in plain code. Every component here renders its children at their end
// state on the server, so the page reads fully without JavaScript, and none of them move anything
// under prefers-reduced-motion. Motion only changes opacity and transforms, so nothing shifts.

import { createElement, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { C_MARKS_FALLBACK, markSpot } from "./figure-config";
import { attachFigure, figureAnchor, figurePart, type FigureDriver } from "./figure-driver";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const motionAllowed = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/**
 * Runs inline, before first paint, as the first child of the page wrapper: marks the wrapper .js
 * (scripts run, so the hairline figures will draw) and .motion when motion is allowed, so the
 * opening scene starts at its first pose instead of flashing its end state. The wrapper carries
 * suppressHydrationWarning for these classes.
 */
export const MOTION_BOOT =
  "try{var c=document.currentScript.parentElement.classList;c.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)c.add('motion')}catch(e){}";

/* ------------------------------------------------------------------------------------------ */
/* Leader line: a thin accent line from the figure's anchor to an excerpt, a dot at each end.  */
/* ------------------------------------------------------------------------------------------ */

function drawLeader(scene: HTMLElement, slot: HTMLElement | null, l: number) {
  const svg = scene.querySelector<SVGSVGElement>("[data-leader]");
  const to = scene.querySelector<HTMLElement>("[data-leader-to]");
  if (!svg || !to) return;
  const [path, start, end] = [svg.querySelector("path"), ...svg.querySelectorAll("circle")];
  const a = slot ? figureAnchor(slot) : null;
  if (!a) {
    // nothing bright yet: no line
    start?.style.setProperty("opacity", "0");
    end?.style.setProperty("opacity", "0");
    path?.style.setProperty("stroke-dashoffset", "1");
    return;
  }
  const o = svg.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  let d: string;
  let s: [number, number];
  let e: [number, number];
  if (b.right <= a.left) {
    // excerpt to the left of the figure: out of the sentence, across the gutter, into the excerpt
    s = [a.left - o.left, a.top + a.height / 2 - o.top];
    e = [b.right - o.left, b.top + 17 - o.top];
    const mid = (s[0] + e[0]) / 2;
    d = `M${s[0]} ${s[1]} H${mid} V${e[1]} H${e[0]}`;
  } else if (b.left >= a.right) {
    // excerpt to the right: out of the sentence's right end instead
    s = [a.right - o.left, a.top + a.height / 2 - o.top];
    e = [b.left - o.left, b.top + 17 - o.top];
    const mid = (s[0] + e[0]) / 2;
    d = `M${s[0]} ${s[1]} H${mid} V${e[1]} H${e[0]}`;
  } else {
    // stacked: straight down from the sentence to the top of the excerpt
    const x = clamp(a.left + 18, b.left + 14, b.right - 14) - o.left;
    s = [x, a.bottom - o.top];
    e = [x, b.top - o.top];
    d = `M${s[0]} ${s[1]} V${e[1]}`;
  }
  path?.setAttribute("d", d);
  path?.style.setProperty("stroke-dashoffset", String(1 - l));
  start?.setAttribute("cx", String(s[0]));
  start?.setAttribute("cy", String(s[1]));
  end?.setAttribute("cx", String(e[0]));
  end?.setAttribute("cy", String(e[1]));
  start?.style.setProperty("opacity", l > 0.01 ? "1" : "0");
  end?.style.setProperty("opacity", l > 0.98 ? "1" : "0");
  svg.dataset.ready = "";
}

/* ------------------------------------------------------------------------------------------ */
/* Reviewer's pen: an underline under [data-pen], a tick at its end, and a short connector down  */
/* to [data-pen-to]. Geometry only; globals.css draws and sequences the strokes. A pen svg      */
/* without a .pen-tick path (frame 6) draws no tick.                                          */
/* ------------------------------------------------------------------------------------------ */

function drawPen(scene: HTMLElement) {
  const svg = scene.querySelector<SVGSVGElement>("[data-pen-svg]");
  const phrase = scene.querySelector<HTMLElement>("[data-pen]");
  const to = scene.querySelector<HTMLElement>("[data-pen-to]");
  if (!svg || !phrase || !to) return;
  const rects = [...phrase.getClientRects()].filter((r) => r.width > 2);
  if (!rects.length) return;
  const [line, tick, link] = [".pen-line", ".pen-tick", ".pen-link"].map((c) => svg.querySelector(c));
  // shown before it is measured: a hidden svg (display: none until ready) measures at the
  // viewport's origin, and a first layout taken then puts every stroke off the phrase
  svg.dataset.ready = "";
  const o = svg.getBoundingClientRect();
  let d = "";
  for (const r of rects) {
    // a loose, slightly wavy pen stroke under each line of the phrase
    const x0 = r.left - o.left - 3;
    const x1 = r.right - o.left + 2;
    const y = r.bottom - o.top + 1;
    const w = x1 - x0;
    d += `M${x0} ${y + 1.4} C${x0 + w * 0.3} ${y - 0.8} ${x0 + w * 0.64} ${y + 2.6} ${x1} ${y + 0.2} `;
  }
  line?.setAttribute("d", d);
  const last = rects[rects.length - 1];
  const tx = last.right - o.left + 12;
  const ty = last.bottom - o.top - 4;
  tick?.setAttribute("d", `M${tx} ${ty} l3.5 4.5 l7.5 -11.5`);
  // the margin callout: from the start of the mark, out past the excerpt's left edge, down the
  // margin, and into the tag, as a reviewer draws a note out of a marked figure. With
  // data-pen-route="margin" (frame 6, where the mark sits mid-line) it starts in the margin beside
  // the marked line instead, so it never runs under the words before the mark.
  const t = to.getBoundingClientRect();
  const box = (phrase.closest(".excerpt") ?? phrase).getBoundingClientRect();
  const fromMargin = svg.dataset.penRoute === "margin";
  const sx = fromMargin ? box.left - o.left - 4 : last.left - o.left - 4;
  const sy = fromMargin ? rects[0].top + rects[0].height / 2 - o.top : last.bottom - o.top + 3;
  const mx = box.left - o.left - 14;
  const ty2 = t.top + t.height / 2 - o.top;
  const ex = t.left - o.left - 4;
  const r = 6;
  link?.setAttribute(
    "d",
    `M${sx} ${sy} C${sx - (sx - mx) * 0.4} ${sy + 1.5} ${mx + r} ${sy - 0.5} ${mx + r} ${sy} Q${mx} ${sy} ${mx} ${sy + r} ` +
      `V${ty2 - r} Q${mx} ${ty2} ${mx + r} ${ty2} H${ex}`,
  );
}

/* ------------------------------------------------------------------------------------------ */
/* ScrollScene: the pinned opening. One progress number over the track's scroll.              */
/* ------------------------------------------------------------------------------------------ */

/** Distance from the bottom of `n` to the bottom of its offset ancestor `holder`, ignoring transforms; null if `holder` isn't one. */
function footRoom(n: HTMLElement, holder: HTMLElement): number | null {
  let y = n.offsetHeight;
  let at: HTMLElement | null = n;
  while (at && at !== holder) {
    y += at.offsetTop;
    at = at.offsetParent as HTMLElement | null;
  }
  return at === holder ? holder.offsetHeight - y : null;
}

/**
 * Once the reader has scrolled through the scene, its sticky holder rests at the foot of its
 * container, and whatever room sits below the lowest [data-tail] block shows as empty page before
 * the next frame (the pin is a screen tall with its content centred). The scene gives that room
 * back as a negative bottom margin, so the next frame starts its usual distance below the content.
 * Only what follows the scene moves, and at load that is several screens below the reader.
 */
function tuckScene(el: HTMLElement, sticky: HTMLElement[]) {
  const holder = sticky.filter((n) => getComputedStyle(n).position === "sticky").pop();
  const box = holder?.parentElement;
  if (!holder || !box) return;
  const tails = [...holder.querySelectorAll<HTMLElement>("[data-tail]")];
  const room = Math.min(...tails.map((t) => footRoom(t, holder) ?? Infinity));
  if (!Number.isFinite(room)) return;
  const b = getComputedStyle(box);
  const below = el.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom + parseFloat(b.paddingBottom) + parseFloat(b.borderBottomWidth);
  el.style.marginBottom = `${-Math.max(0, Math.round(room + below))}px`;
}

type SceneProps = {
  children: ReactNode;
  className?: string;
  tick?: string;
  label?: string;
  /** The figure's progress at the top of the track; it reaches 1 at scroll progress `figureEnd`. */
  figureStart?: number;
  figureEnd?: number;
  /** Scroll progress at which the scene's second step (data-impact) plays; above it, it stays. */
  impactAt?: number;
  /** Counts [data-counter] up to `to`, reaching it at figure progress `until`. */
  counter?: { to: number; until: number; one: string; many: string };
  /** Scroll progress window [from, to] in which the leader line draws. */
  leader?: [number, number];
};

/**
 * A tall track whose sticky stage plays one progress number, 0 to 1 (1 = rest pose), over the
 * track's scroll. It goes to the FigureSlot's driver, to the scene as --p, to the counter, and to
 * the leader line. On narrow screens only the figure and excerpt pin (the intro scrolls normally),
 * so the stage always fits the viewport.
 */
export function ScrollScene({ children, className, tick, label, figureStart = 0, figureEnd = 1, impactAt, counter, leader }: SceneProps) {
  const ref = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const slot = el.querySelector<HTMLElement>("[data-figure-slot]");
    const driver: FigureDriver | null = slot ? attachFigure(slot) : null;
    const leaderAt = (p: number) => (leader ? clamp01((p - leader[0]) / (leader[1] - leader[0])) : 1);

    if (!motionAllowed()) {
      // Reduced motion: the figure stays at rest; the leader is drawn once, finished.
      const still = () => {
        drawLeader(el, slot, 1);
        drawPen(el);
      };
      still();
      // the hairline figure mounts asynchronously; draw again once it has
      const timers = [300, 900, 2000].map((ms) => window.setTimeout(still, ms));
      window.addEventListener("resize", still);
      return () => {
        timers.forEach(clearTimeout);
        window.removeEventListener("resize", still);
      };
    }

    const sticky = [...el.querySelectorAll<HTMLElement>("[data-pin], [data-focus]")];
    const count = el.querySelector<HTMLElement>("[data-counter]");
    const vh = () => window.innerHeight;
    el.dataset.live = "";
    // the room under the content changes with the fonts, the figure's mount and the width
    const tuck = () => tuckScene(el, sticky);
    tuck();
    const sizes = new ResizeObserver(tuck);
    for (const n of [...sticky, ...el.querySelectorAll<HTMLElement>("[data-tail]")]) sizes.observe(n);

    let raf = 0;
    let follow = 0;
    let followUntil = 0;
    let lastP = 0;
    // The figure eases on its own spring after the scroll stops; keep the leader on it meanwhile.
    const followFrame = (now: number) => {
      drawLeader(el, slot, leaderAt(lastP));
      follow = now < followUntil ? requestAnimationFrame(followFrame) : 0;
    };
    const update = () => {
      raf = 0;
      for (const s of sticky) {
        if (getComputedStyle(s).position === "sticky") s.style.top = `${Math.min(0, vh() - s.offsetHeight)}px`;
      }
      const r = el.getBoundingClientRect();
      const travel = r.height - vh();
      const p = travel > 0 ? clamp01(-r.top / travel) : 1;
      const fp = figureStart + (1 - figureStart) * clamp01(p / figureEnd);
      el.style.setProperty("--p", p.toFixed(4));
      driver?.setProgress(fp);
      if (count && counter) {
        const n = Math.max(1, Math.round(counter.to * clamp01(fp / counter.until)));
        count.textContent = `${n} ${n === 1 ? counter.one : counter.many}`;
      }
      lastP = p;
      drawLeader(el, slot, leaderAt(p));
      if (impactAt !== undefined) {
        const on = p >= impactAt;
        // lay the pen out (still undrawn) before it is needed, so its strokes can animate in
        if (p >= impactAt - 0.15) drawPen(el);
        if (on !== "impact" in el.dataset) {
          if (on) el.dataset.impact = "";
          else delete el.dataset.impact;
        }
      }
      followUntil = performance.now() + 1200;
      if (!follow) follow = requestAnimationFrame(followFrame);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(follow);
      sizes.disconnect();
      el.style.marginBottom = "";
    };
  }, [figureStart, figureEnd, impactAt, counter?.to, counter?.until, leader?.[0], leader?.[1]]);

  return (
    <section ref={ref} className={className} data-tickmark={tick} aria-label={label}>
      {children}
    </section>
  );
}


/* ------------------------------------------------------------------------------------------ */
/* Shared by the scenes below.                                                                */
/* ------------------------------------------------------------------------------------------ */

/** How long a card takes to fade out (globals.css); its readout goes back to zero after that. */
const FADE_MS = 420;

/** Sets or clears [data-on]; true when it changed. */
function setOn(node: HTMLElement, on: boolean) {
  if (on === "on" in node.dataset) return false;
  if (on) node.dataset.on = "";
  else delete node.dataset.on;
  return true;
}

/**
 * Linking: hovering or focusing a [data-link] element (a card, or its number marker on the figure)
 * lights that pair and nothing else. Returns the cleanup.
 */
function linkHighlights(el: HTMLElement): () => void {
  const links = [...el.querySelectorAll<HTMLElement>("[data-link]")];
  if (!links.length) return () => {};
  const light = (k: string | null) => {
    for (const n of links) n.classList.toggle("is-hl", k !== null && n.dataset.link === k);
  };
  const linkOf = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>("[data-link]") : null);
  const over = (e: Event) => {
    const n = linkOf(e.target);
    if (n) light(n.dataset.link ?? null);
  };
  const out = (e: Event) => {
    const from = linkOf(e.target);
    const to = linkOf((e as PointerEvent | FocusEvent).relatedTarget);
    if (from && from !== to) light(to?.dataset.link ?? null);
  };
  el.addEventListener("pointerover", over);
  el.addEventListener("pointerout", out);
  el.addEventListener("focusin", over);
  el.addEventListener("focusout", out);
  return () => {
    el.removeEventListener("pointerover", over);
    el.removeEventListener("pointerout", out);
    el.removeEventListener("focusin", over);
    el.removeEventListener("focusout", out);
    light(null);
  };
}

/** Jev computing: a card's [data-count-to] digits run up from zero as it switches on. */
function readouts() {
  const jobs = new Map<HTMLElement, { raf: number; timer: number }>();
  const fields = (node: HTMLElement) => [...node.querySelectorAll<HTMLElement>("[data-count-to]")];
  const places = (v: HTMLElement) => (v.dataset.countTo ?? "").split(".")[1]?.length ?? 0;
  const stop = (v: HTMLElement) => {
    const job = jobs.get(v);
    if (!job) return;
    cancelAnimationFrame(job.raf);
    clearTimeout(job.timer);
    jobs.delete(v);
  };
  return {
    /** Runs the card's digits from zero up to their value. */
    run(node: HTMLElement) {
      for (const v of fields(node)) {
        stop(v);
        const to = Number(v.dataset.countTo);
        const n = places(v);
        const t0 = performance.now() + 90;
        const job = { raf: 0, timer: 0 };
        const frame = (now: number) => {
          const k = clamp01((now - t0) / 600);
          v.textContent = (to * (1 - (1 - k) ** 3)).toFixed(n);
          job.raf = k < 1 ? requestAnimationFrame(frame) : 0;
        };
        v.textContent = (0).toFixed(n);
        job.raf = requestAnimationFrame(frame);
        jobs.set(v, job);
      }
    },
    /** Puts the card's digits back to zero once it has faded out, ready to count again. */
    zero(node: HTMLElement) {
      for (const v of fields(node)) {
        stop(v);
        jobs.set(v, { raf: 0, timer: window.setTimeout(() => (v.textContent = (0).toFixed(places(v))), FADE_MS) });
      }
    },
    /** Stops everything and leaves every value as the server wrote it. */
    restore(nodes: HTMLElement[]) {
      [...jobs.keys()].forEach(stop);
      for (const node of nodes) for (const v of fields(node)) v.textContent = v.dataset.countTo ?? "";
    },
  };
}

/* ------------------------------------------------------------------------------------------ */
/* ScanScene: Jev reads a contract, driven by scroll. Scrolling back up plays it in reverse.   */
/* ------------------------------------------------------------------------------------------ */

type ScanTiming = { pages: number; flags: number[]; duration: number; pause: number };

type ScanProps = {
  children: ReactNode;
  className?: string;
  tick?: string;
  label?: string;
  /** Hairline mode: step k (card k and its marker) is on while progress is at least thresholds[k]. */
  thresholds?: number[];
  /**
   * Placeholder mode: contract length, the pages with a flagged clause, and the reading's length
   * and its pause on each flag, in ms of reading (progress 1 = the whole reading).
   */
  pages?: number;
  flags?: number[];
  duration?: number;
  pause?: number;
};

type ScanState = { phase: "flip" | "pause" | "done"; page: number; found: number; flag: number; t: number };

/** Where the reading is at progress p: flipping toward the next flag, paused on one, or done. */
function scanAt(p: number, { pages, flags, duration, pause }: ScanTiming): ScanState {
  const t = p * duration;
  if (p >= 1) return { phase: "done", page: pages, found: flags.length, flag: -1, t };
  const flipTime = duration - flags.length * pause;
  const stepTime = flipTime / (pages - 1);
  let time = 0;
  let cur = 1;
  for (let k = 0; k <= flags.length; k++) {
    const target = k < flags.length ? flags[k] : pages;
    const d = (target - cur) * stepTime;
    if (t < time + d) return { phase: "flip", page: cur + Math.floor((t - time) / stepTime), found: k, flag: -1, t };
    time += d;
    if (k === flags.length) break;
    if (t < time + pause) return { phase: "pause", page: target, found: k + 1, flag: k, t };
    time += pause;
    cur = target;
  }
  return { phase: "done", page: pages, found: flags.length, flag: -1, t };
}

/** Below this width the figure and cards stack, and only the figure pins (globals.css). */
const STACKED = "(max-width: 900px)";
/** Stacked: a card switches on as its top crosses this share of the screen's height. */
const CARD_LINE = 0.8;

/** Piecewise linear: as y falls through the knots [y, p] (y descending), p rises. */
function along(knots: [number, number][], y: number) {
  if (y >= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) {
    const [ya, pa] = knots[i - 1];
    const [yb, pb] = knots[i];
    if (y >= yb) return ya - yb < 1e-6 ? pb : pa + ((ya - y) / (ya - yb)) * (pb - pa);
  }
  return knots[knots.length - 1][1];
}

/**
 * One progress number, 0 to 1 (1 = rest pose), read from the scroll position on every frame and
 * handed to the FigureSlot's driver. Cards and markers carry [data-step] (their flag index) and are
 * on while progress is past their flag; a card's readout counts up as it switches on. Wide screens
 * pin [data-track] (the frame's heading, figure and cards) while the page scrolls through
 * [data-runway], the empty block right after it. Stacked screens pin only the figure, and each
 * [data-card] switches on as it scrolls into view below it.
 */
export function ScanScene({ children, className, tick, label, thresholds, pages = 1, flags = [], duration = 1, pause = 0 }: ScanProps) {
  const ref = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const slot = el.querySelector<HTMLElement>("[data-figure-slot]");
    const driver: FigureDriver | null = slot ? attachFigure(slot) : null;
    const off: (() => void)[] = [linkHighlights(el)];
    const cleanup = () => off.forEach((f) => f());

    // Number markers ride on the figure's flags: just left of each flag's box, at its top edge.
    const markers = [...el.querySelectorAll<HTMLElement>("[data-marker]")];
    const placeMarkers = () => {
      if (!slot) return;
      for (const mk of markers) {
        const part = figurePart(slot, mk.dataset.marker ?? "");
        if (!part) continue;
        mk.style.setProperty("--x", part.x0.toFixed(4));
        mk.style.setProperty("--y", part.y0.toFixed(4));
      }
    };
    window.addEventListener("resize", placeMarkers);
    off.push(() => window.removeEventListener("resize", placeMarkers));

    if (!motionAllowed()) {
      // At rest: place the markers once the figure has mounted.
      const timers = [250, 800, 1800].map((ms) => window.setTimeout(placeMarkers, ms));
      off.push(() => timers.forEach(clearTimeout));
      return cleanup;
    }

    const track = el.querySelector<HTMLElement>("[data-track]");
    const runway = el.querySelector<HTMLElement>("[data-runway]");
    const steps = [...el.querySelectorAll<HTMLElement>("[data-step]")];
    const cards = [...el.querySelectorAll<HTMLElement>("[data-card]")];
    const counter = el.querySelector<HTMLElement>("[data-page-counter]");
    const stacked = window.matchMedia(STACKED);
    const timing: ScanTiming = { pages, flags, duration, pause };
    // each card's place on the progress line: its flag's threshold
    const at = thresholds ?? flags.map((_, k) => (k + 1) / (flags.length + 1));
    const digits = readouts();
    el.dataset.armed = "";

    /** Scroll progress, measured from where the track would sit without its pin. */
    const progress = () => {
      if (!track || !runway) return 1;
      const vh = window.innerHeight;
      const h = track.offsetHeight;
      const room = runway.getBoundingClientRect();
      const y = room.top - h;
      if (!stacked.matches) {
        // pinned mid-screen (or by its foot, when taller than the screen) for the runway's length;
        // the scan starts a little before the pin and lands before it lets go
        const top = h <= vh ? (vh - h) / 2 : vh - h;
        track.style.top = `${top}px`;
        const y0 = top + vh * 0.2;
        const y1 = top - room.height * 0.85;
        return clamp01((y0 - y) / (y0 - y1));
      }
      track.style.top = "";
      if (!cards.length) return 1;
      // card k reaches its threshold as its top crosses the line; the run-up before the first card
      // and the run-out after the last keep the pace between them
      const ys = cards.map((c) => vh * CARD_LINE - (c.getBoundingClientRect().top - y));
      const n = ys.length;
      const pace = n > 1 ? (ys[0] - ys[n - 1]) / Math.max(1e-3, at[n - 1] - at[0]) : vh;
      const knots: [number, number][] = [
        [ys[0] + at[0] * pace, 0],
        ...ys.map((yk, k): [number, number] => [yk, at[k]]),
        [ys[n - 1] - (1 - at[n - 1]) * pace, 1],
      ];
      return along(knots, y);
    };

    /** The step a keyboard reader is on shows whatever the scroll says. */
    const heldStep = () => {
      const a = document.activeElement;
      return a instanceof HTMLElement && a.matches(":focus-visible") ? a.closest<HTMLElement>("[data-step]")?.dataset.step : undefined;
    };
    const turn = (node: HTMLElement, on: boolean) => {
      if (!setOn(node, on)) return;
      if (on) digits.run(node);
      else digits.zero(node);
    };
    const apply = (p: number) => {
      driver?.setProgress(p);
      el.style.setProperty("--p", p.toFixed(4));
      const held = heldStep();
      if (thresholds) {
        for (const node of steps) turn(node, node.dataset.step === held || p >= (thresholds[Number(node.dataset.step)] ?? 1));
        return;
      }
      const s = scanAt(p, timing);
      el.dataset.scan = p > 0 ? s.phase : "idle";
      el.dataset.flag = String(s.flag);
      el.dataset.v = String(Math.floor(s.page / 3) % 3);
      el.style.setProperty("--band", s.phase === "flip" ? ((s.t / 560) % 1).toFixed(3) : "0");
      for (const node of steps) turn(node, node.dataset.step === held || Number(node.dataset.step) < s.found);
      if (counter) counter.textContent = `p. ${s.page} of ${pages}`;
    };

    let raf = 0;
    let follow = 0;
    let followUntil = 0;
    // The figure eases on its own spring after the scroll stops; keep the markers on it meanwhile.
    const followFrame = (now: number) => {
      placeMarkers();
      follow = now < followUntil ? requestAnimationFrame(followFrame) : 0;
    };
    const update = () => {
      raf = 0;
      apply(progress());
      placeMarkers();
      followUntil = performance.now() + 1400;
      if (!follow) follow = requestAnimationFrame(followFrame);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    el.addEventListener("focusin", onScroll);
    el.addEventListener("focusout", onScroll);
    off.push(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      el.removeEventListener("focusin", onScroll);
      el.removeEventListener("focusout", onScroll);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(follow);
      // leave the frame as the server drew it, so a re-run starts clean
      digits.restore(steps);
      for (const node of steps) setOn(node, false);
      delete el.dataset.armed;
      if (track) track.style.top = "";
    });
    return cleanup;
  }, [thresholds?.join(","), pages, flags.join(","), duration, pause]);

  return (
    <section ref={ref} className={className} data-tickmark={tick} aria-label={label} data-scene="">
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* PlayScene: frame 3 (and frame 6 with Figure D). Plays when its start block comes into view,  */
/* resets once the frame has left the screen, and plays again when the reader comes back.      */
/* ------------------------------------------------------------------------------------------ */

type PlayProps = {
  children: ReactNode;
  className?: string;
  tick?: string;
  label?: string;
  /** The figure's playback, 0 to 1, in ms. */
  duration: number;
  /** Step k ([data-step]) switches on once progress passes thresholds[k]. */
  thresholds?: number[];
  /**
   * Frame 3: the window, as fractions of `duration`, in which the [data-mark] marks land one by one,
   * in order, while [data-tally] shows the share of all runs that the landed marks got right.
   */
  tally?: [number, number];
};

/**
 * Puts frame 3's marks where markSpot (figure-config.ts) says: under Figure C's case once it has
 * mounted, under the slot's width before that. The row learns the span too, to size its marks.
 */
function placeMarks(slot: HTMLElement | null, row: HTMLElement | null, marks: HTMLElement[]) {
  const span = (slot ? figurePart(slot, "case") : null) ?? C_MARKS_FALLBACK;
  row?.style.setProperty("--x0", span.x0.toFixed(4));
  row?.style.setProperty("--x1", span.x1.toFixed(4));
  marks.forEach((m, k) => {
    const at = markSpot(k, marks.length, span);
    m.style.setProperty("--x", at.x.toFixed(4));
    m.style.setProperty("--y", at.y.toFixed(4));
  });
}

/**
 * Plays the scene once its start block is in view: the [data-play-start] element, else the
 * figure, else the whole frame (a frame taller than two screens needs [data-play-start], or it
 * never shows enough of itself to play). Progress runs linearly over `duration` to the
 * FigureSlot's driver, steps switch on at their thresholds, and the marks land over the tally
 * window. Once the whole frame has left the screen it goes back to its start, unseen, so it plays
 * again on the way back. On screen at load, it stays at rest until it has been away. Fires
 * "sceneplay" and "scenereset" for the CountUps inside.
 */
export function PlayScene({ children, className, tick, label, duration, thresholds = [], tally }: PlayProps) {
  const ref = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const slot = el.querySelector<HTMLElement>("[data-figure-slot]");
    const driver: FigureDriver | null = slot ? attachFigure(slot) : null;
    const row = el.querySelector<HTMLElement>("[data-marks]");
    const marks = [...el.querySelectorAll<HTMLElement>("[data-mark]")];
    const off: (() => void)[] = [];
    const cleanup = () => off.forEach((f) => f());

    // The marks follow the case: place them now, again once the figure has mounted, and on resize.
    if (marks.length) {
      const place = () => placeMarks(slot, row, marks);
      place();
      const timers = [250, 800, 1800].map((ms) => window.setTimeout(place, ms));
      window.addEventListener("resize", place);
      off.push(() => {
        timers.forEach(clearTimeout);
        window.removeEventListener("resize", place);
      });
    }
    if (!motionAllowed()) return cleanup;

    const steps = [...el.querySelectorAll<HTMLElement>("[data-step]")];
    const score = el.querySelector<HTMLElement>("[data-tally]");
    const right = marks.map((m) => Number(m.dataset.right));
    const runs = marks.reduce((s, m) => s + Number(m.dataset.runs), 0);
    const [ta, tb] = tally ? [tally[0] * duration, tally[1] * duration] : [Infinity, Infinity];
    const gap = marks.length > 1 ? (tb - ta) / (marks.length - 1) : 1;
    let landed = -1;

    /** The scene at t ms into its playback (negative: before it). */
    const pose = (t: number) => {
      const p = clamp01(t / duration);
      driver?.setProgress(p);
      for (const node of steps) setOn(node, p >= (thresholds[Number(node.dataset.step)] ?? 1));
      const n = t < ta ? 0 : Math.min(marks.length, Math.floor((t - ta) / gap) + 1);
      if (n === landed) return;
      landed = n;
      marks.forEach((m, k) => setOn(m, k < n));
      if (score) {
        // the runs right so far, out of every run; the last mark lands on the published figure
        const sum = right.slice(0, n).reduce((s, r) => s + r, 0);
        score.textContent = n >= marks.length ? (score.dataset.tally ?? "") : String(Math.round((100 * sum) / runs));
      }
    };

    let armed = false;
    let raf = 0;
    const arm = () => {
      armed = true;
      cancelAnimationFrame(raf);
      el.dataset.armed = "";
      driver?.jump(0);
      pose(-1);
      el.dispatchEvent(new CustomEvent("scenereset"));
    };
    const play = () => {
      armed = false;
      el.dispatchEvent(new CustomEvent("sceneplay", { detail: { duration } }));
      const t0 = performance.now();
      const end = Math.max(duration, tally ? tb : 0);
      const frame = (now: number) => {
        const t = now - t0;
        pose(t);
        if (t < end) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };

    const start = el.querySelector<HTMLElement>("[data-play-start]") ?? slot ?? el;
    if (start.getBoundingClientRect().top >= window.innerHeight * 0.55) arm();
    const enter = new IntersectionObserver(
      (entries) => {
        if (armed && entries.some((e) => e.isIntersecting)) play();
      },
      { threshold: 0.45 },
    );
    const leave = new IntersectionObserver((entries) => {
      if (!armed && entries.every((e) => !e.isIntersecting)) arm();
    });
    enter.observe(start);
    leave.observe(el);
    off.push(() => {
      enter.disconnect();
      leave.disconnect();
      cancelAnimationFrame(raf);
      // leave the frame as the server drew it, so a re-run starts clean
      for (const node of [...steps, ...marks]) setOn(node, false);
      if (score) score.textContent = score.dataset.tally ?? "";
      delete el.dataset.armed;
      driver?.setProgress(1);
    });
    return cleanup;
  }, [duration, thresholds.join(","), tally?.[0], tally?.[1]]);

  return (
    <section ref={ref} className={className} data-tickmark={tick} aria-label={label} data-scene="">
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Reveal and CountUp: entrances for the later frames, replayed each time they come back.     */
/* ------------------------------------------------------------------------------------------ */

/**
 * Lays out the reviewer's pen inside `el` (drawPen) now, once the fonts have loaded, and whenever
 * the block changes size. The strokes' drawing is left to CSS. Returns the cleanup.
 */
function layPen(el: HTMLElement): () => void {
  let live = true;
  const draw = () => live && drawPen(el);
  draw();
  const resize = new ResizeObserver(draw);
  resize.observe(el);
  void document.fonts?.ready.then(draw);
  return () => {
    live = false;
    resize.disconnect();
  };
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** The block's data-tickmark id. */
  tick?: string;
  /** The block holds a reviewer's pen ([data-pen-svg], [data-pen], [data-pen-to]) to lay out. */
  pen?: boolean;
  /** How far above the screen's foot the block's top must rise before it plays, as a share of the screen. */
  lift?: number;
  /** The element to render (a div by default). */
  as?: "div" | "article" | "p";
};

/**
 * Plays a block's entrance when it scrolls into view, and again whenever it comes back after
 * leaving the screen. The block's CSS describes the start state under [data-reveal="pre"] and the
 * transitions under [data-reveal="in"]. On screen at load, it starts at rest. A pen inside is laid
 * out with or without motion, so reduced-motion readers see it drawn.
 */
export function Reveal({ children, className, tick, pen = false, lift = 0.22, as = "div" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const unpen = pen ? layPen(el) : () => {};
    if (!motionAllowed()) return unpen;
    if (el.getBoundingClientRect().top >= window.innerHeight * 0.85) el.dataset.reveal = "pre";
    let frame = 0;
    const enter = new IntersectionObserver(
      (entries) => {
        if (el.dataset.reveal !== "pre" || !entries.some((e) => e.isIntersecting)) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => (el.dataset.reveal = "in"));
      },
      { rootMargin: `0px 0px -${Math.round(lift * 100)}% 0px` },
    );
    // gone from the screen: back to the start state, unseen (no transitions run under "pre")
    const leave = new IntersectionObserver((entries) => {
      if (!entries.every((e) => !e.isIntersecting)) return;
      cancelAnimationFrame(frame);
      el.dataset.reveal = "pre";
    });
    enter.observe(el);
    leave.observe(el);
    return () => {
      unpen();
      enter.disconnect();
      leave.disconnect();
      cancelAnimationFrame(frame);
      delete el.dataset.reveal;
    };
  }, [pen, lift]);
  return createElement(as, { ref, className, "data-tickmark": tick }, children);
}

/**
 * A whole number inside a PlayScene that counts up from `from` (0 by default) over the window `at`
 * of the scene's playback (fractions of its duration), and goes back to `from` when the scene
 * resets. Outside a scene, or under reduced motion, it just shows its value.
 */
export function CountUp({ value, at, from = 0 }: { value: number; at: [number, number]; from?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    const scene = el?.closest<HTMLElement>("[data-scene]");
    if (!el || !scene || !motionAllowed()) return;
    let raf = 0;
    let timer = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    const count = (ms: number) => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const k = clamp01((now - t0) / ms);
        el.textContent = String(Math.round(from + (value - from) * (1 - (1 - k) ** 3)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const onPlay = (e: Event) => {
      const d = (e as CustomEvent<{ duration: number }>).detail.duration;
      stop();
      timer = window.setTimeout(() => count(Math.max(1, (at[1] - at[0]) * d)), at[0] * d);
    };
    const onReset = () => {
      stop();
      el.textContent = String(from);
    };
    scene.addEventListener("sceneplay", onPlay);
    scene.addEventListener("scenereset", onReset);
    return () => {
      scene.removeEventListener("sceneplay", onPlay);
      scene.removeEventListener("scenereset", onReset);
      stop();
      el.textContent = String(value);
    };
  }, [value, from, at[0], at[1]]);
  return (
    <span ref={ref} className="num">
      {value}
    </span>
  );
}
