import {describe, expect, it} from 'vitest';
import {RaycastModule} from './RaycastModule.ts';

describe('RaycastModule', () => {
  it('can be instantiated', () => {
    const module = new RaycastModule();
    expect(module).toBeDefined();
    expect(module.isCoreContextModule).toBe(true);
  });

  it('has setTargets method', () => {
    const module = new RaycastModule();
    expect(typeof module.setTargets).toBe('function');
  });

  it('setTargets accepts an array', () => {
    const module = new RaycastModule();
    expect(() => module.setTargets([])).not.toThrow();
  });
});
