// Drawn with the hairline engine (hairline-kernel.js; MIT, Lucas Marques) in my private drawing workspace
// at 41a025f. This file is covered by the repo's MIT license (see NOTICE).
import { HL } from "./hairline-kernel.js";
const hairline = (figure) => figure;
/**
 * Contract page: a contract of some 120 pages as one thick rounded stack, page edges on its sides
 * and a cover on top. One page slides partway out toward the reader; on it, clause blocks of line
 * skeletons. One of them, a two-line sentence, is the one bright mark: cut from the page as a slip
 * and raised on dashed drops over the cut it leaves, as in Figure B. The number is scroll progress:
 * the stack builds up, the page slides out, the other clauses dim, and the sentence lights and
 * rises. Over the raised slip, the pointer lifts it further and lights its lines outward from it.
 *
 * The pattern: one continuous input on a spring, staged across its range; class changes at
 * thresholds, which the engine fades; a hit test on the sentence's outline at its target pose.
 */
const {
  Cam, clamp, extremes, facing, fit, hull, lerp, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg,
  spring, stepS, tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

// the stack: letter-proportioned pages, W across and D deep, from a few sheets thick to the whole contract,
// with dense page edges at slightly uneven heights round its sides
const W = 84, D = 112, T0 = 3, T1 = 62, ZP = 0.34, TK = 0.7, EDGES = Array.from({ length: 26 }, (_, k) => 1.4 + k * 2.3 + 0.5 * Math.sin(k * 2.7));
// the page that slides out: how far, and how far it turns about the stack's front corner
const OUT = 70, TURN = -4;
// the type: margin, line pitch, heading stub; clause blocks [first line, lines, last line's share]; PS is the sentence
const M = 8, LS = 5, HEAD = 9, PARA = [[8, 4, 0.55], [32, 3, 0.4], [52, 3, 0.75], [72, 2, 0.3], [87, 3, 0.6]], PS = 3;
// staging on progress: build, slide, dim, light and rise
const BUILD = [0, 0.3], SLIDE = [0.3, 0.7], FADE = 0.68, LIT = 0.72, RISE = [0.72, 0.9];
// the slip: its thickness and its rise once lit (Figure B's), the pointer's further lift, the stagger step in ms
const SK = 1.3, UP = 6, HOVER = 4, STEP = 45;

const ss = (a, b, q) => { const t = clamp((q - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const at = (share) => M + (W - 2 * M) * share;

/** The page slid out by t (0 in, 1 out), turned about the stack's front corner: page (u, v) to world [x, y]. */
function pose(t) {
  const th = rad(TURN * t), c = Math.cos(th), s = Math.sin(th), dy = OUT * t;
  return { c, s, f: (u, v) => [W + (u - W) * c - (v - D + dy) * s, D + (u - W) * s + (v - D + dy) * c] };
}

/** A ring in page units, carried to the world by a pose, its normals too, so `front` still reads it. */
const carry = ({ c, s, f }, ring) => ring.map((p) => {
  const [x, y] = f(p.u, p.v);
  return { u: x, v: y, nu: p.nu * c - p.nv * s, nv: p.nu * s + p.nv * c };
});

/** The part of a world ring in front of the stack's front face (y > D), none before it moves; the cut faces back into the stack. */
function outside(ring) {
  const out = [];
  ring.forEach((a, k) => {
    const b = ring[(k + 1) % ring.length], ia = a.v > D + 1e-6;
    if (ia) out.push(a);
    if (ia !== b.v > D + 1e-6) out.push({ u: lerp(a.u, b.u, (D - a.v) / (b.v - a.v)), v: D, nu: 0, nv: -1 });
  });
  return out;
}

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

/** A clause block's strokes in page units [u0, u1, v]: a heading stub, a gap, the rest of the line; the last line short. */
function block([v0, n, last]) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const v = v0 + k * LS, u1 = k === n - 1 ? at(last) : W - M;
    if (k === 0) out.push([M, M + HEAD, v], [M + HEAD + 2.6, Math.max(u1, M + HEAD + 10), v]);
    else out.push([M, u1, v]);
  }
  return out;
}
const others = PARA.filter((_, p) => p !== PS).flatMap(block), strokes = block(PARA[PS]);
const [v0, nl] = PARA[PS], SLIP = rrect(M - 3, v0 - 3.4, W - M + 3, v0 + (nl - 1) * LS + 3.4, 2.4, 4);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const sp = spring(clamp(Number(value) || 0, 0, 1), { eps: 0.0005 }), hov = tween(0);

  // fitted to the poses that occur: the whole stack, the page all the way out at its slot, the slip lifted under the pointer
  const C = Cam(45, 0.5, 1.85), fin = pose(1), zMax = T1 * ZP + TK + UP + HOVER + SK, sc = [[M - 3, v0 - 3.4], [W - M + 3, v0 + 8.4]];
  fit(C, [[0, 0, 0], [W, 0, 0], [0, D, 0], [W, D, 0], [0, 0, T1], [W, 0, T1], [0, D, T1], [W, D, T1]]
    .concat([[0, D], [W, D]].map(([u, v]) => [...fin.f(u, v), T1 * ZP]), sc.flatMap(([u]) => sc.map(([, v]) => [...fin.f(u, v), zMax]))), 200, 166);
  const P = proj(C), front = facing(C);
  const [ring, inner] = rings(0, 0, W, D, 1.6, 1.4), fr = run(ring, front), sheet = rrect(0, 0, W, D, 1.2, 3);

  /** A segment between two world points at height z, cut to its part in front of the stack; "" when none is. */
  function cut(a, b, z) {
    if (a[1] < D && b[1] < D) return "";
    if (a[1] < D) a = [lerp(a[0], b[0], (D - a[1]) / (b[1] - a[1])), D];
    else if (b[1] < D) b = [lerp(b[0], a[0], (D - b[1]) / (a[1] - b[1])), D];
    return seg(P(a[0], a[1], z), P(b[0], b[1], z));
  }

  // paint order: the stack and what is on it, then the page in front of it, then the slip's guides, the slip, its lines
  const g = mk("g", {}, svg), stack = solid(g);
  const edges = mk("path", { class: "nf lo" }, g), title = mk("path", { class: "nf" }, g), sub = mk("path", { class: "nf lo" }, g);
  const page = mk("path", { class: "sil", "data-part": "page" }, g), thick = mk("path", { class: "nf lo" }, g), text = mk("path", { class: "nf" }, g);
  const guide = mk("path", { class: "nf dash" }, g), slip = mk("path", { class: "sil hi", "data-part": "sentence" }, g), edge = mk("path", { class: "nf lo" }, g);
  const ws = strokes.map(([u0, u1, v]) => ({ u0, u1, v, el: mk("path", { class: "nf" }, g), t: tween(0) }));

  let dq = NaN, dh = NaN, faded = null;
  function draw(q, lift) {
    const T = lerp(T0, T1, ss(...BUILD, q)), zt = T * ZP + TK, pz = pose(ss(...SLIDE, q)), f = pz.f;
    put(stack, prism(P, front, ring, inner, 0, T));
    edges.setAttribute("d", EDGES.filter((z) => z < T - 1.5 && Math.abs(z - zt) > 1.4).map((z) => open(ringAt(P, fr, z))).join(""));
    title.setAttribute("d", seg(P(W / 2 - 16, 15, T), P(W / 2 + 16, 15, T)));
    sub.setAttribute("d", seg(P(W / 2 - 23, 21, T), P(W / 2 + 23, 21, T)));
    // the page: its outline turned and slid, cut where it goes into the stack
    const wr = outside(carry(pz, sheet));
    page.setAttribute("d", wr.length > 2 ? poly(hull(ringAt(P, wr, zt - TK).concat(ringAt(P, wr, zt)))) : "");
    thick.setAttribute("d", wr.length > 2 ? open(ringAt(P, run(wr, front), zt)) : "");
    text.setAttribute("d", others.map(([u0, u1, v]) => cut(f(u0, v), f(u1, v), zt)).join(""));
    // the sentence: seated in the text until lit; then a slip rising on dashed drops over its cut, more under the pointer
    const h = q >= LIT ? UP * ss(...RISE, q) + lift : 0, up = h > 0.05, sw = carry(pz, SLIP), z0 = zt + h, z1 = up ? z0 + SK : zt;
    guide.setAttribute("d", up ? poly(ringAt(P, sw, zt)) + extremes(P, sw).map((e) => seg(P(e.u, e.v, zt), P(e.u, e.v, z0))).join("") : "");
    slip.setAttribute("d", up ? poly(hull(ringAt(P, sw, z0).concat(ringAt(P, sw, z1)))) : "");
    edge.setAttribute("d", up ? open(ringAt(P, run(sw, front), z1)) : "");
    ws.forEach((w) => w.el.setAttribute("d", cut(f(w.u0, w.v), f(w.u1, w.v), z1)));
    dq = q; dh = lift;
  }

  /** The dimming and the sentence's lines, by threshold; the engine fades each change. Returns whether a line is still turning. */
  function paint(q, now) {
    if ((q >= FADE) !== faded) { faded = q >= FADE; text.classList.toggle("lo", faded); title.classList.toggle("lo", faded); }
    let moving = false;
    ws.forEach((w) => {
      const lit = q >= LIT, on = lit && tval(w.t, now) > 0.5;
      w.el.classList.toggle("hi", on); w.el.classList.toggle("sil", lit && !on);
      if (!tdone(w.t, now)) moving = true;
    });
    return moving;
  }

  const B = register(stage, (dt, now) => {
    const m = stepS(sp, dt), lift = tval(hov, now);
    if (!m) sp.x = sp.t; // landed: draw the pose asked for, exactly
    if (sp.x !== dq || lift !== dh) draw(sp.x, lift);
    return paint(sp.x, now) || m || !tdone(hov, now);
  });
  bag.add(B.unregister);

  // the hit area: the sentence at the target pose, from its cut to the slip at rest, which the pointer's lift leaves. It never follows the drawing.
  function target() {
    const q = sp.t, pz = pose(ss(...SLIDE, q)), zt = T1 * ZP + TK, sw = carry(pz, SLIP), top = zt + UP * ss(...RISE, q) + SK;
    const mids = ws.map((w) => { const [x, y] = pz.f((w.u0 + w.u1) / 2, w.v); return P(x, y, top); });
    return { area: hull(ringAt(P, sw, zt).concat(ringAt(P, sw, top))), mids };
  }
  let act = false, k0 = 0;
  /** Lifts the slip, or lets it down; its lines light one by one, outward from the one nearest the pointer. */
  function choose(on, p) {
    if (on) {
      const { mids } = target(), d = (m) => Math.hypot(m[0] - p[0], m[1] - p[1]);
      k0 = mids.reduce((b, m, k) => (d(m) < d(mids[b]) ? k : b), 0);
    }
    if (on === act) return;
    act = on;
    const now = performance.now();
    tset(hov, on ? HOVER : 0, now, 0);
    ws.forEach((w, k) => tset(w.t, on ? 1 : 0, now, Math.abs(k - k0) * STEP));
    read.textContent = on ? "add-on" : "rest";
    B.wake();
  }

  read.textContent = "rest";
  bag.add(pointer(stage, { move: (p) => choose(sp.t >= LIT && inside(target().area, p), p), leave: () => choose(false) }));
  bag.add(() => svg.replaceChildren());

  return {
    // scroll progress, as often as the page likes: the spring eases to it and the loop sleeps once it lands
    set: (v) => {
      v = clamp(Number(v) || 0, 0, 1); if (v === sp.t) return;
      sp.t = v;
      if (act && v < LIT) choose(false);
      B.wake();
    },
    destroy: bag.dispose,
  };
}

export default hairline({
  name: "contract-page",
  means: "A thick contract: one page slides out of the stack, and on it one sentence lights. The number is scroll progress.",
  rules: [4, 5, 8, 9],
  range: [0, 1, 1],
  mount,
});
