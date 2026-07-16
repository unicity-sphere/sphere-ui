import { describe, it, expect } from 'vitest';
import { centreRect } from '../crop-rect.js';

describe('centreRect', () => {
  it('returns the full image when the source already matches the ratio', () => {
    expect(centreRect(1920, 640, 3)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });

  it('crops the sides of a too-wide source, centred', () => {
    // 2000x500 is 4:1; a 3:1 crop keeps 1500px of width, centred -> 250px inset.
    const rect = centreRect(2000, 500, 3);
    expect(rect.width).toBeCloseTo(0.75, 5);
    expect(rect.height).toBe(1);
    expect(rect.x).toBeCloseTo(0.125, 5);
    expect(rect.y).toBe(0);
  });

  it('crops the top and bottom of a too-tall source, centred', () => {
    // 1200x600 is 2:1; a 3:1 crop keeps 400px of height, centred -> 100px inset.
    const rect = centreRect(1200, 600, 3);
    expect(rect.width).toBe(1);
    expect(rect.height).toBeCloseTo(400 / 600, 5);
    expect(rect.x).toBe(0);
    expect(rect.y).toBeCloseTo(100 / 600, 5);
  });

  it('produces a rect whose PIXEL ratio is the target, not its fraction ratio', () => {
    const nw = 2000;
    const nh = 500;
    const rect = centreRect(nw, nh, 3);
    // The invariant that matters. rect.width / rect.height is 0.75, not 3 —
    // fraction-space ratio is not pixel-space ratio, and confusing the two
    // mis-frames every source whose ratio is not already the target.
    expect((rect.width * nw) / (rect.height * nh)).toBeCloseTo(3, 5);
  });
});
