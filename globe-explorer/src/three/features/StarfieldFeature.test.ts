import {describe, expect, it} from 'vitest';
import {buildStarfieldAttributes} from './StarfieldFeature.ts';

describe('buildStarfieldAttributes', () => {
  it('builds deterministic star positions and colors for a given seed', () => {
    const a = buildStarfieldAttributes(12, 80, 10, 12345);
    const b = buildStarfieldAttributes(12, 80, 10, 12345);

    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
    expect(Array.from(a.colors)).toEqual(Array.from(b.colors));
  });

  it('keeps stars within the configured shell radius', () => {
    const radius = 80;
    const variance = 10;
    const {positions} = buildStarfieldAttributes(24, radius, variance, 7);

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      const length = Math.sqrt(x * x + y * y + z * z);
      expect(length).toBeGreaterThanOrEqual(radius);
      expect(length).toBeLessThanOrEqual(radius + variance);
    }
  });

  it('generates non-black subtle star colors', () => {
    const {colors} = buildStarfieldAttributes(10, 80, 10, 99);

    for (let i = 0; i < colors.length; i += 3) {
      expect(colors[i]).toBeGreaterThan(0);
      expect(colors[i + 1]).toBeGreaterThan(0);
      expect(colors[i + 2]).toBeGreaterThan(0);
      expect(colors[i]).toBeLessThanOrEqual(1);
      expect(colors[i + 1]).toBeLessThanOrEqual(1);
      expect(colors[i + 2]).toBeLessThanOrEqual(1);
    }
  });
});
