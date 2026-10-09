// Written with the hairline engine (hairline-kernel.js; MIT, Lucas Marques) in my private drawing workspace
// at 41a025f. This file is covered by the repo's MIT license (see NOTICE).
// The host a page needs: what the skill's bench does for one figure, minus the bench's controls.
import { HL } from "./hairline-kernel.js";

/**
 * Mounts `figure` into `stage`. Options:
 *   intensity  0..1, as the bench's slider: mapped through the figure's `range` (default 0.5)
 *   value      the figure's own number, passed as is; wins over `intensity`
 *   onRead     called with the read-out each time the figure writes it
 * Returns { set(intensity), value(v), bright(), anchor(name), destroy() }. `value` is for figures
 * whose number is a progress the page drives, e.g. from scroll: call it as often as you like; the
 * figure eases. `bright()` and `anchor(name)` say where a part is drawn right now, as fractions
 * of the element's box ({ x, y } its centre, { x0, y0, x1, y1 } its bounds), or null when it
 * isn't drawn. `bright()` finds the bright part; `anchor(name)` finds a part the figure tagged
 * with a `data-part` attribute, e.g. mk("g", { "data-part": "flag-2" }, svg). Read them every
 * frame you need them: they follow the drawing as it moves.
 */
export function mountFigure(stage, figure, { intensity = 0.5, value, onRead } = {}) {
  HL.inject(document);
  stage.setAttribute("data-hairline", figure.name);
  stage.setAttribute("role", "img");
  stage.setAttribute("aria-label", figure.means);
  const [lo, mid, hi] = figure.range;
  const at = (i) => (i <= 0.5 ? lo + (i / 0.5) * (mid - lo) : mid + ((i - 0.5) / 0.5) * (hi - mid));
  const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
  let text = "";
  const read = {
    get textContent() { return text; },
    set textContent(v) { text = v == null ? "" : String(v); onRead?.(text); },
  };
  const handle = figure.mount({ stage, svg, read }, value ?? at(intensity));
  // the drawing is a 400 × 320 viewBox filling a 5:4 box, so viewBox units / 400 and / 320 are fractions
  const box = (els) => {
    const parts = els.map((el) => el.getBBox()).filter((b) => b.width || b.height);
    if (!parts.length) return null;
    const x0 = Math.min(...parts.map((b) => b.x)) / 400, y0 = Math.min(...parts.map((b) => b.y)) / 320;
    const x1 = Math.max(...parts.map((b) => b.x + b.width)) / 400, y1 = Math.max(...parts.map((b) => b.y + b.height)) / 320;
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, x0, y0, x1, y1 };
  };
  return {
    set: (i) => handle.set(at(i)),
    value: (v) => handle.set(v),
    bright: () => box([...svg.querySelectorAll(".hi")]),
    anchor: (name) => box([...svg.querySelectorAll(`[data-part="${CSS.escape(name)}"]`)]),
    destroy: () => { handle.destroy(); svg.remove(); },
  };
}
