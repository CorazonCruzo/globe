import {useCountryState} from '../hooks/useCountryState.ts';
import {useCountries} from '../hooks/useCountries.ts';
import {cn} from '../lib/cn.ts';
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

function DetailRow({label, value}: {label: string; value: string}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

function CountryDetails({country}: {country: Country}) {
  const languages = country.languages
    ? Object.values(country.languages).join(', ')
    : '—';
  const currencies = country.currencies
    ? Object.values(country.currencies)
        .map((c) => `${c.name} (${c.symbol})`)
        .join(', ')
    : '—';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <img
          src={country.flags.svg}
          alt={country.flags.alt ?? `Flag of ${country.name.common}`}
          className="h-8 w-12 rounded object-cover shadow"
        />
        <div>
          <h2 className="text-lg font-semibold leading-tight text-white">
            {country.name.common}
          </h2>
          <p className="text-xs text-slate-400">{country.name.official}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <DetailRow label="Capital" value={country.capital?.join(', ') ?? '—'} />
        <DetailRow label="Region" value={country.region} />
        {country.subregion && (
          <DetailRow label="Subregion" value={country.subregion} />
        )}
        <DetailRow
          label="Population"
          value={formatPopulation(country.population)}
        />
        <DetailRow label="Area" value={formatArea(country.area)} />
        <DetailRow label="Languages" value={languages} />
        <DetailRow label="Currencies" value={currencies} />
      </div>
    </div>
  );
}

export function CountryInfo() {
  const {selectedCode} = useCountryState();
  const {data: countries} = useCountries();

  const country = selectedCode
    ? countries?.find((c) => c.cca3 === selectedCode)
    : null;

  return (
    <div
      className={cn(
        'pointer-events-auto absolute z-10 transition-all duration-300',
        // Desktop: right side panel
        'right-4 top-4 w-80',
        // Mobile: bottom sheet
        'max-md:inset-x-0 max-md:bottom-0 max-md:right-auto max-md:top-auto max-md:w-full',
        country
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      {country && (
        <div
          className={cn(
            'rounded-xl border border-white/10 bg-slate-800/90 px-3 py-2.5 shadow-xl backdrop-blur-md',
            'max-md:rounded-b-none max-md:rounded-t-xl',
          )}
        >
          <CountryDetails country={country} />
        </div>
      )}
    </div>
  );
}
