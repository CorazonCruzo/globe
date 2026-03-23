import {describe, expect, it} from 'vitest';
import {GLOBE_RADIUS} from '../../lib/constants.ts';
import {
  crossesAntimeridian,
  lonLatToVec3,
  processRing,
  splitRingAtAntimeridian,
  subdivideEdge,
} from './geoProjection.ts';

describe('lonLatToVec3', () => {
  it('projects equator/prime meridian (0, 0) to +Z', () => {
    const v = lonLatToVec3(0, 0, GLOBE_RADIUS);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(GLOBE_RADIUS);
  });

  it('projects north pole (0, 90) to +Y', () => {
    const v = lonLatToVec3(0, 90, GLOBE_RADIUS);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(GLOBE_RADIUS);
    expect(v.z).toBeCloseTo(0);
  });

  it('projects south pole (0, -90) to -Y', () => {
    const v = lonLatToVec3(0, -90, GLOBE_RADIUS);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(-GLOBE_RADIUS);
    expect(v.z).toBeCloseTo(0);
  });

  it('projects (90, 0) to +X axis', () => {
    const v = lonLatToVec3(90, 0, GLOBE_RADIUS);
    expect(v.x).toBeCloseTo(GLOBE_RADIUS);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(0);
  });

  it('preserves radius (length of resulting vector)', () => {
    const v = lonLatToVec3(45, 30, GLOBE_RADIUS);
    expect(v.length()).toBeCloseTo(GLOBE_RADIUS);
  });

  it('reuses output vector when provided', () => {
    const {Vector3} = require('three');
    const out = new Vector3();
    const result = lonLatToVec3(10, 20, 5, out);
    expect(result).toBe(out);
    expect(result.length()).toBeCloseTo(5);
  });
});

describe('subdivideEdge', () => {
  it('does not subdivide short edges', () => {
    const result = subdivideEdge(0, 0, 1, 0, 5);
    expect(result).toEqual([[0, 0]]);
  });

  it('subdivides edges longer than maxAngleDeg', () => {
    const result = subdivideEdge(0, 0, 20, 0, 5);
    expect(result.length).toBeGreaterThan(1);
    // First point should be start
    expect(result[0]).toEqual([0, 0]);
    // Last point should NOT be end (exclusive)
    const last = result[result.length - 1];
    expect(last[0]).not.toBeCloseTo(20);
  });

  it('subdivides great circle path between poles', () => {
    const result = subdivideEdge(0, 0, 0, 90, 5);
    expect(result.length).toBeGreaterThan(1);
    // All points should have lon ≈ 0
    for (const [lon] of result) {
      expect(Math.abs(lon)).toBeLessThan(1);
    }
  });
});

describe('crossesAntimeridian', () => {
  it('returns false for a ring within one hemisphere', () => {
    const ring: Array<[number, number]> = [
      [10, 0],
      [20, 0],
      [20, 10],
      [10, 10],
      [10, 0],
    ];
    expect(crossesAntimeridian(ring)).toBe(false);
  });

  it('returns true for a ring crossing ±180°', () => {
    const ring: Array<[number, number]> = [
      [170, 0],
      [-170, 0],
      [-170, 10],
      [170, 10],
      [170, 0],
    ];
    expect(crossesAntimeridian(ring)).toBe(true);
  });
});

describe('splitRingAtAntimeridian', () => {
  it('splits a ring crossing the antimeridian into west and east', () => {
    const ring: Array<[number, number]> = [
      [170, 0],
      [-170, 0],
      [-170, 10],
      [170, 10],
    ];
    const [west, east] = splitRingAtAntimeridian(ring);
    expect(west.length).toBeGreaterThan(0);
    expect(east.length).toBeGreaterThan(0);
    // West points should have lon <= 0 or == -180
    for (const [lon] of west) {
      expect(lon).toBeLessThanOrEqual(0);
    }
    // East points should have lon >= 0 or == 180
    for (const [lon] of east) {
      expect(lon).toBeGreaterThanOrEqual(0);
    }
  });

  it('does not generate NaN seam vertices when ring already contains +/-180', () => {
    const ring: Array<[number, number]> = [
      [-180, -16.556],
      [-179.79, -16.02],
      [179.41, -16.37],
      [180, -16.06],
    ];

    const [west, east] = splitRingAtAntimeridian(ring);

    for (const [lon, lat] of [...west, ...east]) {
      expect(Number.isFinite(lon)).toBe(true);
      expect(Number.isFinite(lat)).toBe(true);
    }
  });
});

describe('processRing', () => {
  it('strips closing duplicate vertex', () => {
    const ring: Array<[number, number]> = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ];
    const result = processRing(ring);
    expect(result.length).toBe(4);
    expect(result).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
  });

  it('returns ring as-is if not closed', () => {
    const ring: Array<[number, number]> = [
      [0, 0],
      [30, 0],
      [30, 30],
      [0, 30],
    ];
    const result = processRing(ring);
    expect(result.length).toBe(4);
    expect(result).toEqual(ring);
  });

  it('does not subdivide edges (preserves original vertices)', () => {
    const ring: Array<[number, number]> = [
      [0, 0],
      [30, 0],
      [30, 30],
      [0, 30],
      [0, 0],
    ];
    const result = processRing(ring);
    // Only strips closing duplicate, no subdivision
    expect(result.length).toBe(4);
  });

  it('drops non-finite and consecutive duplicate vertices', () => {
    const ring: Array<[number, number]> = [
      [0, 0],
      [0, 0],
      [10, 5],
      [10, Number.NaN],
      [20, 10],
      [20, 10],
    ];
    const result = processRing(ring);

    expect(result).toEqual([
      [0, 0],
      [10, 5],
      [20, 10],
    ]);
  });
});
