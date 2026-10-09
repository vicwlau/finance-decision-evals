// Drawn with the hairline engine (hairline-kernel.js; MIT, Lucas Marques) in my private drawing workspace
// at 41a025f. This file is covered by the repo's MIT license (see NOTICE).
import { HL } from "./hairline-kernel.js";
const hairline = (figure) => figure;
/**
 * Scan flags: a contract fanned out on the desk. Its first page lies on top,
 * at the back; three pages fan forward from under it, down to a stair of page
 * edges, the bulk. A scanner bar runs down through the pages as the reader
 * scrolls: the figure's one number is the scan's progress, 0 before it starts
 * and 1 when it is done, and the bar follows it on a spring. Each flagged
 * clause the bar passes rises off its page as a slip on dashed drops; the
 * latest found holds the bright. At 1, four slips stand raised, the bar lies
 * dim on the desk past the last page, and the bright settles on the add-on
 * clause, the first found. Each flag's group is tagged data-part="flag-1" to
 * "flag-4" in scan order, and the bar's "bar", so a host page can anchor
 * captions to them as they move. The pointer, over a raised slip, takes the bright
 * to it and lifts it a little; nothing else, so it never fights the scroll.
 *
 * The pattern: a continuous input from outside (scroll) on a spring, inside
 * register's tick, which sleeps once everything has landed. Flags are tweens.
 */
const {
  Cam, extremes, facing, fit, hull, lerp, open, poly, prism, proj, ringAt, rings, rrect, run, seg,
  spring, stepS, tween, tset, tval, tdone, reducedMotion, mk, solid, put, pointer, register, disposer,
} = HL;

const W = 66, H = 88, T = 1, SK = 1.3, LS = 4.2, M = 6, HEAD = 7, BX = 3, BW = 3, BT = 2, L = 6, PICK = 2.5, CLEAR = 4, STAG = 45;
// how far each page lies behind and left of the page under it: six edges of the bulk, then three fanned pages
const DY = [2.6, 2.6, 2.6, 2.6, 2.6, 2.6, 19, 19, 19], DX = [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 5, 5, 5], N = DY.length + 1;
const tail = (a, j) => a.slice(j).reduce((s, v) => s + v, 0);
const X = (j) => tail(DX, j), Y = (j) => tail(DY, j), Z = (j) => (j + 1) * T;
const TOP = N - 1, START = 0, END = Y(0) + H + 4;
/** The fan's left edge at world y: X against Y, page by page. */
const Xt = (y) => { for (let j = TOP; j > 0; j--) if (y <= Y(j - 1)) return lerp(X(j), X(j - 1), Math.max(0, (y - Y(j)) / DY[j - 1])); return X(0); };
// clause blocks: [page, first line's v, lines, last line's share, flag]; the add-on is a sentence, the first flag found
const BLOCKS = [
  [9, 20, 3, 0.62, ""], [9, 34.4, 2, 0.3, "material right"], [9, 44.6, 2, 0.4, ""], [9, 54.8, 3, 0.5, "variable"],
  [9, 69.2, 3, 0.7, ""], [8, 73.4, 2, 0.8, ""], [8, 83, 1, 0.55, "modification"], [7, 73.4, 3, 0.6, ""],
  [6, 73.4, 2, 0.7, ""], [6, 83, 1, 0.6, "financing"],
];
const REST = "material right";

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

