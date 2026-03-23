import CameraControls from 'camera-controls';
import * as THREE from 'three';
import {CoreContextModule} from '@vladkrutenyuk/three-kvy-core';
import {
  CAMERA_INITIAL_DISTANCE,
  CAMERA_MAX_DISTANCE,
  CAMERA_MAX_POLAR,
  CAMERA_MIN_DISTANCE,
  CAMERA_MIN_POLAR,
  DEG2RAD,
} from '../../lib/constants.ts';
import type {CoreContext} from '@vladkrutenyuk/three-kvy-core';
import type {GlobeModules} from '../types.ts';

CameraControls.install({THREE});

export class CameraModule extends CoreContextModule<
  string | symbol,
  GlobeModules
> {
  private controls: CameraControls | null = null;

  protected useCtx(ctx: CoreContext<GlobeModules>) {
    const setupControls = (container: HTMLDivElement) => {
      if (this.controls) return;

      const {camera} = ctx.three;
      const controls = new CameraControls(camera, container);
      this.controls = controls;

      controls.minDistance = CAMERA_MIN_DISTANCE;
      controls.maxDistance = CAMERA_MAX_DISTANCE;
      controls.minPolarAngle = CAMERA_MIN_POLAR;
      controls.maxPolarAngle = CAMERA_MAX_POLAR;
      controls.smoothTime = 0.5;
      controls.draggingSmoothTime = 0.2;

      // Touch: 1 finger = rotate, 2 fingers = dolly, truck disabled
      controls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
      controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY;
      controls.touches.three = CameraControls.ACTION.NONE;

      // Mouse
      controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
      controls.mouseButtons.right = CameraControls.ACTION.NONE;
      controls.mouseButtons.middle = CameraControls.ACTION.DOLLY;
      controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;

      // Disable truck (panning)
      controls.truckSpeed = 0;

      // Set initial distance
      controls.dollyTo(CAMERA_INITIAL_DISTANCE, false);
    };

    const onBeforeRender = () => {
      this.controls?.update(ctx.deltaTime);
    };
    ctx.three.on('renderbefore', onBeforeRender);

    // Container may already be mounted or will be mounted later
    const container = ctx.three.container;
    if (container) {
      setupControls(container);
    }
    ctx.three.on('mount', setupControls);

    return () => {
      ctx.three.off('mount', setupControls);
      ctx.three.off('renderbefore', onBeforeRender);
      this.controls?.dispose();
      this.controls = null;
    };
  }

  flyTo(lat: number, lon: number, animate = true) {
    if (!this.controls) return;

    const azimuth = lon * DEG2RAD;
    const polar = (90 - lat) * DEG2RAD;

    this.controls.normalizeRotations();
    this.controls.rotateTo(azimuth, polar, animate);
  }
}
