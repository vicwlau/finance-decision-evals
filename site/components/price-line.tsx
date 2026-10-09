import type { CSSProperties } from "react";
import { money } from "./format";

// Frame 6: one training pair on a price line. The same option at two prices against one SSP
// range; on reveal the marker slides from the first price to the second, across the band's edge,
// and its label flips.

type Side = { price: number; label: string };

const cents = (x: number) => Math.round(x * 100);

export function PriceLine({ from, to, ssp }: { from: Side; to: Side; ssp: number[] }) {
  const [lo, hi] = ssp;
  // Axis in 10-cent steps, one step beyond the data on each side.
  const min = Math.floor((cents(Math.min(lo, from.price, to.price)) - 10) / 10) / 10;
  const max = Math.ceil((cents(Math.max(hi, from.price, to.price)) + 10) / 10) / 10;
  const at = (v: number) => (v - min) / (max - min);
  const ticks: number[] = [];
  for (let c = cents(min); c <= cents(max); c += 10) ticks.push(c / 100);
  const sspText = `${money(lo)}–${hi.toFixed(2)}`;

  return (
    <div
      className="price"
      role="img"
      aria-label={`${money(from.price)}: ${from.label}. ${money(to.price)}: ${to.label}. SSP range ${sspText} per 1M tokens.`}
    >
      <div className="price-plot">
        <i className="price-axis" />
        <i className="price-band" style={{ "--a": at(lo), "--b": at(hi) } as CSSProperties} />
        <span className="price-layer price-ghost" style={{ "--x": at(from.price) } as CSSProperties}>
          <i className="price-dot hollow" />
          <span className="price-label">
            <b>{money(from.price)}</b>
            <span>{from.label}</span>
          </span>
        </span>
        <span className="price-layer price-mover" style={{ "--from": at(from.price), "--x": at(to.price) } as CSSProperties}>
          <i className="price-dot" />
          <span className="price-label">
            <b className="flip">
              <span className="flip-a">{money(from.price)}</span>
              <span className="flip-b">{money(to.price)}</span>
            </b>
            <span className="flip">
              <span className="flip-a">{from.label}</span>
              <span className="flip-b">{to.label}</span>
            </span>
          </span>
        </span>
      </div>
      <div className="price-ticks" aria-hidden="true">
        {ticks.map((t) => (
          <i key={t} className={cents(t) % 20 ? "minor" : undefined} style={{ left: `${at(t) * 100}%` }}>
            {money(t)}
          </i>
        ))}
      </div>
      <p className="price-key">
        <i className="sw-band" aria-hidden="true" /> SSP range {sspText} per 1M tokens
      </p>
    </div>
  );
}
