import {describe, expect, it} from 'vitest';
import {Vector3} from 'three';
import {triangulatePolygon} from './triangulate.ts';
import type {BufferAttribute, InterleavedBufferAttribute} from 'three';

describe('triangulatePolygon', () => {
  const getOrientation = (
    positions: BufferAttribute | InterleavedBufferAttribute,
    ia: number,
    ib: number,
    ic: number,
  ) => {
    const a = new Vector3(
      positions.getX(ia),
      positions.getY(ia),
      positions.getZ(ia),
    );
    const b = new Vector3(
      positions.getX(ib),
      positions.getY(ib),
      positions.getZ(ib),
    );
    const c = new Vector3(
      positions.getX(ic),
      positions.getY(ic),
      positions.getZ(ic),
    );

    const ab = b.clone().sub(a);
    const ac = c.clone().sub(a);
    const normal = ab.cross(ac);
    const center = a
      .add(b)
      .add(c)
      .multiplyScalar(1 / 3);

    return normal.dot(center);
  };

  const expectOutwardFacingTriangles = (
    ring: Array<[number, number]>,
    holes: Array<Array<[number, number]>> = [],
  ) => {
    const geometry = triangulatePolygon(ring, holes, 5);
    const positions = geometry.getAttribute('position');
    const index = geometry.getIndex();

    expect(index).not.toBeNull();

    for (let i = 0; i < index!.count; i += 3) {
      const orientation = getOrientation(
        positions,
        index!.getX(i),
        index!.getX(i + 1),
        index!.getX(i + 2),
      );
      expect(orientation).toBeGreaterThan(0);
    }

    geometry.dispose();
  };

  it('triangulates a simple square', () => {
    const ring: Array<[number, number]> = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    const geometry = triangulatePolygon(ring, [], 5);

    expect(geometry).toBeDefined();
    const positions = geometry.getAttribute('position');
    expect(positions.count).toBeGreaterThanOrEqual(4);
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count).toBeGreaterThanOrEqual(6);
    geometry.dispose();
  });

  it('triangulates a polygon with a hole', () => {
    const outer: Array<[number, number]> = [
      [0, 0],
      [20, 0],
      [20, 20],
      [0, 20],
    ];
    const hole: Array<[number, number]> = [
      [5, 5],
      [15, 5],
      [15, 15],
      [5, 15],
    ];
    const geometry = triangulatePolygon(outer, [hole], 5);

    expect(geometry).toBeDefined();
    const positions = geometry.getAttribute('position');
    expect(positions.count).toBeGreaterThanOrEqual(8); // outer + hole
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count).toBeGreaterThan(6); // More than a simple quad
    geometry.dispose();
  });

  it('projects all vertices to the correct radius', () => {
    const ring: Array<[number, number]> = [
      [10, 10],
      [20, 10],
      [20, 20],
      [10, 20],
    ];
    const radius = 5;
    const geometry = triangulatePolygon(ring, [], radius);
    const positions = geometry.getAttribute('position');

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const len = Math.sqrt(x * x + y * y + z * z);
      expect(len).toBeCloseTo(radius, 1);
    }
    geometry.dispose();
  });

  it('produces outward-facing triangles on the sphere surface', () => {
    const ring: Array<[number, number]> = [
      [-60, -15],
      [-35, -15],
      [-35, 5],
      [-60, 5],
    ];
    expectOutwardFacingTriangles(ring);
  });

  it('produces outward-facing triangles for opposite ring winding', () => {
    const ring: Array<[number, number]> = [
      [-60, 5],
      [-35, 5],
      [-35, -15],
      [-60, -15],
    ];

    expectOutwardFacingTriangles(ring);
  });

  it('subdivides large spherical triangles to avoid deep planar dips', () => {
    const ring: Array<[number, number]> = [
      [-20, 0],
      [25, 0],
      [25, 35],
      [-20, 35],
    ];
    const geometry = triangulatePolygon(ring, [], 5.01);
    const positions = geometry.getAttribute('position');
    const index = geometry.getIndex();

    expect(index).not.toBeNull();
    expect(index!.count).toBeGreaterThan(6);
    expect(positions.count).toBeGreaterThan(4);

    geometry.dispose();
  });
});
