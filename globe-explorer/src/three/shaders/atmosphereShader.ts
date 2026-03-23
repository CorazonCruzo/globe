import {AdditiveBlending, BackSide} from 'three';
import {MeshBasicNodeMaterial} from 'three/webgpu';
import {
  cameraPosition,
  float,
  mix,
  normalize,
  positionWorld,
  pow,
  smoothstep,
  uniform,
  vec4,
} from 'three/tsl';
import type {Color, Vector3} from 'three';

export interface AtmosphereMaterialOptions {
  glowColor: Color;
  warmColor: Color;
  sunDirection: Vector3;
  intensity: number;
  rimPower: number;
  daylightFloor: number;
  sunHaloPower: number;
  sunHaloStrength: number;
}

export function createAtmosphereMaterial(options: AtmosphereMaterialOptions) {
  const material = new MeshBasicNodeMaterial({
    side: BackSide,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  material.toneMapped = false;

  const uGlowColor = uniform(options.glowColor);
  const uWarmColor = uniform(options.warmColor);
  const uSunDirection = uniform(options.sunDirection.clone().normalize());
  const uIntensity = uniform(options.intensity);
  const uRimPower = uniform(options.rimPower);
  const uDaylightFloor = uniform(options.daylightFloor);
  const uSunHaloPower = uniform(options.sunHaloPower);
  const uSunHaloStrength = uniform(options.sunHaloStrength);

  const viewDir = normalize(cameraPosition.sub(positionWorld));
  const normalDir = normalize(positionWorld);
  const rimInput = float(1.0).sub(viewDir.dot(normalDir).abs()).clamp();
  const rim = pow(rimInput, uRimPower);
  const wideRim = pow(rimInput, float(2.4));
  const sunAmount = normalDir.dot(normalize(uSunDirection)).clamp();
  const daylight = mix(
    uDaylightFloor,
    float(1.0),
    smoothstep(float(0.02), float(0.55), sunAmount),
  );
  const sunHalo = pow(sunAmount, uSunHaloPower)
    .mul(wideRim)
    .mul(uSunHaloStrength);
  const alpha = rim.mul(uIntensity).mul(daylight).add(sunHalo).clamp(0.0, 1.0);
  const tint = mix(uGlowColor, uWarmColor, sunHalo.clamp());

  material.colorNode = vec4(tint, alpha);

  return {material};
}
