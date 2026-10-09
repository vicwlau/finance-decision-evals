// Drawn with the hairline engine (hairline-kernel.js; MIT, Lucas Marques) in my private drawing workspace
// at 41a025f. This file is covered by the repo's MIT license (see NOTICE).
import { HL } from "./hairline-kernel.js";
const hairline = (figure) => figure;
/**
 * Locked set: a long case with a glass lid, holding twenty clause cards on edge, filed like index
 * cards, their tabs in three positions. The number is scroll progress: the cards drop into the
 * case, nearest first; the lid swings shut over them; a swivel latch turns up across the seam on
 * the front, and as it lands its round seal takes the bright. Over the seal at rest, the pointer
 * tries the latch: it turns a little, lit, and holds.
 *
 * The pattern: one continuous input on a spring, staged across its range; the bright by threshold,
 * which the engine fades; a hit test on the latch's outline at rest.
 */
const {
  Cam, circ, clamp, facing, fillet, fit, hull, open, poly, proj, rad, ringAt, rrect, run, seg,
  spring, stepS, tdone, tset, tval, tween, reducedMotion, disposer, mk, pointer, register,
} = HL;

// the case: LX long, LY deep, HB tall, walls WT; the lid: T thick, a frame FW wide round its glass, open OPEN degrees
const LX = 130, LY = 40, HB = 26, WT = 2.4, RR = 5, T = 4.4, FW = 5, OPEN = 100;
// the cards: N on edge along x, PITCH apart, CW across and CH tall with a tab TW × TH; DROP is how high they start
const N = 20, X0 = 8, PITCH = 6, CW = 32, Y0 = (LY - CW) / 2, CH = 19, TH = 3.2, TW = 9, TABS = [3, 11.5, 20], ZF = 1.5, TK = 0.8, DROP = 17;
// the latch: a strap pivoted at (XC, ZH) on the front, SL to its seal; the seal SR round and SK proud; TRY the pointer's turn
const XC = LX / 2, ZH = HB - 7, SL = 6.5, SW = 1.9, ST = 0.9, SR = 4.8, SK = 1.5, TRY = 10;
// staging on progress: the drops (each DW long, nearest card first), the lid, the latch, and the seal lit
const DROPS = [0.04, 0.46], DW = 0.1, LID = [0.42, 0.68], LATCH = [0.66, 0.88], LIT = 0.88;

const ss = (a, b, q) => { const t = clamp((q - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());
const area = (pts) => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

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

/** The case, which never moves: `far` is painted before the cards, `near` after them; each entry is [d, class]. */
function tray(P, front, outer, inner) {
  const far = [
    [poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, HB)))), "sil"],
    [poly(ringAt(P, inner, HB)), "nf"],
    [open(ringAt(P, run(inner, (q) => !front(q)), ZF)), "nf lo"],
  ];
  const iF = LR(ringAt(P, run(inner, front), HB)), oT = LR(ringAt(P, run(outer, front), HB)), oB = LR(ringAt(P, run(outer, front), 0));
  const near = [
    [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), "fo"],
    [open(oT), "nf lo"],
    [open(iF), "nf"],
    [open([oT[0], ...oB, oT[oT.length - 1]]), "nf sil"],
  ];
  return { far, near };
}

/** Card k's outline in its own plane (u across, v up), its tab at one of three places. */
const card = (k) => {
  const t0 = TABS[k % 3];
  return fillet([[0, 0], [CW, 0], [CW, CH], [t0 + TW, CH], [t0 + TW, CH + TH], [t0, CH + TH], [t0, CH], [0, CH]], [1, 1, 2.4, 1.4, 1.8, 1.8, 1.4, 2.4]);
};
const LINES = [[3, CW - 3, CH - 5], [3, CW - 3, CH - 8.5], [3, CW - 12, CH - 12]];

