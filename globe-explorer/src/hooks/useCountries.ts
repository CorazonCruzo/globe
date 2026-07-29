import {useQuery} from '@tanstack/react-query';
import {COUNTRIES_API_URL, COUNTRIES_FALLBACK_URL} from '../lib/constants.ts';
import type {Country} from '../types/country.ts';

const COUNTRY_REQUEST_TIMEOUT_MS = 7_000;

interface ApiLanguage {
  iso639_1?: string;
  iso639_2?: string;
  name: string;
}

interface ApiCurrency {
  code: string;
  name: string;
  symbol: string;
}

interface ApiCountry {
  name: string;
  alpha3Code: string;
  numericCode: string;
  capital?: string | null;
  population: number;
  area?: number | null;
  region: string;
  subregion?: string;
  latlng?: [number, number] | null;
  flags: Country['flags'];
  languages: Array<ApiLanguage>;
  currencies?: Array<ApiCurrency> | null;
}

interface LegacyApiCountry {
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
  languages?: Country['languages'];
  currencies?: Country['currencies'];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isApiLanguage(value: unknown): value is ApiLanguage {
  return (
    isRecord(value) &&
    isString(value.name) &&
    (value.iso639_1 === undefined || isString(value.iso639_1)) &&
    (value.iso639_2 === undefined || isString(value.iso639_2))
  );
}

function isApiCurrency(value: unknown): value is ApiCurrency {
  return (
    isRecord(value) &&
    isString(value.code) &&
    isString(value.name) &&
    isString(value.symbol)
  );
}

function isApiCountry(value: unknown): value is ApiCountry {
  if (!isRecord(value) || !isRecord(value.flags)) return false;

  return (
    isString(value.name) &&
    isString(value.alpha3Code) &&
    isString(value.numericCode) &&
    (value.capital === undefined ||
      value.capital === null ||
      isString(value.capital)) &&
    typeof value.population === 'number' &&
    (value.area === undefined ||
      value.area === null ||
      typeof value.area === 'number') &&
    isString(value.region) &&
    (value.subregion === undefined || isString(value.subregion)) &&
    (value.latlng === undefined ||
      value.latlng === null ||
      (Array.isArray(value.latlng) &&
        value.latlng.length === 2 &&
        value.latlng.every((coordinate) => typeof coordinate === 'number'))) &&
    isString(value.flags.svg) &&
    isString(value.flags.png) &&
    Array.isArray(value.languages) &&
    value.languages.every(isApiLanguage) &&
    (value.currencies === undefined ||
      value.currencies === null ||
      (Array.isArray(value.currencies) &&
        value.currencies.every(isApiCurrency)))
  );
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) && Object.values(value).every((entry) => isString(entry))
  );
}

function isCurrencyRecord(
  value: unknown,
): value is NonNullable<Country['currencies']> {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (currency) =>
        isRecord(currency) &&
        isString(currency.name) &&
        isString(currency.symbol),
    )
  );
}

function isLegacyApiCountry(value: unknown): value is LegacyApiCountry {
  if (!isRecord(value) || !isRecord(value.name) || !isRecord(value.flags))
    return false;

  return (
    isString(value.name.common) &&
    isString(value.name.official) &&
    isString(value.cca3) &&
    (value.ccn3 === undefined || isString(value.ccn3)) &&
    (value.capital === undefined ||
      (Array.isArray(value.capital) && value.capital.every(isString))) &&
    typeof value.population === 'number' &&
    typeof value.area === 'number' &&
    isString(value.region) &&
    (value.subregion === undefined || isString(value.subregion)) &&
    Array.isArray(value.latlng) &&
    value.latlng.length === 2 &&
    value.latlng.every((coordinate) => typeof coordinate === 'number') &&
    isString(value.flags.svg) &&
    isString(value.flags.png) &&
    (value.languages === undefined || isStringRecord(value.languages)) &&
    (value.currencies === undefined || isCurrencyRecord(value.currencies))
  );
}

function normalizeLanguages(
  languages: Array<ApiLanguage>,
): Country['languages'] {
  if (languages.length === 0) return undefined;

  return Object.fromEntries(
    languages.map((language) => [
      language.iso639_2 ?? language.iso639_1 ?? language.name,
      language.name,
    ]),
  );
}

function normalizeCurrencies(
  currencies: Array<ApiCurrency> | null | undefined,
): Country['currencies'] {
  if (!currencies || currencies.length === 0) return undefined;

  return Object.fromEntries(
    currencies.map(({code, name, symbol}) => [code, {name, symbol}]),
  );
}

function normalizeCountry(country: ApiCountry): Country {
  return {
    name: {
      common: country.name,
      // countries.dev exposes one English name rather than separate
      // common/official names. Keeping both values preserves the app contract.
      official: country.name,
    },
    cca3: country.alpha3Code,
    ccn3: country.numericCode.padStart(3, '0'),
    capital: country.capital ? [country.capital] : undefined,
    population: country.population,
    area: country.area ?? undefined,
    region: country.region,
    subregion: country.subregion,
    latlng: country.latlng ?? undefined,
    flags: country.flags,
    languages: normalizeLanguages(country.languages),
    currencies: normalizeCurrencies(country.currencies),
  };
}

export function normalizeCountries(payload: unknown): Array<Country> {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('Countries API returned an invalid response');
  }

  return payload.map((country, index) => {
    if (!isApiCountry(country)) {
      throw new Error(
        `Countries API returned invalid country at index ${index}`,
      );
    }
    return normalizeCountry(country);
  });
}

export function normalizeLegacyCountries(payload: unknown): Array<Country> {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('Countries fallback returned an invalid response');
  }

  return payload.map((country, index) => {
    if (!isLegacyApiCountry(country)) {
      throw new Error(
        `Countries fallback returned invalid country at index ${index}`,
      );
    }
    return country;
  });
}

async function fetchPayload(
  url: string,
  fetcher: typeof fetch,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    COUNTRY_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetcher(url, {signal: controller.signal});

    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.status}`);
    }

    try {
      return await response.json();
    } catch {
      throw new Error('Countries API returned invalid JSON');
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Countries API request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function fetchCountries(
  fetcher: typeof fetch = fetch,
): Promise<Array<Country>> {
  let primaryError: unknown;
  try {
    const payload = await fetchPayload(COUNTRIES_API_URL, fetcher);
    return normalizeCountries(payload);
  } catch (error) {
    primaryError = error;
  }

  try {
    const payload = await fetchPayload(COUNTRIES_FALLBACK_URL, fetcher);
    return normalizeLegacyCountries(payload);
  } catch (fallbackError) {
    throw new Error(
      `Failed to load countries. Primary: ${getErrorMessage(primaryError)}. ` +
        `Fallback: ${getErrorMessage(fallbackError)}`,
    );
  }
}

export function useCountries() {
  return useQuery<Array<Country>>({
    queryKey: ['countries'],
    queryFn: () => fetchCountries(),
    staleTime: Infinity,
    retry: false,
  });
}
