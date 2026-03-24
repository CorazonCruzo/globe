import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
} from 'three';
import {Object3DFeature} from '@vladkrutenyuk/three-kvy-core';
import type {CoreContext} from '@vladkrutenyuk/three-kvy-core';
import type {GlobeModules} from '../types.ts';

const STAR_COUNT = 900;
const STARFIELD_RADIUS = 80;
const STARFIELD_RADIUS_VARIANCE = 10;
const STAR_MIN_BRIGHTNESS = 0.35;
const STAR_MAX_BRIGHTNESS = 0.85;
const STAR_SIZE = 1.15;
const STARFIELD_SEED = 0x51a7f1d;

export interface StarfieldAttributes {
  positions: Float32Array;
  colors: Float32Array;
}

export function buildStarfieldAttributes(
  count: number,
  radius: number,
  radiusVariance: number,
  seed: number = STARFIELD_SEED,
): StarfieldAttributes {
  const random = createRng(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cool = new Color(0xc9dcff);
  const neutral = new Color(0xf8fbff);
  const color = new Color();

  for (let i = 0; i < count; i++) {
    const theta = random() * Math.PI * 2;
    const z = random() * 2 - 1;
    const radial = Math.sqrt(1 - z * z);
    const starRadius = radius + random() * radiusVariance;
    const brightness =
      STAR_MIN_BRIGHTNESS +
      (STAR_MAX_BRIGHTNESS - STAR_MIN_BRIGHTNESS) * Math.pow(random(), 2.2);
    color
      .copy(cool)
      .lerp(neutral, random() * 0.8 + 0.2)
      .multiplyScalar(brightness);

    positions[i * 3] = Math.cos(theta) * radial * starRadius;
    positions[i * 3 + 1] = z * starRadius;
    positions[i * 3 + 2] = Math.sin(theta) * radial * starRadius;

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  return {positions, colors};
}

export class StarfieldFeature extends Object3DFeature<GlobeModules> {
  protected useCtx(ctx: CoreContext<GlobeModules>) {
    const {positions, colors} = buildStarfieldAttributes(
      STAR_COUNT,
      STARFIELD_RADIUS,
      STARFIELD_RADIUS_VARIANCE,
    );

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

    const material = new PointsMaterial({
      size: STAR_SIZE,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthTest: true,
      depthWrite: false,
    });

    const points = new Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = -20;
    this.object.add(points);

    const onBeforeRender = () => {
      points.position.copy(ctx.three.camera.position);
    };
    onBeforeRender();
    ctx.three.on('renderbefore', onBeforeRender);

    return () => {
      ctx.three.off('renderbefore', onBeforeRender);
      this.object.remove(points);
      geometry.dispose();
      material.dispose();
    };
  }
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
