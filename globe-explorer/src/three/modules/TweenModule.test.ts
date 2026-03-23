import {describe, expect, it} from 'vitest';
import {TweenModule} from './TweenModule.ts';

describe('TweenModule', () => {
  it('can be instantiated', () => {
    const module = new TweenModule();
    expect(module).toBeDefined();
    expect(module.isCoreContextModule).toBe(true);
  });

  it('exposes a tween Group', () => {
    const module = new TweenModule();
    expect(module.group).toBeDefined();
  });
});