/** The lid at th degrees from shut, turning on its back bottom edge: lid space (u along x, v from the hinge, w up through it) to world. */
const lidAt = (th) => {
  const c = Math.cos(rad(th)), s = Math.sin(rad(th));
  return { c, s, f: (u, v, w) => [u, v * c - w * s, HB + v * s + w * c] };
};

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const sp = spring(clamp(Number(value) || 0, 0, 1), { eps: 0.0005 }), tw = tween(0);

  // fitted to the case shut, the lid open, and the cards held at their highest
  const C = Cam(45, 0.5, 2.5), ext = [];
  for (const x of [0, LX]) for (const y of [0, LY]) ext.push([x, y, 0], [x, y, HB + T]);
  for (const th of [90, OPEN]) for (const u of [0, LX]) for (const v of [0, LY]) for (const w of [0, T]) ext.push(lidAt(th).f(u, v, w));
  for (const x of [X0 - TK, X0 + (N - 1) * PITCH]) for (const y of [Y0, Y0 + CW]) ext.push([x, y, ZF + CH + TH + DROP]);
  fit(C, ext, 200, 158);
  const P = proj(C), front = facing(C); // and the direction toward the viewer, read off the projection
  const o = P(0, 0, 0), ex = P(1, 0, 0), ey = P(0, 1, 0), ez = P(0, 0, 1);
  const r1 = [ex[0] - o[0], ey[0] - o[0], ez[0] - o[0]], r2 = [ex[1] - o[1], ey[1] - o[1], ez[1] - o[1]];
  let eye = [r1[1] * r2[2] - r1[2] * r2[1], r1[2] * r2[0] - r1[0] * r2[2], r1[0] * r2[1] - r1[1] * r2[0]];
  if (eye[2] < 0) eye = eye.map((n) => -n);

  const outer = rrect(0, 0, LX, LY, RR, 6), inner = rrect(WT, WT, LX - WT, LY - WT, RR - WT, 6), paths = tray(P, front, outer, inner);
  const lo = rrect(0, 0, LX, LY, RR, 6), li = rrect(1.2, 1.2, LX - 1.2, LY - 1.2, RR - 1.2, 6), lw = rrect(FW, FW, LX - FW, LY - FW, 2, 4);

  // paint order: the case's far half, the lid while open, the cards back to front, the case's near half, the latch
  const g = mk("g", {}, svg), farG = mk("g", {}, g), lidG = mk("g", {}, g), cardG = mk("g", {}, g), nearG = mk("g", {}, g), latchG = mk("g", {}, g);
  paths.far.forEach(([d, cls], k) => mk("path", k ? { d, class: cls } : { d, class: cls, "data-part": "case" }, farG));
  for (const [d, cls] of paths.near) mk("path", { d, class: cls }, nearG);
  const lid = ["fo", "fo", "nf lo", "nf", "nf sil", "nf lo", "nf lo"].map((cls) => mk("path", { class: cls }, lidG));
  const cards = Array.from({ length: N }, (_, k) => {
    const grp = mk("g", {}, cardG);
    return { x: X0 + k * PITCH, shape: card(k), back: mk("path", { class: "lo" }, grp), face: mk("path", {}, grp), lines: mk("path", { class: "nf lo" }, grp), drawn: NaN };
  });
  const strap = mk("path", { class: "sil" }, latchG), strapEdge = mk("path", { class: "nf lo" }, latchG), rivet = mk("path", { class: "nf" }, latchG);
  const seal = mk("path", { class: "sil", "data-part": "seal" }, latchG), sealCr = mk("path", { class: "nf lo" }, latchG), sealRim = mk("path", { class: "nf lo" }, latchG);

  function drawCard(cd, h) {
    if (h === cd.drawn) return;
    cd.drawn = h;
    const at = (x) => ([u, v]) => P(x, Y0 + u, ZF + v + h);
    cd.back.setAttribute("d", poly(cd.shape.map(at(cd.x - TK))));
    cd.face.setAttribute("d", poly(cd.shape.map(at(cd.x))));
    cd.lines.setAttribute("d", LINES.map(([u0, u1, v]) => seg(at(cd.x)([u0, v]), at(cd.x)([u1, v]))).join(""));
  }

  let lidDrawn = NaN, behind = null;
  function drawLid(th) {
    if (th === lidDrawn) return;
    lidDrawn = th;
    const L = lidAt(th), ring = (r, w) => r.map((q) => P(...L.f(q.u, q.v, w)));
    const wf = dot([0, -L.s, L.c], eye) > 0 ? T : 0, seen = (q, sg) => dot([sg * q.nu, sg * q.nv * L.c, sg * q.nv * L.s], eye) > 0;
    const sil = hull(ring(lo, T).concat(ring(lo, 0))), win = ring(lw, wf), band = run(lw, (q) => seen(q, -1));
    const hole = area(sil) * area(win) > 0 ? win.slice().reverse() : win;
    const near = ring(band, wf), far = ring(band, T - wf);
    const glint = [[LX - 34, 9], [LX - 26, 9]].map(([u, v]) => seg(P(...L.f(u, v, T / 2)), P(...L.f(u + 9, v + 20, T / 2)))).join("");
    [poly(sil) + poly(hole), poly([...near, ...far.slice().reverse()]), open(far), poly(win), poly(sil), open(ring(run(li, (q) => seen(q, 1)), wf)), glint]
      .forEach((d, k) => lid[k].setAttribute("d", d));
    // open past upright, the lid stands behind the cards; shut, it lies over them
    if ((th >= 90) !== behind) { behind = th >= 90; if (behind) cardG.before(lidG); else nearG.after(lidG); }
  }

  // the latch turned a degrees from upright in the front's plane (180 hangs down): a point s along it and t across
  const turn = (a) => { const s = Math.sin(rad(a)), c = Math.cos(rad(a)); return { s, c, at: (p, q, y) => P(XC + p * s + q * c, y, ZH + p * c - q * s) }; };
  const strapRing = rrect(-2.6, -SW, SL, SW, SW, 4), sealRing = circ(SR, 28), sealIn = circ(SR - 0.9, 28), sealMark = circ(SR * 0.55, 20);
  const yF = LY + ST, yS = yF + SK;
  let latchDrawn = NaN;
  function drawLatch(a) {
    if (a === latchDrawn) return;
    latchDrawn = a;
    const R = turn(a), on = (r, y) => r.map((q) => R.at(q.u, q.v, y));
    const wall = (q) => dot([q.nu * R.s + q.nv * R.c, 0, q.nu * R.c - q.nv * R.s], eye) > 0;
    strap.setAttribute("d", poly(hull(on(strapRing, LY).concat(on(strapRing, yF)))));
    strapEdge.setAttribute("d", open(on(run(strapRing, wall), yF)));
    rivet.setAttribute("d", poly(on(circ(1.1, 10), yF)));
    const [cx, , cz] = [XC + SL * R.s, 0, ZH + SL * R.c], disc = (r, y) => r.map((q) => P(cx + q.u, y, cz + q.v));
    seal.setAttribute("d", poly(hull(disc(sealRing, yF).concat(disc(sealRing, yS)))));
    sealCr.setAttribute("d", open(disc(run(sealIn, (q) => dot([q.nu, 0, q.nv], eye) > 0), yS)));
    sealRim.setAttribute("d", poly(disc(sealMark, yS)));
  }

  let dq = NaN, da = NaN, lit = null;
  function draw(q, t) {
    cards.forEach((cd, k) => { const s0 = DROPS[0] + (N - 1 - k) * ((DROPS[1] - DROPS[0] - DW) / (N - 1)); drawCard(cd, DROP * (1 - ss(s0, s0 + DW, q))); });
    drawLid(OPEN * (1 - ss(...LID, q)));
    drawLatch(180 * (1 - ss(...LATCH, q)) + t);
    if ((q >= LIT) !== lit) { lit = q >= LIT; seal.classList.toggle("hi", lit); }
    dq = q; da = t;
  }

  const B = register(stage, (dt, now) => {
    if (reducedMotion()) sp.t = 1; // less motion: the rest pose, whatever the page's progress
    const m = stepS(sp, dt), t = tval(tw, now);
    if (!m) sp.x = sp.t; // landed: draw the pose asked for, exactly
    if (sp.x !== dq || t !== da) draw(sp.x, t);
    return m || !tdone(tw, now);
  });
  bag.add(B.unregister);

  // the hit area: the latch at rest, strap and seal, which the pointer's turn leaves. It never follows the drawing.
  const R0 = turn(0), area0 = hull([LY, yF].flatMap((y) => strapRing.map((q) => R0.at(q.u, q.v, y))).concat([yF, yS].flatMap((y) => sealRing.map((q) => P(XC + q.u, y, ZH + SL + q.v)))));
  let act = false;
  /** Tries the latch, or lets it go: it turns a little and the strap lights with its seal. */
  function choose(on) {
    if (on === act) return;
    act = on;
    tset(tw, on ? TRY : 0, performance.now(), 0);
    strap.classList.toggle("hi", on);
    read.textContent = on ? "sealed" : "rest";
    B.wake();
  }

  read.textContent = "rest";
  bag.add(pointer(stage, { move: (p) => choose(sp.t >= LIT && inside(area0, p)), leave: () => choose(false) }));
  bag.add(() => svg.replaceChildren());

  return {
    // scroll progress, as often as the page likes: the spring eases to it and the loop sleeps once it lands
    set: (v) => {
      v = reducedMotion() ? 1 : clamp(Number(v) || 0, 0, 1); if (v === sp.t) return;
      sp.t = v;
      if (act && v < LIT) choose(false);
      B.wake();
    },
    destroy: bag.dispose,
  };
}

export default hairline({
  name: "locked-set",
  means: "Twenty clause cards drop into a case, the lid shuts, and the latch turns up and seals it. The number is scroll progress.",
  rules: [4, 5, 6, 8],
  range: [0, 1, 1],
  mount,
});
