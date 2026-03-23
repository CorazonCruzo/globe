import {describe, expect, it} from 'vitest';
import {CameraModule} from './CameraModule.ts';

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
});
