import {Vector3} from 'three';
import {DEG2RAD, SUBDIVISION_MAX_ANGLE_DEG} from '../../lib/constants.ts';

/**
 * Convert lon/lat (degrees) to a 3D position on a sphere of given radius.
 * Convention: Y-up, lon=0 faces +Z, positive lon goes toward +X.
 */
export function lonLatToVec3(
  lon: number,
  lat: number,
  radius: number,
  out?: Vector3,
): Vector3 {
  const phi = lat * DEG2RAD;
  const theta = lon * DEG2RAD;
  const cosPhi = Math.cos(phi);

  const x = radius * cosPhi * Math.sin(theta);
  const y = radius * Math.sin(phi);
  const z = radius * cosPhi * Math.cos(theta);

  if (out) {
    out.set(x, y, z);
    return out;
  }
  return new Vector3(x, y, z);
}

/**
 * Subdivide a line segment along a great circle arc if it exceeds maxAngleDeg.
 * Returns array of [lon, lat] including start but NOT including end.
 */
export function subdivideEdge(
  lon0: number,
  lat0: number,
  lon1: number,
  lat1: number,
  maxAngleDeg: number = SUBDIVISION_MAX_ANGLE_DEG,
): Array<[number, number]> {
  const p0 = lonLatToVec3(lon0, lat0, 1);
  const p1 = lonLatToVec3(lon1, lat1, 1);
  const angle = Math.acos(Math.min(1, Math.max(-1, p0.dot(p1))));
  const angleDeg = angle / DEG2RAD;

  if (angleDeg <= maxAngleDeg) {
    return [[lon0, lat0]];
  }

  const n = Math.ceil(angleDeg / maxAngleDeg);
  const result: Array<[number, number]> = [];
  const sinAngle = Math.sin(angle);

  for (let i = 0; i < n; i++) {
    const t = i / n;
    // Slerp on unit sphere
    const a = Math.sin((1 - t) * angle) / sinAngle;
    const b = Math.sin(t * angle) / sinAngle;
    const px = a * p0.x + b * p1.x;
    const py = a * p0.y + b * p1.y;
    const pz = a * p0.z + b * p1.z;

    // Convert back to lon/lat
    const lat = Math.asin(Math.min(1, Math.max(-1, py))) / DEG2RAD;
    const lon = Math.atan2(px, pz) / DEG2RAD;
    result.push([lon, lat]);
  }

  return result;
}

/**
 * Check if a polygon ring crosses the antimeridian (±180°).
 */
export function crossesAntimeridian(ring: Array<[number, number]>): boolean {
  for (let i = 0; i < ring.length - 1; i++) {
    const dLon = Math.abs(ring[i + 1][0] - ring[i][0]);
    if (dLon > 180) {
      return true;
    }
  }
  return false;
}

/**
 * Split a polygon ring at the antimeridian. Returns two new rings:
 * one for the western hemisphere, one for the eastern.
 */
export function splitRingAtAntimeridian(
  ring: Array<[number, number]>,
): [Array<[number, number]>, Array<[number, number]>] {
  const west: Array<[number, number]> = [];
  const east: Array<[number, number]> = [];

  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    const nextIdx = (i + 1) % ring.length;
    const [nextLon, nextLat] = ring[nextIdx];

    if (lon <= 0) {
      pushUniqueVertex(west, [lon, lat]);
    } else {
      pushUniqueVertex(east, [lon, lat]);
    }

    const dLon = Math.abs(nextLon - lon);
    if (dLon > 180 && i < ring.length - 1) {
      // Crossing antimeridian — interpolate the crossing point
      const lonA = lon < 0 ? lon + 360 : lon;
      const lonB = nextLon < 0 ? nextLon + 360 : nextLon;
      const denom = lonB - lonA;
      if (Math.abs(denom) < 1e-9) {
        continue;
      }
      const t = (180 - lonA) / denom;
      if (!Number.isFinite(t) || t <= 0 || t >= 1) {
        continue;
      }
      const crossLat = lat + t * (nextLat - lat);
      if (!Number.isFinite(crossLat)) {
        continue;
      }

      if (lon <= 0) {
        pushUniqueVertex(west, [-180, crossLat]);
        pushUniqueVertex(east, [180, crossLat]);
      } else {
        pushUniqueVertex(east, [180, crossLat]);
        pushUniqueVertex(west, [-180, crossLat]);
      }
    }
  }

  return [west, east];
}

/**
 * Process a GeoJSON ring: strip closing duplicate vertex.
 * Subdivision is intentionally NOT applied before earcut triangulation,
 * because great-circle intermediate points create non-straight edges
 * in the lon/lat plane, causing self-intersections that break earcut.
 * For 110m data the vertex density is sufficient without subdivision.
 */
export function processRing(
  ring: Array<[number, number]>,
): Array<[number, number]> {
  // GeoJSON rings are closed (first == last), strip the closing duplicate
  const trimmed =
    ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring;

  const result: Array<[number, number]> = [];
  for (const [lon, lat] of trimmed) {
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      continue;
    }
    pushUniqueVertex(result, [lon, lat]);
  }

  return result;
}

function pushUniqueVertex(
  vertices: Array<[number, number]>,
  vertex: [number, number],
) {
  if (vertices.length > 0) {
    const last = vertices[vertices.length - 1];
    if (last[0] === vertex[0] && last[1] === vertex[1]) {
      return;
    }
  }
  vertices.push(vertex);
}
