import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {useVirtualizer} from '@tanstack/react-virtual';
import {useCountries} from '../hooks/useCountries.ts';
import {useCountryState} from '../hooks/useCountryState.ts';
import {useGlobeContext} from '../hooks/useGlobeContext.ts';
import {cn} from '../lib/cn.ts';
import type {ColumnDef, SortingState} from '@tanstack/react-table';
import type {Country} from '../types/country.ts';

const columnHelper = createColumnHelper<Country>();

function formatPopulation(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatArea(n: number): string {
  return n.toLocaleString('en-US');
}

const columns: Array<ColumnDef<Country, unknown>> = [
  columnHelper.display({
    id: 'flag',
    header: '',
    size: 36,
    cell: ({row}) => (
      <img
        src={row.original.flags.svg}
        alt=""
        className="h-4 w-6 rounded-sm object-cover"
      />
    ),
  }) as ColumnDef<Country, unknown>,
  columnHelper.accessor((row) => row.name.common, {
    id: 'name',
    header: 'Name',
    size: 140,
    sortingFn: 'alphanumeric',
  }) as ColumnDef<Country, unknown>,
  columnHelper.accessor((row) => row.capital?.join(', ') ?? '—', {
    id: 'capital',
    header: 'Capital',
    size: 120,
    enableSorting: false,
  }) as ColumnDef<Country, unknown>,
  columnHelper.accessor('population', {
    header: 'Pop.',
    size: 80,
    cell: ({getValue}) => formatPopulation(getValue()),
  }) as ColumnDef<Country, unknown>,
  columnHelper.accessor('area', {
    header: 'Area',
    size: 90,
    cell: ({getValue}) => formatArea(getValue()),
  }) as ColumnDef<Country, unknown>,
  columnHelper.accessor('region', {
    header: 'Region',
    size: 100,
  }) as ColumnDef<Country, unknown>,
];

const REGIONS = [
  'Africa',
  'Americas',
  'Antarctic',
  'Asia',
  'Europe',
  'Oceania',
];

export function CountryTable() {
  const {data: countries} = useCountries();
  const {selectedCode, hoveredCode} = useCountryState();
  const globe = useGlobeContext();
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const internalSelectRef = useRef(false);
  const [sorting, setSorting] = useState<SortingState>([
    {id: 'name', desc: false},
  ]);
  const parentRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => countries ?? [], [countries]);

  const filteredData = useMemo(() => {
    let result = data;
    if (regionFilter) {
      result = result.filter((c) => c.region === regionFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.common.toLowerCase().includes(q));
    }
    return result;
  }, [data, regionFilter, search]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {sorting},
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const {rows} = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  // Clear filters only on external select (globe click), not on internal table click
  useEffect(() => {
    if (!selectedCode) return;
    if (internalSelectRef.current) {
      internalSelectRef.current = false;
      return;
    }
    setSearch('');
    setRegionFilter('');
  }, [selectedCode]);

  // Scroll to selected row
  useEffect(() => {
    if (!selectedCode) return;
    const idx = rows.findIndex((r) => r.original.cca3 === selectedCode);
    if (idx >= 0) {
      virtualizer.scrollToIndex(idx, {align: 'center'});
    }
  }, [selectedCode, rows, virtualizer]);

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
        'pointer-events-auto absolute top-4 left-4 z-10 flex w-[36rem] flex-col rounded-xl border border-white/10 bg-slate-800/90 shadow-xl backdrop-blur-md',
        'max-md:inset-x-0 max-md:top-auto max-md:left-0 max-md:mx-2 max-md:w-auto max-md:rounded-xl',
        selectedCode
          ? 'max-h-[calc(100vh-2rem)] max-md:bottom-52 max-md:max-h-40'
          : 'max-h-[calc(100vh-2rem)] max-md:bottom-4 max-md:max-h-60',
        'max-md:transition-all max-md:duration-300',
      )}
    >
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg bg-slate-700/50 px-2 py-1 text-sm text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-slate-500"
        />
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded-lg bg-slate-700/50 px-2 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-slate-500"
        >
          <option value="">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Header */}
      <div className="flex border-b border-white/5 px-3 py-1 text-xs text-slate-400">
        {table.getHeaderGroups().map((hg) =>
          hg.headers.map((header) => (
            <div
              key={header.id}
              className={cn(
                'shrink-0 select-none',
                header.column.getCanSort() && 'cursor-pointer hover:text-white',
              )}
              style={{width: header.getSize()}}
              onClick={header.column.getToggleSortingHandler()}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
              {header.column.getIsSorted() === 'asc' && ' \u2191'}
              {header.column.getIsSorted() === 'desc' && ' \u2193'}
            </div>
          )),
        )}
      </div>

      {/* Virtualized rows */}
      <div ref={parentRef} className="overflow-y-auto">
        <div
          style={{
            height: virtualizer.getTotalSize(),
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <TableRow
                key={row.original.cca3}
                row={row}
                isSelected={row.original.cca3 === selectedCode}
                isHovered={row.original.cca3 === hoveredCode}
                onSelect={handleSelect}
                onHover={handleHover}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              />
            );
          })}
        </div>
        {rows.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-slate-400">
            No countries found
          </p>
        )}
      </div>
    </div>
  );
}

interface TableRowProps {
  row: ReturnType<
    ReturnType<typeof useReactTable<Country>>['getRowModel']
  >['rows'][number];
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (code: string) => void;
  onHover: (code: string | null) => void;
  style: React.CSSProperties;
}

const TableRow = memo(
  forwardRef<HTMLDivElement, TableRowProps>(function TableRow(
    {row, isSelected, isHovered, onSelect, onHover, style},
    ref,
  ) {
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        className={cn(
          'flex cursor-pointer items-center px-3 text-sm transition-colors',
          isSelected
            ? 'bg-amber-500/20 text-amber-200'
            : isHovered
              ? 'bg-slate-700/50 text-white'
              : 'text-slate-300 hover:bg-slate-700/30',
        )}
        style={style}
        onClick={() => onSelect(row.original.cca3)}
        onPointerEnter={() => onHover(row.original.cca3)}
        onPointerLeave={() => onHover(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSelect(row.original.cca3);
        }}
      >
        {row.getVisibleCells().map((cell) => (
          <div
            key={cell.id}
            className="shrink-0 truncate"
            style={{width: cell.column.getSize()}}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        ))}
      </div>
    );
  }),
);
