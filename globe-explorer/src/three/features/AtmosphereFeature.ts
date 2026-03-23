import {Color, Mesh, SphereGeometry} from 'three';
import {Object3DFeature} from '@vladkrutenyuk/three-kvy-core';
import {GLOBE_RADIUS} from '../../lib/constants.ts';
import {createRimGlowMaterial} from '../shaders/atmosphereShader.ts';
import type {CoreContext} from '@vladkrutenyuk/three-kvy-core';
import type {GlobeModules} from '../types.ts';

/**
 * Thin white rim glow around the globe edge.
 * Just slightly larger than the globe — creates a 2-3px glowing outline.
 */
export class AtmosphereFeature extends Object3DFeature<GlobeModules> {
  protected useCtx(_ctx: CoreContext<GlobeModules>) {
    const geometry = new SphereGeometry(GLOBE_RADIUS * 1.004, 64, 64);
    const {material} = createRimGlowMaterial(new Color(0xc8ddf0));

    const mesh = new Mesh(geometry, material);
    mesh.renderOrder = -1;
    this.object.add(mesh);

    return () => {
      this.object.remove(mesh);
      geometry.dispose();
      material.dispose();
    };
  }
}
