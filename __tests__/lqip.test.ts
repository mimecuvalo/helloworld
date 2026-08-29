import { describe, expect, it } from 'vitest';
import { LQIP_MAX, LQIP_MIN, encodeLqip, isLqip, lqipStyle, rgbToOklab, type Rgb } from 'lib/lqip';
import { decodePngPixels } from 'server/services/images';

// What styles/lqip.css does to the integer, in javascript — the encoder is only
// correct insofar as this comes back out the other end.
function decodeLqip(value: number) {
  const bits = value + 2 ** 19;
  const at = (shift: number, width: number) => Math.floor(bits / 2 ** shift) % width;
  return {
    ca: at(18, 4),
    cb: at(16, 4),
    cc: at(14, 4),
    cd: at(12, 4),
    ce: at(10, 4),
    cf: at(8, 4),
    ll: at(6, 4),
    aaa: at(3, 8),
    bbb: at(0, 8),
  };
}

const grey = (level: number): Rgb => ({ r: level, g: level, b: level });

describe('the lqip encoder', () => {
  it('packs the six cells into the bits the stylesheet reads them out of', () => {
    // Dark to light across the top row, light to dark across the bottom, so
    // every cell lands on a different level and none can be swapped for another.
    const cells = [grey(0), grey(120), grey(255), grey(255), grey(120), grey(0)];
    const decoded = decodeLqip(encodeLqip({ cells, base: grey(128) }));

    expect(decoded.ca).toBeLessThan(decoded.cb);
    expect(decoded.cb).toBeLessThan(decoded.cc);
    expect([decoded.cd, decoded.ce, decoded.cf]).toEqual([decoded.cc, decoded.cb, decoded.ca]);
  });

  it('keeps the base colour close to the one it was given', () => {
    const sky = { r: 70, g: 130, b: 200 };
    const { ll, aaa, bbb } = decodeLqip(encodeLqip({ cells: Array(6).fill(sky), base: sky }));

    const target = rgbToOklab(sky);
    const encoded = {
      L: (ll / 0b11) * 0.6 + 0.2,
      a: (aaa / 0b1000) * 0.7 - 0.35,
      b: ((bbb + 1) / 0b1000) * 0.7 - 0.35,
    };
    // Blue: negative b, and a nearly neutral a.
    expect(encoded.b).toBeLessThan(0);
    expect(Math.abs(encoded.L - target.L)).toBeLessThan(0.15);
    expect(Math.abs(encoded.b - target.b)).toBeLessThan(0.1);
  });

  it('stays inside the range browsers keep custom properties exact within', () => {
    const extremes: Rgb[] = [
      grey(0),
      grey(255),
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
    ];
    for (const base of extremes) {
      for (const cell of extremes) {
        const value = encodeLqip({ cells: Array(6).fill(cell), base });
        expect(value).toBeGreaterThanOrEqual(LQIP_MIN);
        expect(value).toBeLessThanOrEqual(LQIP_MAX);
        expect(Number.isInteger(value)).toBe(true);
      }
    }
  });

  it('refuses a preview that isn’t 3x2', () => {
    expect(() => encodeLqip({ cells: [grey(0), grey(255)], base: grey(128) })).toThrow(/3x2/);
  });

  it('recognizes its own values and nothing else', () => {
    expect(isLqip(encodeLqip({ cells: Array(6).fill(grey(40)), base: grey(40) }))).toBe(true);
    expect(isLqip(LQIP_MIN - 1)).toBe(false);
    expect(isLqip(LQIP_MAX + 1)).toBe(false);
    expect(isLqip(1.5)).toBe(false);
    expect(isLqip('192900')).toBe(false);
    expect(isLqip(null)).toBe(false);
  });

  it('only hands back a style for a value it recognizes', () => {
    expect(lqipStyle(192900)).toEqual({ '--lqip': 192900 });
    expect(lqipStyle(null)).toBeUndefined();
    expect(lqipStyle('192900')).toBeUndefined();
  });
});

describe('reading the pixels back out of a preview png', () => {
  // A real 3x2 png as Bun.Image writes them: 8-bit rgba, non-interlaced,
  // adaptively filtered. Whatever else changes, this is the shape the
  // placeholder pipeline has to keep reading.
  const PREVIEW =
    'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAACddGYaAAAAIklEQVR4nAXBQREAMBACMab/wy9a8cI20d2RBNu8bWorQB+UTg1EE6pbEQAAAABJRU5ErkJggg==';

  it('gets six pixels out of a 3x2', () => {
    const pixels = decodePngPixels(Uint8Array.from(Buffer.from(PREVIEW, 'base64')));
    expect(pixels).toEqual([
      { r: 13, g: 13, b: 13 },
      { r: 121, g: 121, b: 121 },
      { r: 14, g: 14, b: 14 },
      { r: 11, g: 11, b: 11 },
      { r: 84, g: 84, b: 84 },
      { r: 13, g: 13, b: 13 },
    ]);
  });

  it('gives up rather than guessing at something that is not a png it wrote', () => {
    expect(decodePngPixels(Uint8Array.from([1, 2, 3, 4]))).toEqual([]);
  });
});
