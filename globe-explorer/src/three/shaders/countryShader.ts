import {Color, FrontSide} from 'three';
import {MeshStandardNodeMaterial} from 'three/webgpu';
import {color, mix, uniform} from 'three/tsl';

const DEFAULT_COLOR = new Color(0x3a9a5c);
const HOVER_COLOR = new Color(0x6abf8a);
const SELECT_COLOR = new Color(0xf0c040);
const UNMATCHED_COLOR = new Color(0x555555);

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

  material.colorNode = finalColor;

  return {material, baseColor, hoverFactor, selectFactor};
}
