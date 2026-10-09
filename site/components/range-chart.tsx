import type { CSSProperties } from "react";
import { pct, pctRange } from "./format";

// Accuracy ranges on one shared axis: a bar from the lowest to the highest value across state
// shapes, with a tick for each shape. On reveal both bars travel in from the axis start together,
// so the gap between them reads.

export type RangeRow = { key: string; label: string; values: number[]; strong?: boolean };

type Props = { rows: RangeRow[]; from: number; to: number; step: number; label: string };

export function RangeChart({ rows, from, to, step, label }: Props) {
  const at = (v: number) => ((v - from) / (to - from)) * 100;
  const ticks: number[] = [];
  for (let i = 0; from + i * step <= to + 1e-9; i++) ticks.push(Math.round((from + i * step) * 1000) / 1000);
  return (
    <div className="range" role="img" aria-label={label}>
      {rows.map((r) => {
        const lo = Math.min(...r.values);
        const hi = Math.max(...r.values);
        return (
          <div className={`range-row ${r.strong ? "strong" : ""}`} key={r.key}>
            <div className="range-name">{r.label}</div>
            <div className="range-track">
              <span className="range-layer" style={{ "--a": at(lo) } as CSSProperties}>
                <i className="range-bar" style={{ "--a": at(lo), "--b": at(hi) } as CSSProperties} />
                {r.values.map((v, i) => (
                  <i className="range-tick" key={`${r.key}-${i}`} style={{ "--x": at(v) } as CSSProperties} />
                ))}
              </span>
              <span className="range-val" style={{ "--x": at(hi) } as CSSProperties}>
                {pctRange(r.values)}
              </span>
            </div>
          </div>
        );
      })}
      <div className="range-axis" aria-hidden="true">
        <span />
        <span className="range-axis-track">
          {ticks.map((t) => (
            <i key={t} style={{ left: `${at(t)}%` }}>
              {pct(t)}
            </i>
          ))}
        </span>
      </div>
    </div>
  );
}
