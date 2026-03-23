import {Group} from '@tweenjs/tween.js';
import {CoreContextModule} from '@vladkrutenyuk/three-kvy-core';
import type {CoreContext} from '@vladkrutenyuk/three-kvy-core';
import type {GlobeModules} from '../types.ts';

export class TweenModule extends CoreContextModule<
  string | symbol,
  GlobeModules
> {
  readonly group = new Group();

  protected useCtx(ctx: CoreContext<GlobeModules>) {
    const onBeforeRender = () => {
      this.group.update();
    };
    ctx.three.on('renderbefore', onBeforeRender);

    return () => {
      ctx.three.off('renderbefore', onBeforeRender);
      this.group.removeAll();
    };
  }
}
