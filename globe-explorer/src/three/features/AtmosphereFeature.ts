import {Color, Mesh, SphereGeometry, Vector3} from 'three';
import {Object3DFeature} from '@vladkrutenyuk/three-kvy-core';
import {GLOBE_RADIUS} from '../../lib/constants.ts';
import {createAtmosphereMaterial} from '../shaders/atmosphereShader.ts';
import type {CoreContext} from '@vladkrutenyuk/three-kvy-core';
import type {GlobeModules} from '../types.ts';

const INNER_ATMOSPHERE_SCALE = 1.012;
const OUTER_ATMOSPHERE_SCALE = 1.026;
const ATMOSPHERE_SEGMENTS = 96;
const SUN_DIRECTION = new Vector3(10, 10, 10).normalize();

export class AtmosphereFeature extends Object3DFeature<GlobeModules> {
  protected useCtx(_ctx: CoreContext<GlobeModules>) {
    const innerGeometry = new SphereGeometry(
      GLOBE_RADIUS * INNER_ATMOSPHERE_SCALE,
      ATMOSPHERE_SEGMENTS,
      ATMOSPHERE_SEGMENTS,
    );
    const outerGeometry = new SphereGeometry(
      GLOBE_RADIUS * OUTER_ATMOSPHERE_SCALE,
      ATMOSPHERE_SEGMENTS,
      ATMOSPHERE_SEGMENTS,
    );

    const {material: innerMaterial} = createAtmosphereMaterial({
      glowColor: new Color(0x5f93eb),
      warmColor: new Color(0xf0f7ff),
      sunDirection: SUN_DIRECTION,
      intensity: 0.08,
      rimPower: 2.8,
      daylightFloor: 0.02,
      sunHaloPower: 3.8,
      sunHaloStrength: 0.04,
    });
    const {material: outerMaterial} = createAtmosphereMaterial({
      glowColor: new Color(0x8fb7ff),
      warmColor: new Color(0xffffff),
      sunDirection: SUN_DIRECTION,
      intensity: 0.18,
      rimPower: 8.5,
      daylightFloor: 0.0,
      sunHaloPower: 5.5,
      sunHaloStrength: 0.05,
    });

    const innerMesh = new Mesh(innerGeometry, innerMaterial);
    const outerMesh = new Mesh(outerGeometry, outerMaterial);
    innerMesh.renderOrder = 2;
    outerMesh.renderOrder = 3;

    this.object.add(innerMesh);
    this.object.add(outerMesh);

    return () => {
      this.object.remove(innerMesh);
      this.object.remove(outerMesh);
      innerGeometry.dispose();
      outerGeometry.dispose();
      innerMaterial.dispose();
      outerMaterial.dispose();
    };
  }
}
