// Drawn with the hairline engine (hairline-kernel.js; MIT, Lucas Marques) in my private drawing workspace
// at 41a025f. This file is covered by the repo's MIT license (see NOTICE).
import { HL } from "./hairline-kernel.js";
const hairline = (figure) => figure;
/**
 * Training pair: a clause slip and an exact copy of it, side by side on the desk. Both carry the
 * same text skeleton line for line, the finance page's clause slip (Figures A and B). On line 2, a
 * short block holds the fact that decides the label. The number is scroll progress: the copy
 * slides out from behind the original, then its fact block shrinks and takes the bright mark, so
 * the eye compares the two blocks by place and length. At rest, over either slip, the pointer
 * raises both blocks a little on dashed drops, to invite the comparison; the bright stays put.
 *
 * The pattern: one continuous input on a spring, staged across its range; a class change at a
 * threshold, which the engine fades; tweens for the pointer's lift; hit areas at the rest pose.
 */
const {
  Cam, clamp, extremes, facing, fit, hull, lerp, open, poly, proj, ringAt, rrect, run, seg,
  spring, stepS, tdone, tset, tval, tween, reducedMotion, disposer, mk, pointer, register,
} = HL;

// the slip, as on the finance page: a text measure ME at pitch LS, plus 3 a side and 3.4 above and below; corner 2.4, 1.3 thick
const ME = 68, LS = 5, PU = 3, PV = 3.4, HEAD = 9, GAP = 2.6, SK = 1.3;
const LEN = ME + 2 * PU, DEP = 2 * LS + 2 * PV, V = [PV, PV + LS, PV + 2 * LS];
// the lines: a heading stub and the rest of line 1; line 2 up to the fact; a short line 3
const TEXT = [[PU, PU + HEAD, V[0]], [PU + HEAD + GAP, PU + ME, V[0]], [PU, PU + 41 - GAP, V[1]], [PU, PU + ME * 0.42, V[2]]];
// the fact: a block ending line 2, from u C0; as long as LONG on the original, SHORT on the copy; half its height CH
const C0 = PU + 41, LONG = 22, SHORT = 11, CH = 1.6, CK = 0.8;
// the copy ends OFF behind the original; staging on progress
const OFF = 27, SLIDE = [0.05, 0.5], SHRINK = [0.55, 0.88], LIT = 0.68;
// the pointer: both facts lift, the one under it first; read-outs, original then copy
const LIFT = 2.6, STEP = 45, SAY = ["in range", "below"];

