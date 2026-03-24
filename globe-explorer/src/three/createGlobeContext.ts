import {
  Color,
  Group,
  PerspectiveCamera,
  Scene,
  WebGPURenderer,
} from 'three/webgpu';
import {CoreContext, addFeature} from '@vladkrutenyuk/three-kvy-core';
import {CAMERA_INITIAL_DISTANCE} from '../lib/constants.ts';
import {CameraModule} from './modules/CameraModule.ts';
import {TweenModule} from './modules/TweenModule.ts';
import {RaycastModule} from './modules/RaycastModule.ts';
import {CountryStateModule} from './modules/CountryStateModule.ts';
import {GlobeFeature} from './features/GlobeFeature.ts';
import {AtmosphereFeature} from './features/AtmosphereFeature.ts';
import {StarfieldFeature} from './features/StarfieldFeature.ts';
import {
  CountriesFeature,
  buildIsoMap,
  getGeoNames,
} from './features/CountriesFeature.ts';
import {createClock} from './FrameClock.ts';
import type {GlobeModules} from './types.ts';
import type {Country} from '../types/country.ts';

export type {GlobeModules} from './types.ts';

const SCENE_BG = {
  dark: new Color(0x0f172a),
  light: new Color(0x1a2744),
};

/** Set scene background based on UI theme. Keeps Three.js Color logic in 3D layer. */
export function setSceneTheme(
  ctx: CoreContext<GlobeModules>,
  theme: 'dark' | 'light',
) {
  ctx.three.scene.background = SCENE_BG[theme];
}

export interface GlobeContextResult {
  ctx: CoreContext<GlobeModules>;
  countriesFeature: CountriesFeature;
}

export async function createGlobeContext(
  container: HTMLDivElement,
): Promise<GlobeContextResult> {
  // Create renderer with WebGPU (auto-fallback to WebGL2)
  const renderer = new WebGPURenderer({antialias: true});
  await renderer.init();

  // Log actual backend
  const backend = renderer.backend;
  if ('isWebGPUBackend' in backend && backend.isWebGPUBackend) {
    console.log('[GlobeContext] Using WebGPU backend');
  } else {
    console.log('[GlobeContext] Using WebGL2 fallback');
  }

  // Camera
  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, CAMERA_INITIAL_DISTANCE);

  // Scene
  const scene = new Scene();

  // Create context with modules
  const ctx = CoreContext.create<GlobeModules>({
    renderer,
    camera,
    scene,
    clock: createClock(),
    modules: {
      camera: new CameraModule(),
      tween: new TweenModule(),
      raycast: new RaycastModule(),
      countryState: new CountryStateModule(),
    },
  });

  // Globe root object
  const globeRoot = new Group();
  ctx.root.add(globeRoot);

  // Attach features to the globe root
  addFeature(globeRoot, StarfieldFeature);
  addFeature(globeRoot, GlobeFeature);
  addFeature(globeRoot, AtmosphereFeature);
  const countriesFeature = addFeature(globeRoot, CountriesFeature);

  // Mount and run
  ctx.three.mount(container);
  ctx.run();

  return {ctx, countriesFeature};
}

/**
 * Load country data into the globe context.
 * Called from React after restcountries data is fetched.
 */
export function loadCountryData(
  result: GlobeContextResult,
  countries: Array<Country>,
) {
  const {ctx, countriesFeature} = result;
  const countryState = ctx.modules.countryState;

  // Store lat/lon in CountryDataMap
  for (const c of countries) {
    countryState.countryData.set(c.cca3, {
      lat: c.latlng[0],
      lon: c.latlng[1],
    });
  }

  // Build ISO numeric → cca3 map (with name-based fallback)
  const geoNames = getGeoNames();
  const isoMap = buildIsoMap(countries, geoNames);

  // Set ISO map and build countries
  countriesFeature.setIsoMap(isoMap);
  countriesFeature.buildCountries();
}
