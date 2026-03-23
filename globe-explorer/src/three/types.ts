import type {CoreContextModule} from '@vladkrutenyuk/three-kvy-core';
import type {CameraModule} from './modules/CameraModule.ts';
import type {TweenModule} from './modules/TweenModule.ts';
import type {RaycastModule} from './modules/RaycastModule.ts';
import type {CountryStateModule} from './modules/CountryStateModule.ts';

export interface GlobeModules extends Record<string, CoreContextModule> {
  camera: CameraModule;
  tween: TweenModule;
  raycast: RaycastModule;
  countryState: CountryStateModule;
}
