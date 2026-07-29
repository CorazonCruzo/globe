import {COUNTRIES_API_URL, COUNTRIES_FALLBACK_URL} from '../lib/constants.ts';
import {
  fetchCountries,
  normalizeCountries,
  normalizeLegacyCountries,
} from './useCountries.ts';

const france = {
  name: 'France',
  alpha3Code: 'FRA',
  numericCode: '250',
  capital: 'Paris',
  population: 67_391_582,
  area: 640_679,
  region: 'Europe',
  subregion: 'Western Europe',
  latlng: [46, 2],
  flags: {
    svg: 'https://flagcdn.com/fr.svg',
    png: 'https://flagcdn.com/w320/fr.png',
  },
  languages: [
    {
      name: 'French',
      iso639_1: 'fr',
      iso639_2: 'fra',
      nativeName: 'français',
    },
  ],
  currencies: [{code: 'EUR', name: 'Euro', symbol: '€'}],
};

const legacyFrance = {
  name: {common: 'France', official: 'French Republic'},
  cca3: 'FRA',
  ccn3: '250',
  capital: ['Paris'],
  population: 67_391_582,
  area: 640_679,
  region: 'Europe',
  subregion: 'Western Europe',
  latlng: [46, 2],
  flags: {
    svg: 'https://flagcdn.com/fr.svg',
    png: 'https://flagcdn.com/w320/fr.png',
  },
  languages: {fra: 'French'},
  currencies: {EUR: {name: 'Euro', symbol: '€'}},
};

describe('country data', () => {
  it('normalizes the countries.dev response to the app model', () => {
    expect(normalizeCountries([france])).toEqual([
      {
        name: {common: 'France', official: 'France'},
        cca3: 'FRA',
        ccn3: '250',
        capital: ['Paris'],
        population: 67_391_582,
        area: 640_679,
        region: 'Europe',
        subregion: 'Western Europe',
        latlng: [46, 2],
        flags: {
          svg: 'https://flagcdn.com/fr.svg',
          png: 'https://flagcdn.com/w320/fr.png',
        },
        languages: {fra: 'French'},
        currencies: {EUR: {name: 'Euro', symbol: '€'}},
      },
    ]);
  });

  it('preserves countries with nullable optional metadata', () => {
    const [country] = normalizeCountries([
      {
        ...france,
        capital: null,
        area: null,
        latlng: null,
        currencies: null,
      },
    ]);

    expect(country.capital).toBeUndefined();
    expect(country.area).toBeUndefined();
    expect(country.latlng).toBeUndefined();
    expect(country.currencies).toBeUndefined();
  });

  it('rejects a successful error payload instead of failing on map', () => {
    expect(() =>
      normalizeCountries({
        success: false,
        errors: [{message: 'API version deprecated'}],
      }),
    ).toThrow('Countries API returned an invalid response');
  });

  it('fetches the replacement endpoint', async () => {
    const fetcher = vi.fn<typeof fetch>();
    fetcher.mockResolvedValue(
      new Response(JSON.stringify([france]), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      }),
    );

    await expect(fetchCountries(fetcher)).resolves.toHaveLength(1);
    expect(fetcher).toHaveBeenCalledWith(COUNTRIES_API_URL, {
      signal: expect.any(AbortSignal),
    });
  });

  it('uses the pinned fallback when the primary response is invalid', async () => {
    const fetcher = vi.fn<typeof fetch>();
    fetcher
      .mockResolvedValueOnce(
        new Response(JSON.stringify({success: false}), {status: 200}),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([legacyFrance]), {status: 200}),
      );

    await expect(fetchCountries(fetcher)).resolves.toEqual([legacyFrance]);
    expect(fetcher).toHaveBeenNthCalledWith(2, COUNTRIES_FALLBACK_URL, {
      signal: expect.any(AbortSignal),
    });
  });

  it('validates the fallback response', () => {
    expect(normalizeLegacyCountries([legacyFrance])).toEqual([legacyFrance]);
    expect(() => normalizeLegacyCountries({error: true})).toThrow(
      'Countries fallback returned an invalid response',
    );
  });

  it('reports HTTP and JSON errors clearly', async () => {
    const httpErrorFetcher = vi.fn<typeof fetch>();
    httpErrorFetcher.mockResolvedValue(new Response(null, {status: 503}));

    await expect(fetchCountries(httpErrorFetcher)).rejects.toThrow(
      'Primary: Failed to fetch countries: 503',
    );

    const invalidJsonFetcher = vi.fn<typeof fetch>();
    invalidJsonFetcher.mockResolvedValue(
      new Response('not json', {status: 200}),
    );

    await expect(fetchCountries(invalidJsonFetcher)).rejects.toThrow(
      'Primary: Countries API returned invalid JSON',
    );
  });
});
