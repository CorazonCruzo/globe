import {
  cameraPosition,
  color,
  float,
  mix,
  normalWorld,
  normalize,
  positionWorld,
  pow,
} from 'three/tsl';
import {sunDirUniform} from './sunUniform.ts';

const DEEP_COLOR = color(0x0a2a4a);
const SHALLOW_COLOR = color(0x1a6a9a);
const POLE_COLOR = color(0x0e3e6e);
const DAY_TINT = color(0x3d88b5);
const TWILIGHT_TINT = color(0x2f6788);
const GLINT_TINT = color(0xdceeff);

export function createOceanColorNode() {
  const normalDir = normalize(normalWorld);
  const ny = normalDir.y;
  const absNy = ny.abs();
  const sunDir = normalize(sunDirUniform);
  const viewDir = normalize(cameraPosition.sub(positionWorld));
  const sunFacing = normalDir.dot(sunDir);
  const sunLit = sunFacing.clamp(0, 1);
  const halfDir = normalize(sunDir.add(viewDir));

  const baseColor = mix(
    DEEP_COLOR,
    SHALLOW_COLOR,
    absNy.oneMinus().mul(float(0.6)),
  );
  const polarBlend = mix(
    baseColor,
    POLE_COLOR,
    absNy.smoothstep(float(0.7), float(1.0)),
  );
  const daylightLift = sunLit
    .smoothstep(float(0.05), float(0.88))
    .mul(float(0.52));
  const twilightBand = float(1.0)
    .sub(sunFacing.abs().smoothstep(float(0.035), float(0.16)))
    .mul(float(0.16));
  const litColor = mix(polarBlend, DAY_TINT, daylightLift);
  const glint = pow(normalDir.dot(halfDir).clamp(0, 1), float(80))
    .mul(sunLit.smoothstep(float(0.2), float(0.95)))
    .mul(float(0.3));
  const twilightColor = mix(litColor, TWILIGHT_TINT, twilightBand);
  const finalColor = mix(twilightColor, GLINT_TINT, glint);

  return finalColor;
}
