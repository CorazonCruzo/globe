import {color, float, mix, normalWorld, vec3} from 'three/tsl';

const DEEP_COLOR = color(0x0a2a4a);
const SHALLOW_COLOR = color(0x1a6a9a);
const POLE_COLOR = color(0x0e3e6e);

export function createOceanColorNode() {
  const ny = normalWorld.y;
  const absNy = ny.abs();

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

  return vec3(polarBlend);
}
