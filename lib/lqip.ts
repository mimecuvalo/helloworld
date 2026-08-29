// CSS-only low-quality image placeholders, after Lean Rada's technique:
// https://leanrada.com/notes/css-only-lqip/
//
// A whole placeholder is one 20-bit integer, stored as `--lqip` on the element
// and unpacked by CSS alone (see styles/lqip.css). No <canvas>, no base64
// thumbnail, no javascript — an int on the row is the entire payload.
//
//   :98765432109876543210:
//   :aaBBccDDeeFFllAAAbbb:
//
// - six 2-bit greyscale cells laid out 3x2 over the image
// - 2 bits of L, 3 bits of a, 3 bits of b — the base Oklab colour underneath
//
// The stored value is offset by -2^19 so it fits the ±999999 range browsers
// keep integer custom properties exact within.

import type { CSSProperties } from 'react';

export const LQIP_MIN = -(2 ** 19);
export const LQIP_MAX = 2 ** 19 - 1;

export type Rgb = { r: number; g: number; b: number };
export type Oklab = { L: number; a: number; b: number };

function srgbToLinear(x: number) {
  return x >= 0.04045 ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92;
}

export function rgbToOklab({ r, g, b }: Rgb): Oklab {
  const lr = srgbToLinear(r / 255);
  const lg = srgbToLinear(g / 255);
  const lb = srgbToLinear(b / 255);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return {
    L: l * 0.2104542553 + m * 0.793617785 + s * -0.0040720468,
    a: l * 1.9779984951 + m * -2.428592205 + s * 0.4505937099,
    b: l * 0.0259040371 + m * 0.7827717662 + s * -0.808675766,
  };
}

// The inverse of what styles/lqip.css computes for --lqip-base-clr. Kept in
// step with it by hand: the search below only makes sense against the colours
// the stylesheet can actually produce.
function bitsToOklab(ll: number, aaa: number, bbb: number): Oklab {
  return {
    L: (ll / 0b11) * 0.6 + 0.2,
    a: (aaa / 0b1000) * 0.7 - 0.35,
    b: ((bbb + 1) / 0b1000) * 0.7 - 0.35,
  };
}

// Euclidean distance in Oklab pulls everything towards grey, because the
// a/b axes are tiny next to L. Dividing by the square root of the chroma
// spreads the low-chroma colours out again so a muted blue doesn't collapse
// into neutral.
function scaleForDiff(x: number, chroma: number) {
  return x / (1e-6 + Math.sqrt(chroma));
}

// 4 x 8 x 8 = 256 candidates, so the whole space is worth walking rather than
// rounding each channel on its own — rounding L and a and b separately lands
// on a colour that is off in three directions at once.
export function findOklabBits(target: Oklab) {
  const targetChroma = Math.hypot(target.a, target.b);
  const targetA = scaleForDiff(target.a, targetChroma);
  const targetB = scaleForDiff(target.b, targetChroma);

  let best = { ll: 0, aaa: 0, bbb: 0 };
  let bestDifference = Infinity;

  for (let ll = 0; ll <= 0b11; ll++) {
    for (let aaa = 0; aaa <= 0b111; aaa++) {
      for (let bbb = 0; bbb <= 0b111; bbb++) {
        const candidate = bitsToOklab(ll, aaa, bbb);
        const chroma = Math.hypot(candidate.a, candidate.b);
        // Grey is what an average colour lands on far too often; nudge the
        // search away from it so placeholders keep some of the photo's cast.
        const greyPenalty = aaa === 4 && bbb === 3 ? 0.04 : 0;
        const difference =
          greyPenalty +
          Math.hypot(
            candidate.L - target.L,
            scaleForDiff(candidate.a, chroma) - targetA,
            scaleForDiff(candidate.b, chroma) - targetB
          );
        if (difference < bestDifference) {
          bestDifference = difference;
          best = { ll, aaa, bbb };
        }
      }
    }
  }

  return best;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Packs a placeholder into the single integer the stylesheet reads.
 *
 * `cells` is the image squashed to 3x2, row-major, as sRGB triples; `base` is
 * the colour the whole image averages (or is dominated by), which the six
 * cells are then read as brightness *relative to*.
 */
export function encodeLqip({ cells, base }: { cells: Rgb[]; base: Rgb }): number {
  if (cells.length !== 6) throw new Error(`lqip needs a 3x2 preview, got ${cells.length} cells`);

  const { ll, aaa, bbb } = findOklabBits(rgbToOklab(base));
  const baseL = bitsToOklab(ll, aaa, bbb).L;
  // Relative, so a placeholder still has contrast where it matters even when
  // the photo as a whole is very dark or very light.
  const values = cells.map((cell) => clamp(0.5 + rgbToOklab(cell).L - baseL, 0, 1));
  const [ca, cb, cc, cd, ce, cf] = values.map((value) => Math.round(value * 0b11));

  return (
    LQIP_MIN +
    ((ca & 0b11) << 18) +
    ((cb & 0b11) << 16) +
    ((cc & 0b11) << 14) +
    ((cd & 0b11) << 12) +
    ((ce & 0b11) << 10) +
    ((cf & 0b11) << 8) +
    ((ll & 0b11) << 6) +
    ((aaa & 0b111) << 3) +
    (bbb & 0b111)
  );
}

// The stylesheet only recognizes a placeholder that came out of encodeLqip, so
// anything arriving from the database or from author-written html is checked
// before it's put on an element.
export function isLqip(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= LQIP_MIN && value <= LQIP_MAX;
}

// The inline style an <img> carries its placeholder in — the stylesheet keys
// off the custom property being present at all. Undefined when there isn't one,
// so it can go straight onto a `style` prop.
export function lqipStyle(value: unknown): CSSProperties | undefined {
  return isLqip(value) ? ({ '--lqip': value } as CSSProperties) : undefined;
}
