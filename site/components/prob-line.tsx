import type { CSSProperties, ReactNode } from "react";
import { prob } from "./format";

// Jev's probability of yes on a 0–1 line. The half that agrees with the labelled answer is
// shaded and a hairline marks 0.5, so a dot in the shaded half is right.

function Track({ gold, children }: { gold: boolean; children?: ReactNode }) {
  return (
    <div className="pl-track" data-gold={gold ? "yes" : "no"}>
      <i className="pl-wash" />
      <i className="pl-rule" />
      <i className="pl-mid" />
      {children}
    </div>
  );
}

/** Jev's answer read as a verdict: yes at 0.5 or above. */
const said = (v: number) => (v >= 0.5 ? "yes" : "no");

/**
 * Frame 3: one answer before and after the facts are computed. Each dot carries its value; the key
 * under the line says what each value is and which way it falls. The dot travels on reveal.
 */
export function FixLine({
  before,
  after,
  gold,
  beforeLabel,
  afterLabel,
}: {
  before: number;
  after: number;
  gold: boolean;
  beforeLabel: string;
  afterLabel: string;
}) {
  return (
    <div className="fix">
      <div aria-hidden="true">
        <Track gold={gold}>
          <span className="fix-layer fix-ghost" style={{ "--x": before } as CSSProperties}>
            <i className="fix-dot hollow" />
            <span className="fix-label">
              <b>{prob(before)}</b>
            </span>
          </span>
          <span className="fix-layer fix-mover" style={{ "--from": before, "--x": after } as CSSProperties}>
            <i className="fix-dot" />
            <span className="fix-label">
              <b>{prob(after)}</b>
            </span>
          </span>
        </Track>
        <div className="pl-axis">
          <i style={{ left: "0%" }}>0</i>
          <i style={{ left: "50%" }}>0.5</i>
          <i style={{ left: "100%" }}>1</i>
        </div>
      </div>
      <ul className="fix-key">
        <li className="is-before">
          <i className="fix-swatch hollow" aria-hidden="true" />
          <span>
            {beforeLabel}: Jev said <b>{prob(before)}</b> ({said(before)})
          </span>
        </li>
        <li className="is-after">
          <i className="fix-swatch" aria-hidden="true" />
          <span>
            {afterLabel}: Jev said <b>{prob(after)}</b> ({said(after)})
          </span>
        </li>
      </ul>
    </div>
  );
}