const ss = (a, b, q) => { const t = clamp((q - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const slipAt = (y0) => rrect(0, y0, LEN, y0 + DEP, 2.4, 4);
const factAt = (y0, len) => rrect(C0, y0 + V[1] - CH, C0 + len, y0 + V[1] + CH, 1.5, 4);

/** Whether a screen point lies inside a convex outline, whichever way round it runs. */
function inside(pts, [x, y]) {
  let s = 0;
  for (let k = 0; k < pts.length; k++) {
    const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % pts.length];
    const c = Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax));
    if (c && s && c !== s) return false;
    if (c) s = c;
  }
  return true;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const want = (v) => (reducedMotion() ? 1 : clamp(Number(v) || 0, 0, 1));
  const sp = spring(want(value), { eps: 0.0005 }), lifts = [tween(0), tween(0)];

  // fitted to both slips at rest, with both facts lifted under the pointer; centred high, so the page's prices go below
  const C = Cam(45, 0.5, 4.3), zMax = SK + LIFT + CK;
  fit(C, [[0, 0, 0], [LEN, 0, 0], [0, OFF + DEP, 0], [LEN, OFF + DEP, 0], [0, 0, zMax], [LEN, 0, zMax], [LEN, OFF + DEP, SK]], 200, 150);
  const P = proj(C), front = facing(C);

  // the copy first: it lies behind the original, so the original covers it while they overlap.
  // data-part names the slips and their facts for the page's live anchors
  const g = mk("g", {}, svg);
  const part = (name) => {
    const el = mk("g", { "data-part": name }, g);
    return {
      body: mk("path", { class: "sil" }, el), edge: mk("path", { class: "nf lo" }, el), text: mk("path", { class: "nf" }, el),
      guide: mk("path", { class: "nf dash" }, el), fact: mk("path", { class: "", "data-part": "fact-" + name }, el),
      top: mk("path", { class: "nf lo" }, el), slip: null, f: null,
    };
  };
  const copy = part("copy"), orig = part("original");

  /** A slip at y0, its lines on top; "" hides it. */
  function drawSlip(s, y0, show) {
    const key = show ? String(y0) : "";
    if (key === s.slip) return;
    s.slip = key;
    const r = slipAt(y0);
    s.body.setAttribute("d", show ? poly(hull(ringAt(P, r, 0).concat(ringAt(P, r, SK)))) : "");
    s.edge.setAttribute("d", show ? open(ringAt(P, run(r, front), SK)) : "");
    s.text.setAttribute("d", show ? TEXT.map(([u0, u1, v]) => seg(P(u0, y0 + v, SK), P(u1, y0 + v, SK))).join("") : "");
  }

  /** A fact block of length len, lifted h: seated, a flat outline on the slip; lifted, a thin plate on dashed drops over its seat. */
  function drawFact(s, y0, len, h, show) {
    const key = show ? [y0, len, h].join() : "";
    if (key === s.f) return;
    s.f = key;
    const c = factAt(y0, len), up = show && h > 0.05, z0 = SK + h, z1 = z0 + Math.min(h, CK);
    s.guide.setAttribute("d", up ? poly(ringAt(P, c, SK)) + extremes(P, c).map((e) => seg(P(e.u, e.v, SK), P(e.u, e.v, z0))).join("") : "");
    s.fact.setAttribute("d", show ? poly(hull(ringAt(P, c, z0).concat(ringAt(P, c, z1)))) : "");
    s.top.setAttribute("d", up ? open(ringAt(P, run(c, front), z1)) : "");
  }

  let lit = null;
  const B = register(stage, (dt, now) => {
    if (reducedMotion()) sp.t = 1; // the loop knows the reader's setting only once it runs: rest, whatever the page says
    const m = stepS(sp, dt);
    if (!m) sp.x = sp.t; // landed: draw the pose asked for, exactly
    const q = sp.x, s = ss(...SLIDE, q), yc = OFF * (1 - s), out = s > 0.002;
    drawSlip(orig, OFF, true);
    drawSlip(copy, yc, out);
    drawFact(orig, OFF, LONG, tval(lifts[0], now), true);
    drawFact(copy, yc, lerp(LONG, SHORT, ss(...SHRINK, q)), tval(lifts[1], now), out);
    // the copy's fact takes the bright once it differs; the original's never does
    if ((q >= LIT) !== lit) { lit = q >= LIT; copy.fact.classList.toggle("hi", lit); }
    return m || !tdone(lifts[0], now) || !tdone(lifts[1], now);
  });
  bag.add(B.unregister);

  // hit areas: each slip at rest. The facts lift out of them and never move them.
  const areas = [OFF, 0].map((y0) => { const r = slipAt(y0); return hull(ringAt(P, r, 0).concat(ringAt(P, r, SK))); });
  const hit = (p) => areas.findIndex((a) => inside(a, p));
  let act = -1;
  /** Lifts both facts, the one on the slip under the pointer first, or lets them down. */
  function choose(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    lifts.forEach((tw, i) => tset(tw, a >= 0 ? LIFT : 0, now, Math.abs(i - from) * STEP));
    read.textContent = a >= 0 ? SAY[a] : "rest";
    B.wake();
  }

  read.textContent = "rest";
  bag.add(pointer(stage, { move: (p) => choose(sp.t >= LIT ? hit(p) : -1), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    // scroll progress, as often as the page likes: the spring eases to it and the loop sleeps once it lands
    set: (v) => {
      v = want(v);
      if (v === sp.t) return;
      sp.t = v;
      if (v < LIT) choose(-1);
      B.wake();
    },
    destroy: bag.dispose,
  };
}

export default hairline({
  name: "training-pair",
  means: "A clause and its copy: the copy slides out, and the one fact that differs on it lights. The number is scroll progress.",
  rules: [4, 5, 6, 8],
  range: [0, 1, 1],
  mount,
});
