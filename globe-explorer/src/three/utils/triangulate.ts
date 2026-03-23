import earcut from 'earcut';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Uint32BufferAttribute,
} from 'three';
import {lonLatToVec3} from './geoProjection.ts';

interface Vec2 {
  x: number;
  y: number;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Triangulate a single polygon (with optional holes) and project onto a sphere.
 *
 * The polygon is first projected to a local 2D plane around its spherical
 * center, so countries that cross the antimeridian or approach the poles
 * remain continuous for earcut.
 */
export function triangulatePolygon(
  outerRing: Array<[number, number]>,
  holes: Array<Array<[number, number]>>,
  radius: number,
): BufferGeometry {
  const outerPositions = outerRing.map(([lon, lat]) =>
    toPlainVec3(lonLatToVec3(lon, lat, radius)),
  );
  const holePositions = holes.map((hole) =>
    hole.map(([lon, lat]) => toPlainVec3(lonLatToVec3(lon, lat, radius))),
  );

  const basis = createLocalBasis(outerPositions);
  const positions: Array<Vec3> = [];
  const flatCoords: Array<number> = [];
  const holeIndices: Array<number> = [];

  appendRing(outerPositions, positions, flatCoords, basis);

  for (const hole of holePositions) {
    holeIndices.push(positions.length);
    appendRing(hole, positions, flatCoords, basis);
  }

  const indices = Array.from(
    earcut(flatCoords, holeIndices.length > 0 ? holeIndices : undefined, 2),
  );

  const subdivisionDepth = getSubdivisionDepth(positions, indices, radius);
  const refined = subdivideMesh(positions, indices, radius, subdivisionDepth);
  normalizeTriangleWindings(refined.positions, refined.indices);

  const flatPositions = new Float32Array(refined.positions.length * 3);
  const normals = new Float32Array(refined.positions.length * 3);

  for (let i = 0; i < refined.positions.length; i++) {
    const vertex = refined.positions[i];
    flatPositions[i * 3] = vertex.x;
    flatPositions[i * 3 + 1] = vertex.y;
    flatPositions[i * 3 + 2] = vertex.z;

    const invLength = 1 / Math.hypot(vertex.x, vertex.y, vertex.z);
    normals[i * 3] = vertex.x * invLength;
    normals[i * 3 + 1] = vertex.y * invLength;
    normals[i * 3 + 2] = vertex.z * invLength;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(flatPositions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setIndex(new Uint32BufferAttribute(new Uint32Array(refined.indices), 1));

  return geometry;
}

function appendRing(
  ring: Array<Vec3>,
  positions: Array<Vec3>,
  flatCoords: Array<number>,
  basis: {xAxis: Vec3; yAxis: Vec3},
) {
  for (const vertex of ring) {
    positions.push(vertex);
    const projected = projectToLocalPlane(vertex, basis);
    flatCoords.push(projected.x, projected.y);
  }
}

function createLocalBasis(vertices: Array<Vec3>) {
  const center = normalizeVec3(sumVec3(vertices));
  const reference =
    Math.abs(center.y) > 0.9
      ? {x: 1, y: 0, z: 0}
      : {x: 0, y: 1, z: 0};

  const xAxis = normalizeVec3(crossVec3(reference, center));
  const yAxis = normalizeVec3(crossVec3(center, xAxis));

  return {xAxis, yAxis};
}

function projectToLocalPlane(
  vertex: Vec3,
  basis: {xAxis: Vec3; yAxis: Vec3},
): Vec2 {
  return {
    x: dotVec3(vertex, basis.xAxis),
    y: dotVec3(vertex, basis.yAxis),
  };
}

function getSubdivisionDepth(
  positions: Array<Vec3>,
  indices: Array<number>,
  radius: number,
) {
  let maxEdgeAngleDeg = 0;

  for (let i = 0; i < indices.length; i += 3) {
    const a = positions[indices[i]];
    const b = positions[indices[i + 1]];
    const c = positions[indices[i + 2]];

    maxEdgeAngleDeg = Math.max(
      maxEdgeAngleDeg,
      getEdgeAngleDeg(a, b, radius),
      getEdgeAngleDeg(b, c, radius),
      getEdgeAngleDeg(c, a, radius),
    );
  }

  // Depth 2 is the minimum needed to keep ordinary country triangles above
  // the ocean sphere. Very large countries (for example Canada / Russia)
  // need one extra level to avoid residual dips.
  if (maxEdgeAngleDeg > 30) return 3;
  return 2;
}

function subdivideMesh(
  basePositions: Array<Vec3>,
  baseIndices: Array<number>,
  radius: number,
  depth: number,
) {
  const positions = [...basePositions];
  let indices = [...baseIndices];

  for (let level = 0; level < depth; level++) {
    const midpointCache = new Map<string, number>();
    const nextIndices: Array<number> = [];

    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i];
      let b = indices[i + 1];
      let c = indices[i + 2];

      if (getTriangleOrientation(positions[a], positions[b], positions[c]) < 0) {
        [b, c] = [c, b];
      }

      const ab = getMidpointIndex(positions, midpointCache, a, b, radius);
      const bc = getMidpointIndex(positions, midpointCache, b, c, radius);
      const ca = getMidpointIndex(positions, midpointCache, c, a, radius);

      nextIndices.push(
        a,
        ab,
        ca,
        ab,
        b,
        bc,
        ca,
        bc,
        c,
        ab,
        bc,
        ca,
      );
    }

    indices = nextIndices;
  }

  return {positions, indices};
}

function getMidpointIndex(
  positions: Array<Vec3>,
  midpointCache: Map<string, number>,
  a: number,
  b: number,
  radius: number,
) {
  const key = a < b ? `${a}:${b}` : `${b}:${a}`;
  const cached = midpointCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const midpoint = normalizeToRadius(
    {
      x: positions[a].x + positions[b].x,
      y: positions[a].y + positions[b].y,
      z: positions[a].z + positions[b].z,
    },
    radius,
  );

  const index = positions.length;
  positions.push(midpoint);
  midpointCache.set(key, index);
  return index;
}

function normalizeTriangleWindings(
  positions: Array<Vec3>,
  indices: Array<number>,
) {
  for (let i = 0; i < indices.length; i += 3) {
    if (
      getTriangleOrientation(
        positions[indices[i]],
        positions[indices[i + 1]],
        positions[indices[i + 2]],
      ) < 0
    ) {
      const second = indices[i + 1];
      indices[i + 1] = indices[i + 2];
      indices[i + 2] = second;
    }
  }
}

function getTriangleOrientation(a: Vec3, b: Vec3, c: Vec3) {
  const ab = subtractVec3(b, a);
  const ac = subtractVec3(c, a);
  const normal = crossVec3(ab, ac);
  const center = {
    x: (a.x + b.x + c.x) / 3,
    y: (a.y + b.y + c.y) / 3,
    z: (a.z + b.z + c.z) / 3,
  };

  return dotVec3(normal, center);
}

function getEdgeAngleDeg(a: Vec3, b: Vec3, radius: number) {
  const normalizedDot = Math.min(
    1,
    Math.max(-1, dotVec3(a, b) / (radius * radius)),
  );

  return (Math.acos(normalizedDot) * 180) / Math.PI;
}

function toPlainVec3(vertex: {x: number; y: number; z: number}): Vec3 {
  return {x: vertex.x, y: vertex.y, z: vertex.z};
}

function sumVec3(vertices: Array<Vec3>) {
  const result = {x: 0, y: 0, z: 0};
  for (const vertex of vertices) {
    result.x += vertex.x;
    result.y += vertex.y;
    result.z += vertex.z;
  }
  return result;
}

function normalizeVec3(vector: Vec3) {
  const length = Math.hypot(vector.x, vector.y, vector.z);

  if (length < 1e-9) {
    return {x: 0, y: -1, z: 0};
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

function normalizeToRadius(vector: Vec3, radius: number) {
  const normalized = normalizeVec3(vector);
  return {
    x: normalized.x * radius,
    y: normalized.y * radius,
    z: normalized.z * radius,
  };
}

function subtractVec3(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

function crossVec3(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dotVec3(a: Vec3, b: Vec3) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
