import type { CSSProperties, ReactNode } from "react";
import { tickmarkId } from "@vicwlau/tickmark";

// A frame for a hairline illustration that is drawn elsewhere. It holds a stable aspect ratio so
// the page doesn't jump when the figure mounts, and sets the figure's bright stroke to the page
// accent. Captions and cards belong beside the slot in HTML, never inside it.

type Props = {
  /** Figure key, e.g. "a". Also the mount point: [data-figure-slot="a"]. */
  id: string;
  /** Width / height, e.g. 4 / 3. */
  ratio: number;
  /** What the figure shows, for screen readers and the placeholder. */
  label: string;
  /** The mounted figure. Until then a quiet placeholder shows. */
  children?: ReactNode;
  className?: string;
};

export function FigureSlot({ id, ratio, label, children, className }: Props) {
  const style = { "--hairline-hi": "var(--accent)", aspectRatio: String(ratio) } as CSSProperties;
  return (
    <div
      className={["figure-slot", className].filter(Boolean).join(" ")}
      data-figure-slot={id}
      data-tickmark={tickmarkId("site", "figure", id)}
      role="img"
      aria-label={label}
      style={style}
    >
      {children ?? (
        <div className="figure-slot-placeholder" aria-hidden="true">
          <span>Figure {id.toUpperCase()}</span>
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}
