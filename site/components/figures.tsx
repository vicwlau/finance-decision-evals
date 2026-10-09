import type { CSSProperties } from "react";

// Placeholder drawings for the two hairline figures, in the editorial style: thin grey page
// outlines, text-line skeletons, and the accent for the one thing that matters. Each is a
// complete still at rest and reads its scene's progress from CSS (see globals.css). The hairline
// drawings replace them inside the same slots.

type Row = [y: number, width: number];

function Lines({ x, rows, className }: { x: number; rows: Row[]; className?: string }) {
  return (
    <g className={className}>
      {rows.map(([y, w]) => (
        <rect key={y} x={x} y={y} width={w} height={4} rx={2} />
      ))}
    </g>
  );
}

/* ---------------------------------------------------------------------------------------------
   Figure A: pages pile into a thick contract (right), one page comes forward (left, toward the
   text), and one sentence on it lights up. Reads --fp from its slot (0 to 1, 1 = rest).
   --------------------------------------------------------------------------------------------- */

const PILE = 16;
const PAGE = { x: 300, y: 150, w: 140, h: 184, dx: -1.6, dy: -3.6 };
const TOP = { x: PAGE.x + (PILE - 1) * PAGE.dx, y: PAGE.y + (PILE - 1) * PAGE.dy };
const FWD = { x: 30, y: 28, w: 220, h: 289 };

/** Text lines on the pile's top page, as offsets from the page's top edge. */
const topRows: Row[] = [14, 24, 34, 44, 60, 70, 80, 90, 106, 116, 126, 142, 152, 162, 172].map((y, i) => [
  y,
  [116, 110, 116, 70, 116, 104, 116, 82, 116, 112, 60, 116, 108, 116, 74][i],
]);

const fwd = {
  heading: [[48, 90]] as Row[],
  rest: [
    [66, 184], [76, 178], [86, 184], [96, 120],
    [114, 184], [124, 170], [134, 184], [144, 140],
    [200, 184], [210, 176], [220, 184], [230, 96],
    [248, 184], [258, 180], [268, 184], [278, 170], [288, 60],
  ] as Row[],
  sentence: [[162, 184], [172, 184], [182, 110]] as Row[],
};

