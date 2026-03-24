import {Vector3} from 'three/webgpu';

const DEG2RAD = Math.PI / 180;

/**
 * Compute a unit direction vector pointing from Earth's center toward the Sun,
 * based on the current UTC time.
 *
 * Uses a simplified astronomical model:
 * - Declination: axial tilt modulated by day-of-year (max ±23.44°)
 * - Hour angle: the Sun is at solar noon over longitude 0° at 12:00 UTC,
 *   and moves 15°/hour westward.
 *
 * The coordinate system matches the globe (Y-up, lon=0 → +Z, lon>0 → +X).
 */
export function getSunDirection(date: Date = new Date()): Vector3 {
  // Day of year (0-based)
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = (date.getTime() - start) / 86_400_000;

  // Solar declination (simplified, ignoring equation of time)
  const declination = 23.44 * Math.sin(((360 / 365) * (dayOfYear - 81)) * DEG2RAD);
  const decRad = declination * DEG2RAD;

  // Subsolar longitude: at 12:00 UTC the sun is over lon=0.
  // Each hour shifts 15° westward (negative direction).
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const sunLon = -15 * (utcHours - 12);
  const lonRad = sunLon * DEG2RAD;

  // Convert (lon, lat) to unit vector (Y-up, lon=0 → +Z, lon>0 → +X)
  const cosLat = Math.cos(decRad);
  return new Vector3(
    cosLat * Math.sin(lonRad),
    Math.sin(decRad),
    cosLat * Math.cos(lonRad),
  );
}
