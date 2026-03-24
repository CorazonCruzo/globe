import {
  AmbientLight,
  DirectionalLight,
  Mesh,
  MeshStandardNodeMaterial,
  SphereGeometry,
} from 'three/webgpu';
import {Object3DFeature} from '@vladkrutenyuk/three-kvy-core';
import {GLOBE_RADIUS} from '../../lib/constants.ts';
import {createOceanColorNode} from '../shaders/oceanShader.ts';
import type {CoreContext} from '@vladkrutenyuk/three-kvy-core';
import type {GlobeModules} from '../types.ts';

export class GlobeFeature extends Object3DFeature<GlobeModules> {
  protected useCtx(ctx: CoreContext<GlobeModules>) {
    // Ocean sphere
    const geometry = new SphereGeometry(GLOBE_RADIUS, 64, 64);
    const material = new MeshStandardNodeMaterial({
      roughness: 0.6,
      metalness: 0.1,
    });
    material.colorNode = createOceanColorNode();

    const sphere = new Mesh(geometry, material);
    this.object.add(sphere);

    // Lighting
    const ambientLight = new AmbientLight(0xffffff, 0.4);
    const dirLight = new DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(10, 10, 10);
    const dirLight2 = new DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-5, -3, -8);

    ctx.three.scene.add(ambientLight);
    ctx.three.scene.add(dirLight);
    ctx.three.scene.add(dirLight2);

    return () => {
      this.object.remove(sphere);
      geometry.dispose();
      material.dispose();
      ctx.three.scene.remove(ambientLight);
      ctx.three.scene.remove(dirLight);
      ctx.three.scene.remove(dirLight2);
      ambientLight.dispose();
      dirLight.dispose();
      dirLight2.dispose();
    };
  }
}