export function PileFigure() {
  // The forward page starts exactly over the top page of the pile, then moves to its rest spot.
  const style = {
    "--n": PILE,
    "--fwd-tx": `${TOP.x - FWD.x}px`,
    "--fwd-ty": `${TOP.y - FWD.y}px`,
    "--fwd-s": PAGE.w / FWD.w,
    "--fwd-origin": `${FWD.x}px ${FWD.y}px`,
  } as CSSProperties;
  return (
    <svg className="pile-svg" viewBox="0 0 480 360" aria-hidden="true" style={style}>
      <g className="pile">
        {Array.from({ length: PILE }, (_, i) => (
          <g key={i} className="pile-page" style={{ "--i": i } as CSSProperties}>
            <rect x={PAGE.x + i * PAGE.dx} y={PAGE.y + i * PAGE.dy} width={PAGE.w} height={PAGE.h} rx={2} />
            {i === PILE - 1 ? <Lines x={TOP.x + 12} rows={topRows.map(([y, w]) => [TOP.y + y, w])} className="skel" /> : null}
          </g>
        ))}
      </g>
      <g className="fwd">
        <rect className="fwd-page" x={FWD.x} y={FWD.y} width={FWD.w} height={FWD.h} rx={3} />
        <g className="fwd-rest">
          <Lines x={FWD.x + 18} rows={fwd.heading} className="skel dark" />
          <Lines x={FWD.x + 18} rows={fwd.rest} className="skel" />
        </g>
        <rect className="fwd-tint" data-anchor="sentence" x={FWD.x + 10} y={155} width={FWD.w - 20} height={37} rx={3} />
        <Lines x={FWD.x + 18} rows={fwd.sentence} className="skel" />
        <Lines x={FWD.x + 18} rows={fwd.sentence} className="skel bright" />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------------------------
   Figure B: reading a contract. Pages flip on the stack (left) while a scan band moves down each
   page; at each flagged clause the scan pauses, the block lights with its number, and the page is
   pulled out to the right. At rest: the stack read, four numbered pages pulled.
   State comes from its ScanScene: [data-scan] flip | pause | done, [data-flag] the current pause,
   [data-v] which page layout shows, --band the scan position, and [data-on] on each pulled page.
   --------------------------------------------------------------------------------------------- */

const FRONT = { x: 34, y: 44, w: 214, h: 304 };
const LINE_X = FRONT.x + 18;
/** Flagged block positions on the front page, in card order. */
const FLAG_Y = [100, 194, 146, 248];
const PULL = [
  { x: 300, y: 30 },
  { x: 470, y: 30 },
  { x: 300, y: 212 },
  { x: 470, y: 212 },
];
const PULL_SIZE = { w: 140, h: 158 };

function pageRows(seed: number, skipFrom = -1): Row[] {
  const rows: Row[] = [];
  for (let y = FRONT.y + 24, i = 0; y <= FRONT.y + FRONT.h - 22; y += 10, i++) {
    if ((i + seed) % 5 === 4) continue;
    if (skipFrom >= 0 && y >= skipFrom - 8 && y <= skipFrom + 22) continue;
    rows.push([y, (i + seed) % 5 === 3 ? 92 + ((seed * 17) % 40) : 178]);
  }
  return rows;
}

function Marker({ cx, cy, n }: { cx: number; cy: number; n: number }) {
  return (
    <g className="marker">
      <circle cx={cx} cy={cy} r={9} />
      <text x={cx} y={cy + 3.6} textAnchor="middle">
        {n}
      </text>
    </g>
  );
}

export function ScanFigure() {
  const block = (y: number, x: number, w: number) => (
    <>
      <rect className="sc-tint" x={x - 8} y={y - 7} width={w + 16} height={28} rx={3} />
      <Lines x={x} rows={[[y, w], [y + 10, Math.round(w * 0.66)]]} className="skel bright" />
    </>
  );
  // The band travels down the page while flipping and stops on each flagged block.
  const style = {
    "--travel": `${FRONT.h - 24}px`,
    ...Object.fromEntries(FLAG_Y.map((y, k) => [`--stop-${k}`, `${y - FRONT.y - 4}px`])),
  } as CSSProperties;
  return (
    <svg className="scan-svg" viewBox="0 0 640 400" aria-hidden="true" style={style}>
      {/* the stack under the front page */}
      {[6, 5, 4, 3, 2, 1].map((j) => (
        <rect key={j} className="sc-edge" x={FRONT.x + j * 3} y={FRONT.y + j * 3} width={FRONT.w} height={FRONT.h} rx={3} />
      ))}
      <rect className="sc-page" x={FRONT.x} y={FRONT.y} width={FRONT.w} height={FRONT.h} rx={3} />
      {[0, 1, 2].map((v) => (
        <Lines key={v} x={LINE_X} rows={pageRows(v)} className={`skel sc-v sc-v${v}`} />
      ))}
      {FLAG_Y.map((y, k) => (
        <g key={k} className={`sc-flag sc-flag-${k}`}>
          <Lines x={LINE_X} rows={pageRows(k + 1, y)} className="skel" />
          {block(y, LINE_X + 4, 128)}
          <Marker cx={FRONT.x + FRONT.w - 22} cy={y + 5} n={k + 1} />
        </g>
      ))}
      {/* pages turning while the scan reads */}
      <rect className="sc-turn a" x={FRONT.x} y={FRONT.y} width={FRONT.w} height={FRONT.h} rx={3} />
      <rect className="sc-turn b" x={FRONT.x} y={FRONT.y} width={FRONT.w} height={FRONT.h} rx={3} />
      <g className="sc-band">
        <rect className="sc-band-tint" x={FRONT.x + 1} y={FRONT.y - 12} width={FRONT.w - 2} height={24} />
        <rect className="sc-band-line" x={FRONT.x + 1} y={FRONT.y + 11} width={FRONT.w - 2} height={2} />
      </g>
      {/* flagged pages, pulled out in card order */}
      {PULL.map((s, k) => {
        const by = s.y + 22 + ((FLAG_Y[k] - FRONT.y) / FRONT.h) * (PULL_SIZE.h - 50);
        const rows: Row[] = [];
        for (let y = s.y + 16; y <= s.y + PULL_SIZE.h - 14; y += 9) if (y < by - 8 || y > by + 18) rows.push([y, (y / 9) % 4 < 1 ? 70 : 104]);
        return (
          <g key={k} className="sc-pull" data-step={k}>
            <rect className="sc-page" x={s.x} y={s.y} width={PULL_SIZE.w} height={PULL_SIZE.h} rx={3} />
            <Lines x={s.x + 14} rows={rows} className="skel" />
            {block(by, s.x + 16, 92)}
            <Marker cx={s.x + PULL_SIZE.w - 16} cy={by + 5} n={k + 1} />
          </g>
        );
      })}
    </svg>
  );
}
