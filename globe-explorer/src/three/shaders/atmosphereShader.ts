import {AdditiveBlending, BackSide} from 'three';
import {MeshBasicNodeMaterial} from 'three/webgpu';
import {
  cameraPosition,
  float,
  normalize,
  positionWorld,
  pow,
  uniform,
  vec4,
} from 'three/tsl';
import type {Color} from 'three';

/**
 * Thin rim glow — a sharp Fresnel on a slightly larger BackSide sphere.
 * Creates a subtle glowing edge around the globe silhouette.
 */
export function createRimGlowMaterial(glowColor: Color) {
  const material = new MeshBasicNodeMaterial({
    side: BackSide,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  material.toneMapped = false;

  const uColor = uniform(glowColor);
  const uPower = uniform(1.2);
  const uIntensity = uniform(0.015);

  const viewDir = normalize(cameraPosition.sub(positionWorld));
  const normalDir = normalize(positionWorld);
  const fresnel = pow(
    float(1.0).sub(viewDir.dot(normalDir).abs()).clamp(0, 1),
    uPower,
  );

  material.colorNode = vec4(uColor, fresnel.mul(uIntensity));

  return {material, uColor, uPower, uIntensity};
}
