import CameraControls from 'camera-controls';
import * as THREE from 'three/webgpu';
import {CoreContextModule} from '@vladkrutenyuk/three-kvy-core';
import {
  CAMERA_INITIAL_DISTANCE,
  CAMERA_MAX_DISTANCE,
  CAMERA_MAX_POLAR,
  CAMERA_MIN_DISTANCE,
  CAMERA_MIN_POLAR,
  DEG2RAD,
  GLOBE_RADIUS,
} from '../../lib/constants.ts';
import type {CoreContext} from '@vladkrutenyuk/three-kvy-core';
import type {GlobeModules} from '../types.ts';

CameraControls.install({THREE});

const CAMERA_FIT_PADDING = 1.08;

export function getFitDistanceForViewport(
  width: number,
  height: number,
  fovDeg: number,
  radius: number = GLOBE_RADIUS,
): number {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const aspect = safeWidth / safeHeight;
  const vHalfFov = (fovDeg * DEG2RAD) / 2;
  const hHalfFov = Math.atan(Math.tan(vHalfFov) * aspect);
  const limitingHalfFov = Math.min(vHalfFov, hHalfFov);
  const fitDistance = (radius / Math.sin(limitingHalfFov)) * CAMERA_FIT_PADDING;

  return Math.max(CAMERA_INITIAL_DISTANCE, fitDistance);
}

export class CameraModule extends CoreContextModule<
  string | symbol,
  GlobeModules
> {
  private controls: CameraControls | null = null;
  private container: HTMLDivElement | null = null;
  private _focalOffsetPx: {x: number; y: number} | null = null;

  protected useCtx(ctx: CoreContext<GlobeModules>) {
    const setupControls = (container: HTMLDivElement) => {
      if (this.controls) return;

      const {camera} = ctx.three;
      const controls = new CameraControls(camera, container);
      this.controls = controls;
      this.container = container;

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

      // Safari trackpad: prevent default gesture events that interfere
      // with camera-controls wheel handling
      container.addEventListener('gesturestart', (e) => e.preventDefault(), {
        passive: false,
      });
      container.addEventListener('gesturechange', (e) => e.preventDefault(), {
        passive: false,
      });

      // Set initial distance
      controls.dollyTo(this.getFitDistance(camera, container), false);
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
      this.container = null;
    };
  }

  flyTo(lat: number, lon: number, area?: number, animate = true) {
    if (!this.controls) return;

    const azimuth = lon * DEG2RAD;
    const polar = (90 - lat) * DEG2RAD;

    this.controls.normalizeRotations();
    this.controls.rotateTo(azimuth, polar, animate);

    // Zoom based on country area
    if (area != null) {
      const target = distanceForArea(area);
      this.controls.dollyTo(target, animate);

      // Recalculate focal offset for the new distance so the globe
      // stays centered in the visible area (not pushed off-screen)
      if (this._focalOffsetPx) {
        this.setFocalOffsetPxAtDistance(
          this._focalOffsetPx.x,
          this._focalOffsetPx.y,
          target,
          animate,
        );
      }
    }
  }

  /** Zoom out so the globe fits entirely in view */
  zoomToFit(animate = true) {
    if (!this.controls || !this.container) return;
    this.controls.dollyTo(
      this.getFitDistance(this.controls.camera, this.container),
      animate,
    );
  }

  /** Save current distance, zoom to fit, return restore function */
  pushZoomToFit(animate = true, insetLeft = 0): () => void {
    if (!this.controls || !this.container) return () => {};
    const saved = this.controls.distance;
    const fitDistance = this.getFitDistance(
      this.controls.camera,
      this.container,
      insetLeft,
    );
    if (this.controls.distance < fitDistance) {
      this.controls.dollyTo(fitDistance, animate);
    }
    return () => {
      this.controls?.dollyTo(saved, animate);
    };
  }

  /** Public getter for fit distance */
  getComputedFitDistance(insetLeft = 0): number {
    if (!this.controls || !this.container) return CAMERA_INITIAL_DISTANCE;
    return this.getFitDistance(this.controls.camera, this.container, insetLeft);
  }

  /** Set focal offset in pixel units (converted to world units at given distance) */
  setFocalOffsetPx(pixelX: number, pixelY: number, animate = true) {
    if (!this.controls || !this.container) return;
    const camera = this.controls.camera;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const distance = this.controls.distance;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const worldX = pixelToWorld(pixelX, distance, camera.fov, w, h);
    const worldY = pixelToWorld(pixelY, distance, camera.fov, w, h);
    this.controls.setFocalOffset(worldX, worldY, 0, animate);
  }

  /** Set focal offset in pixel units using a specific distance for conversion */
  setFocalOffsetPxAtDistance(
    pixelX: number,
    pixelY: number,
    distance: number,
    animate = true,
  ) {
    if (!this.controls || !this.container) return;
    const camera = this.controls.camera;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    this._focalOffsetPx = {x: pixelX, y: pixelY};
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const worldX = pixelToWorld(pixelX, distance, camera.fov, w, h);
    const worldY = pixelToWorld(pixelY, distance, camera.fov, w, h);
    this.controls.setFocalOffset(worldX, worldY, 0, animate);
  }

  /** Reset focal offset to zero */
  clearFocalOffset(animate = true) {
    this._focalOffsetPx = null;
    this.controls?.setFocalOffset(0, 0, 0, animate);
  }

  private getFitDistance(
    camera: THREE.Camera,
    container: HTMLDivElement,
    insetLeft = 0,
  ): number {
    if (!(camera instanceof THREE.PerspectiveCamera)) {
      return CAMERA_INITIAL_DISTANCE;
    }
    return getFitDistanceForViewport(
      container.clientWidth - insetLeft,
      container.clientHeight,
      camera.fov,
    );
  }
}

/**
 * Map country area (km²) to camera distance.
 * Log scale: tiny countries → close, large → far.
 */
const FLYTO_MIN_DISTANCE = 9;

export function distanceForArea(areaKm2: number): number {
  const a = Math.max(areaKm2, 1);
  const log = Math.log10(a);
  // Map log range [0..7.2] to distance [9..15]
  const t = Math.min(log / 7.2, 1);
  return (
    FLYTO_MIN_DISTANCE + t * (CAMERA_INITIAL_DISTANCE - FLYTO_MIN_DISTANCE)
  );
}

/** Convert a pixel offset to world units at the given camera distance */
export function pixelToWorld(
  pixelShift: number,
  distance: number,
  fovDeg: number,
  containerWidth: number,
  containerHeight: number,
): number {
  const vHalfFov = (fovDeg * DEG2RAD) / 2;
  const visibleHeight = 2 * distance * Math.tan(vHalfFov);
  const aspect = Math.max(containerWidth, 1) / Math.max(containerHeight, 1);
  const visibleWidth = visibleHeight * aspect;
  return (pixelShift / Math.max(containerWidth, 1)) * visibleWidth;
}
