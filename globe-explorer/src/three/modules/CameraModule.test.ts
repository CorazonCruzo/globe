import {describe, expect, it} from 'vitest';
import {CameraModule, getFitDistanceForViewport} from './CameraModule.ts';

describe('CameraModule', () => {
  it('can be instantiated', () => {
    const module = new CameraModule();
    expect(module).toBeDefined();
    expect(module.isCoreContextModule).toBe(true);
  });

  it('has flyTo method', () => {
    const module = new CameraModule();
    expect(typeof module.flyTo).toBe('function');
  });

  it('flyTo is safe to call without context (no-op)', () => {
    const module = new CameraModule();
    // Should not throw when controls are null
    expect(() => module.flyTo(40, -74)).not.toThrow();
  });

  it('computes a larger fit distance for narrow portrait screens', () => {
    const desktop = getFitDistanceForViewport(1440, 900, 50);
    const mobile = getFitDistanceForViewport(390, 844, 50);

    expect(desktop).toBeGreaterThanOrEqual(15);
    expect(mobile).toBeGreaterThan(desktop);
    expect(mobile).toBeGreaterThan(20);
  });
});