/** A block's lines on page j at height z: a heading stub, a gap, the rest of the line; the last line short. */
function lines(P, j, [, v, n, last], z) {
  const at = (u0, u1, vv) => seg(P(X(j) + u0, Y(j) + vv, z), P(X(j) + u1, Y(j) + vv, z)), m = W - 2 * M;
  let d = "";
  for (let k = 0; k < n; k++) {
    const vv = v + k * LS, u1 = M + m * (k === n - 1 ? last : 1);
    d += k === 0 ? at(M, M + HEAD, vv) + at(M + HEAD + 2.6, Math.max(u1, M + HEAD + 10), vv) : at(M, u1, vv);
  }
  return d;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let prog = value;
  const ring = (j) => rrect(X(j), Y(j), X(j) + W, Y(j) + H, 1.2, 3);
  // the bar rides a fixed clearance over the page it is above: knots at each page's visible middle, top page first
  const knots = Array.from({ length: N }, (_, j) => [j === TOP ? H / 2 : Y(j) + H - DY[j] / 2, Z(j)]).reverse();
  const zAt = (s) => {
    let k = 1;
    while (k < N - 1 && s > knots[k][0]) k++;
    const [a, za] = knots[k - 1], [b, zb] = knots[k];
    return za + Math.min(1, Math.max(0, (s - a) / (b - a))) * (zb - za);
  };
  const sAt = (p) => (reducedMotion() ? END : lerp(START, END, Math.min(1, Math.max(0, p))));
  // the bar spans the pages under it, a little past each side
  const span = (s) => [Xt(s - H) - BX, Xt(s) + W + BX];

  // the flags' slips, in scan order
  const flags = BLOCKS.filter((b) => b[4]).map((b) => {
    const j = b[0], v1 = b[1] + (b[2] - 1) * LS, slip = rrect(X(j) + M - 3, Y(j) + b[1] - 3.4, X(j) + W - M + 3, Y(j) + v1 + 3.4, 2.4, 4);
    return { j, b, term: b[4], z: Z(j), slip, y0: Y(j) + b[1] - 3.4, yc: Y(j) + (b[1] + v1) / 2, drawn: NaN };
  }).sort((a, b) => a.y0 - b.y0);
  // the bar hovers CLEAR over the page, climbing to clear raised slips by the time it reaches the first flag
  const zBar = (s) => zAt(s) + CLEAR + L * Math.min(1, Math.max(0, (s - START) / (flags[0].y0 - START)));

  // centred on the rest pose: every page, the four slips raised, the bar on the desk. At S 2.4 the other
  // poses stay inside the frame too: the bar at 0, over the first page's back edge, and a slip lifted by the pointer
  const C = Cam(45, 0.5, 2.4), ext = [];
  for (let j = 0; j < N; j++) for (const [u, v] of [[0, 0], [W, 0], [0, H], [W, H]]) ext.push([X(j) + u, Y(j) + v, j * T]);
  for (const f of flags) for (const q of f.slip) ext.push([q.u, q.v, f.z + L + SK]);
  for (const x of span(END)) ext.push([x, END - BW / 2, 0], [x, END + BW / 2, 0]);
  fit(C, ext, 200, 166);
  const P = proj(C), front = facing(C);

  // pages bottom to top: each lies higher and further back than the one under it, so it paints later
  const g = mk("g", {}, svg);
  for (let j = 0; j < N; j++) {
    const r = ring(j);
    mk("path", { d: poly(hull(ringAt(P, r, j * T).concat(ringAt(P, r, Z(j))))), class: "sil" }, g);
    mk("path", { d: open(ringAt(P, run(r, front), Z(j))), class: "nf lo" }, g);
    let d = "";
    for (const b of BLOCKS) if (b[0] === j && !b[4]) d += lines(P, j, b, Z(j));
    if (j === TOP) {
      const ttl = (h, v) => seg(P(W / 2 - h, v, Z(j)), P(W / 2 + h, v, Z(j)));
      d += ttl(13, 8);
      mk("path", { d: ttl(20, 12.5), class: "nf lo" }, g);
    }
    if (d) mk("path", { d, class: "nf" }, g);
  }

  // the flags paint over every page: seated, each lies where nothing covers it; raised, each is above all it overlaps
  const layer = mk("g", {}, g), s0 = sAt(prog);
  for (const [k, f] of flags.entries()) {
    const el = mk("g", { "data-part": "flag-" + (k + 1) }, layer);
    f.on = s0 >= f.y0;
    Object.assign(f, {
      tw: tween(f.on ? L : 0), guide: mk("path", { class: "nf dash" }, el), sil: mk("path", { class: "sil" }, el),
      edge: mk("path", { class: "nf lo" }, el), text: mk("path", { class: "nf sil" }, el),
    });
  }
  const rest = flags.find((f) => f.term === REST), last = flags[flags.length - 1], barEl = solid(g);
  barEl.g.setAttribute("data-part", "bar");

  /** A flag lifted h: where it was cut from and its drops, the slip, its top edge and its lines. Seated, only its lines. */
  function drawFlag(f, h) {
    if (h === f.drawn) return;
    f.drawn = h;
    const up = h > 0.05, z0 = f.z + h, z1 = up ? z0 + SK : f.z;
    f.guide.setAttribute("d", up ? poly(ringAt(P, f.slip, f.z)) + extremes(P, f.slip).map((e) => seg(P(e.u, e.v, f.z), P(e.u, e.v, z0))).join("") : "");
    f.sil.setAttribute("d", up ? poly(hull(ringAt(P, f.slip, z0).concat(ringAt(P, f.slip, z1)))) : "");
    f.edge.setAttribute("d", up ? open(ringAt(P, run(f.slip, front), z1)) : "");
    f.text.setAttribute("d", lines(P, f.j, f.b, z1));
  }
  let barDrawn = "";
  /** The bar: a rod with a crease, in the strongest grey while it moves; dim once it has landed at the end. */
  function drawBar(s, z, landed) {
    const key = s + "," + z + "," + landed;
    if (key === barDrawn) return;
    barDrawn = key;
    const [x0, x1] = span(s), [r, i] = rings(x0, s - BW / 2, x1, s + BW / 2, BW / 2, 0.6);
    put(barEl, prism(P, front, r, i, z, z + BT));
    barEl.sil.setAttribute("class", landed ? "lo" : "sil");
  }

  // hit areas: each flag as it stands raised at rest, with the cut under it. They never move, and nothing draws them.
  const outs = flags.map((f) => hull(ringAt(P, f.slip, f.z).concat(ringAt(P, f.slip, f.z + L + SK))));
  let q = null, bright = null, said = "", picked = null;

  const bar = spring(s0, { eps: 0.05 }), bz = spring(s0 >= END ? 0 : zBar(s0), { eps: 0.02 });
  const B = register(stage, (dt, now) => {
    bar.t = sAt(prog);
    const done = bar.t >= END;
    // the bar floats over the stack while it scans, and is set down on the desk when the scan is done
    bz.t = done && bar.x > END - 4 ? 0 : zBar(bar.x);
    const mb = stepS(bar, dt), mz = stepS(bz, dt), landed = done && !mb && !mz;
    let moving = mb || mz;
    // a flag rises as the bar passes it; several at once rise nearest the bar first
    const ch = [];
    for (const f of flags) if ((bar.x >= f.y0) !== f.on) { f.on = !f.on; ch.push(f); }
    ch.sort((a, b) => Math.abs(a.yc - bar.x) - Math.abs(b.yc - bar.x)).forEach((f, k) => tset(f.tw, f.on ? L : 0, now, k * STAG));
    // the pointer picks only among raised slips, tested at their rest outlines
    let pick = null;
    if (q) for (let k = flags.length - 1; k >= 0 && !pick; k--) if (flags[k].on && inside(outs[k], q)) pick = flags[k];
    if (pick !== picked) {
      if (picked?.on) tset(picked.tw, L, now, 0);
      if (pick) tset(pick.tw, L + PICK, now, 0);
      picked = pick;
    }
    const latest = flags.filter((f) => f.on).pop() ?? null;
    // the last flag keeps the bright until the bar lands; then it goes back to the add-on
    const want = pick ?? (landed && latest === last ? rest : latest);
    if (want !== bright) { bright?.sil.classList.remove("hi"); want?.sil.classList.add("hi"); bright = want; }
    const say = pick ? pick.term : "rest";
    if (say !== said) read.textContent = said = say;
    for (const f of flags) { drawFlag(f, tval(f.tw, now)); if (!tdone(f.tw, now)) moving = true; }
    drawBar(bar.x, bz.x, landed);
    return moving;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, { move: (p) => { q = p; B.wake(); }, leave: () => { q = null; B.wake(); } }));
  bag.add(() => svg.replaceChildren());

  return {
    // the page calls this on every scroll frame with the raw progress: it only retargets, and wakes the loop
    set: (v) => { if (v !== prog) { prog = v; B.wake(); } },
    destroy: bag.dispose,
  };
}

export default hairline({
  name: "scan-flags",
  means: "A fanned contract: a scan runs down through its pages, and the four clauses it flags rise as it passes.",
  rules: [4, 5, 7, 8],
  range: [0, 1, 1],
  mount,
});
