import {useQuery} from '@tanstack/react-query';
import {REST_COUNTRIES_API_1, REST_COUNTRIES_API_2} from '../lib/constants.ts';
import type {Country} from '../types/country.ts';

interface ApiBatch1 {
  name: Country['name'];
  cca3: string;
  ccn3?: string;
  capital?: Array<string>;
  population: number;
  area: number;
  region: string;
  subregion?: string;
  latlng: [number, number];
  flags: Country['flags'];
}

interface ApiBatch2 {
  name: Country['name'];
  cca3: string;
  languages?: Record<string, string>;
  currencies?: Record<string, {name: string; symbol: string}>;
}

async function fetchCountries(): Promise<Array<Country>> {
  const [res1, res2] = await Promise.all([
    fetch(REST_COUNTRIES_API_1),
    fetch(REST_COUNTRIES_API_2),
  ]);

  if (!res1.ok)
    throw new Error(`Failed to fetch countries (batch 1): ${res1.status}`);
  if (!res2.ok)
    throw new Error(`Failed to fetch countries (batch 2): ${res2.status}`);

  const batch1 = (await res1.json()) as Array<ApiBatch1>;
  const batch2 = (await res2.json()) as Array<ApiBatch2>;

  // Index batch2 by cca3 for O(1) merge
  const batch2Map = new Map<string, ApiBatch2>();
  for (const entry of batch2) {
    batch2Map.set(entry.cca3, entry);
  }

  return batch1.map((b1) => {
    const b2 = batch2Map.get(b1.cca3);
    return {
      ...b1,
      languages: b2?.languages,
      currencies: b2?.currencies,
    };
  });
}

export function useCountries() {
  return useQuery<Array<Country>>({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: Infinity,
  });
}
