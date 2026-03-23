import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useCountries} from '../hooks/useCountries.ts';
import {useCountryState} from '../hooks/useCountryState.ts';
import {useGlobeContext} from '../hooks/useGlobeContext.ts';
import {cn} from '../lib/cn.ts';
import type {Country} from '../types/country.ts';

export function CountryList() {
  const {data: countries} = useCountries();
  const {selectedCode, hoveredCode} = useCountryState();
  const globe = useGlobeContext();
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const internalSelectRef = useRef(false);

  const sorted = useMemo(() => {
    if (!countries) return [];
    return [...countries].sort((a, b) =>
      a.name.common.localeCompare(b.name.common),
    );
  }, [countries]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter((c) => c.name.common.toLowerCase().includes(q));
  }, [sorted, search]);

  // Clear search only on external select (globe click), not internal list click
  useEffect(() => {
    if (!selectedCode) return;
    if (internalSelectRef.current) {
      internalSelectRef.current = false;
      return;
    }
    setSearch('');
  }, [selectedCode]);

  // After search is cleared and list re-renders, scroll to the selected item
  useEffect(() => {
    if (!selectedCode || search) return;
    const el = itemRefs.current.get(selectedCode);
    if (el) {
      el.scrollIntoView({block: 'nearest', behavior: 'smooth'});
    }
  }, [selectedCode, search]);

  const handleSelect = useCallback(
    (code: string) => {
      if (!globe) return;
      internalSelectRef.current = true;
      globe.ctx.modules.countryState.select(code);
    },
    [globe],
  );

  const handleHover = useCallback(
    (code: string | null) => {
      if (!globe) return;
      globe.ctx.modules.countryState.hover(code);
    },
    [globe],
  );

  return (
    <div
      className={cn(
        'pointer-events-auto absolute top-4 left-4 z-10 flex max-h-[calc(100vh-2rem)] w-64 flex-col rounded-xl border border-white/10 bg-slate-800/90 shadow-xl backdrop-blur-md',
        'max-md:inset-x-0 max-md:top-auto max-md:left-0 max-md:mx-2 max-md:w-auto max-md:rounded-xl',
        selectedCode
          ? 'max-md:bottom-52 max-md:max-h-40'
          : 'max-md:bottom-4 max-md:max-h-60',
        'max-md:transition-all max-md:duration-300',
      )}
    >
      <div className="border-b border-white/10 px-3 py-2">
        <div className="relative">
          <input
            ref={searchRef}
            type="text"
            placeholder="Search countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-slate-700/50 px-3 py-1.5 pr-8 text-sm text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-slate-500"
          />
          {search && (
            <button
              type="button"
              className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-white"
              onClick={() => {
                setSearch('');
                searchRef.current?.focus();
              }}
            >
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path d="M4.28 3.22a.75.75 0 0 0-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06L8 9.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L9.06 8l3.72-3.72a.75.75 0 0 0-1.06-1.06L8 6.94 4.28 3.22Z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div ref={listRef} className="overflow-y-auto">
        {filtered.map((country) => (
          <CountryListItem
            key={country.cca3}
            country={country}
            isSelected={country.cca3 === selectedCode}
            isHovered={country.cca3 === hoveredCode}
            onSelect={handleSelect}
            onHover={handleHover}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(country.cca3, el);
              } else {
                itemRefs.current.delete(country.cca3);
              }
            }}
          />
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-slate-400">
            No countries found
          </p>
        )}
      </div>
    </div>
  );
}

interface CountryListItemProps {
  country: Country;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (code: string) => void;
  onHover: (code: string | null) => void;
}

const CountryListItem = memo(
  forwardRef<HTMLButtonElement, CountryListItemProps>(function CountryListItem(
    {country, isSelected, isHovered, onSelect, onHover},
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors',
          isSelected
            ? 'bg-amber-500/20 text-amber-200'
            : isHovered
              ? 'bg-slate-700/50 text-white'
              : 'text-slate-300 hover:bg-slate-700/30',
        )}
        onClick={() => onSelect(country.cca3)}
        onPointerEnter={() => onHover(country.cca3)}
        onPointerLeave={() => onHover(null)}
      >
        <img
          src={country.flags.svg}
          alt=""
          className="h-4 w-6 shrink-0 rounded-sm object-cover"
        />
        <span className="truncate">{country.name.common}</span>
      </button>
    );
  }),
);
