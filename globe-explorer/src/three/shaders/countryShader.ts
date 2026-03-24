import {Color, FrontSide, MeshStandardNodeMaterial} from 'three/webgpu';
import {color, float, mix, normalWorld, normalize, uniform} from 'three/tsl';
import {sunDirUniform} from './sunUniform.ts';

const DEFAULT_COLOR = new Color(0x3a9a5c);
const HOVER_COLOR = new Color(0x6abf8a);
const SELECT_COLOR = new Color(0xf0c040);
const UNMATCHED_COLOR = new Color(0x555555);
const DAY_TINT = new Color(0x7fbe92);
const TWILIGHT_TINT = new Color(0x5f87a0);

export function createCountryMaterial(matched: boolean) {
  const material = new MeshStandardNodeMaterial({
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    roughness: 0.7,
    metalness: 0.1,
    side: FrontSide,
  });

  const baseColor = uniform(matched ? DEFAULT_COLOR : UNMATCHED_COLOR);
  const hoverFactor = uniform(0);
  const selectFactor = uniform(0);

  const hoverMix = mix(baseColor, color(HOVER_COLOR), hoverFactor);
  const finalColor = mix(hoverMix, color(SELECT_COLOR), selectFactor);
  const normalDir = normalize(normalWorld);
  const sunDir = normalize(sunDirUniform);
  const sunFacing = normalDir.dot(sunDir);
  const sunLit = sunFacing.clamp(0, 1);
  const daylightLift = sunLit
    .smoothstep(float(0.04), float(0.84))
    .mul(float(0.48));
  const twilightBand = float(1.0)
    .sub(sunFacing.abs().smoothstep(float(0.03), float(0.14)))
    .mul(float(0.1));
  const shadedColor = mix(finalColor, color(DAY_TINT), daylightLift);
  const terminatorColor = mix(shadedColor, color(TWILIGHT_TINT), twilightBand);

  material.colorNode = terminatorColor;

  return {material, baseColor, hoverFactor, selectFactor};
}
