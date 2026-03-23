import {Tween} from '@tweenjs/tween.js';
import {Object3DFeature} from '@vladkrutenyuk/three-kvy-core';
import type {Group} from '@tweenjs/tween.js';
import type {CoreContext} from '@vladkrutenyuk/three-kvy-core';
import type {GlobeModules} from '../types.ts';

interface TweenTarget {
  value: number;
}

export class CountryMeshFeature extends Object3DFeature<GlobeModules> {
  countryCode = '';
  hoverFactor: TweenTarget | null = null;
  selectFactor: TweenTarget | null = null;

  private hoverTween: Tween<TweenTarget> | null = null;
  private selectTween: Tween<TweenTarget> | null = null;

  protected useCtx(ctx: CoreContext<GlobeModules>) {
    const countryState = ctx.modules.countryState;
    const tweenGroup = ctx.modules.tween.group;

    const onSelect = (code: string) => {
      if (code === this.countryCode) {
        this.animateTo(this.selectFactor, 1, tweenGroup, 'select');
      }
    };

    const onDeselect = (code: string) => {
      if (code === this.countryCode) {
        this.animateTo(this.selectFactor, 0, tweenGroup, 'select');
      }
    };

    const onHover = (code: string) => {
      if (code === this.countryCode) {
        this.animateTo(this.hoverFactor, 1, tweenGroup, 'hover');
      }
    };

    const onUnhover = (code: string) => {
      if (code === this.countryCode) {
        this.animateTo(this.hoverFactor, 0, tweenGroup, 'hover');
      }
    };

    countryState.on('select', onSelect);
    countryState.on('deselect', onDeselect);
    countryState.on('hover', onHover);
    countryState.on('unhover', onUnhover);

    return () => {
      countryState.off('select', onSelect);
      countryState.off('deselect', onDeselect);
      countryState.off('hover', onHover);
      countryState.off('unhover', onUnhover);
      this.hoverTween?.stop();
      this.selectTween?.stop();
    };
  }

  private animateTo(
    target: TweenTarget | null,
    value: number,
    group: Group,
    type: 'hover' | 'select',
  ) {
    if (!target) return;

    if (type === 'hover') {
      this.hoverTween?.stop();
      const tween = new Tween(target).to({value}, 200).start();
      group.add(tween);
      this.hoverTween = tween;
    } else {
      this.selectTween?.stop();
      const tween = new Tween(target).to({value}, 300).start();
      group.add(tween);
      this.selectTween = tween;
    }
  }
}
