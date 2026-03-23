import {createContext, useContext} from 'react';
import type {CoreContext} from '@vladkrutenyuk/three-kvy-core';
import type {GlobeModules} from '../three/types.ts';
import type {CountriesFeature} from '../three/features/CountriesFeature.ts';

export interface GlobeContextValue {
  ctx: CoreContext<GlobeModules>;
  countriesFeature: CountriesFeature;
}

export const GlobeContext = createContext<GlobeContextValue | null>(null);

export function useGlobeContext(): GlobeContextValue | null {
  return useContext(GlobeContext);
}
