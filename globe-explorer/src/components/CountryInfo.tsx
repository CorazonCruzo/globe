import {useCountries} from '../hooks/useCountries.ts';
import {useCountryState} from '../hooks/useCountryState.ts';
import {useGlobeContext} from '../hooks/useGlobeContext.ts';
import {useTheme} from '../hooks/useTheme.ts';
import {cn} from '../lib/cn.ts';
import {mutedClass, panelClass} from '../lib/panelStyles.ts';
import type {Country} from '../types/country.ts';

function formatPopulation(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatArea(n: number): string {
  return n.toLocaleString('en-US') + ' km\u00B2';
}

function DetailRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: 'dark' | 'light';
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className={mutedClass(theme)}>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function CountryDetails({
  country,
  theme,
}: {
  country: Country;
  theme: 'dark' | 'light';
}) {
  const languages = country.languages
    ? Object.values(country.languages).join(', ')
    : '\u2014';
  const currencies = country.currencies
    ? Object.values(country.currencies)
        .map((c) => `${c.name} (${c.symbol})`)
        .join(', ')
    : '\u2014';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <img
          src={country.flags.svg}
          alt={country.flags.alt ?? `Flag of ${country.name.common}`}
          className="h-8 w-12 rounded object-cover shadow"
        />
        <div>
          <h2 className="text-lg font-semibold leading-tight">
            {country.name.common}
          </h2>
          <p className={cn('text-xs', mutedClass(theme))}>
            {country.name.official}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <DetailRow
          label="Capital"
          value={country.capital?.join(', ') ?? '\u2014'}
          theme={theme}
        />
        <DetailRow label="Region" value={country.region} theme={theme} />
        {country.subregion && (
          <DetailRow
            label="Subregion"
            value={country.subregion}
            theme={theme}
          />
        )}
        <DetailRow
          label="Population"
          value={formatPopulation(country.population)}
          theme={theme}
        />
        <DetailRow
          label="Area"
          value={formatArea(country.area)}
          theme={theme}
        />
        <DetailRow label="Languages" value={languages} theme={theme} />
        <DetailRow label="Currencies" value={currencies} theme={theme} />
      </div>
    </div>
  );
}

export function CountryInfo() {
  const {selectedCode} = useCountryState();
  const {data: countries} = useCountries();
  const {theme} = useTheme();
  const globe = useGlobeContext();

  const country = selectedCode
    ? countries?.find((c) => c.cca3 === selectedCode)
    : null;

  return (
    <div
      className={cn(
        'pointer-events-auto absolute z-10 transition-all duration-300',
        'right-4 top-4 w-80',
        'max-md:inset-x-0 max-md:bottom-0 max-md:right-auto max-md:top-auto max-md:w-full',
        country
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      {country && (
        <div
          className={cn(
            'relative rounded-xl border px-3 py-2.5 shadow-xl',
            panelClass(theme),
            'max-md:rounded-b-none max-md:rounded-t-xl max-md:pb-[calc(0.625rem+env(safe-area-inset-bottom))]',
          )}
        >
          <button
            type="button"
            className={cn(
              'absolute top-2 right-2 hidden rounded-full p-1 max-md:block',
              mutedClass(theme),
            )}
            onClick={() => globe?.ctx.modules.countryState.select(null)}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
              <path d="M4.28 3.22a.75.75 0 0 0-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06L8 9.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L9.06 8l3.72-3.72a.75.75 0 0 0-1.06-1.06L8 6.94 4.28 3.22Z" />
            </svg>
          </button>
          <CountryDetails country={country} theme={theme} />
        </div>
      )}
    </div>
  );
}
