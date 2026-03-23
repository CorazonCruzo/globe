import {describe, expect, it, vi} from 'vitest';
import {render} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CountryTable} from './CountryTable.tsx';

const mockCountries = [
  {
    name: {common: 'France', official: 'French Republic'},
    cca3: 'FRA',
    capital: ['Paris'],
    population: 67390000,
    area: 551695,
    region: 'Europe',
    flags: {png: '', svg: '', alt: ''},
    latlng: [46, 2] as [number, number],
  },
  {
    name: {common: 'Brazil', official: 'Federative Republic of Brazil'},
    cca3: 'BRA',
    capital: ['Brasilia'],
    population: 212559000,
    area: 8515767,
    region: 'Americas',
    flags: {png: '', svg: '', alt: ''},
    latlng: [-14, -51] as [number, number],
  },
  {
    name: {common: 'Japan', official: 'Japan'},
    cca3: 'JPN',
    capital: ['Tokyo'],
    population: 125836000,
    area: 377975,
    region: 'Asia',
    flags: {png: '', svg: '', alt: ''},
    latlng: [36, 138] as [number, number],
  },
];

vi.mock('../hooks/useCountryState.ts', () => ({
  useCountryState: vi.fn(() => ({selectedCode: null, hoveredCode: null})),
}));

vi.mock('../hooks/useCountries.ts', () => ({
  useCountries: vi.fn(() => ({data: mockCountries})),
}));

vi.mock('../hooks/useGlobeContext.ts', () => ({
  useGlobeContext: vi.fn(() => null),
}));

// Mock useVirtualizer since jsdom has no layout — virtualizer renders 0 items
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({count}: {count: number}) => ({
    getTotalSize: () => count * 36,
    getVirtualItems: () =>
      Array.from({length: count}, (_, i) => ({
        index: i,
        start: i * 36,
        size: 36,
        key: i,
      })),
    scrollToIndex: vi.fn(),
  }),
}));

describe('CountryTable', () => {
  it('renders table with country data', () => {
    const {getByText} = render(<CountryTable />);
    expect(getByText('Brazil')).toBeInTheDocument();
    expect(getByText('France')).toBeInTheDocument();
    expect(getByText('Japan')).toBeInTheDocument();
  });

  it('renders search input and region filter', () => {
    const {getByPlaceholderText, getByRole} = render(<CountryTable />);
    expect(getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(getByRole('combobox')).toBeInTheDocument();
  });

  it('filters by text search', async () => {
    const user = userEvent.setup();
    const {getByPlaceholderText, getByText, queryByText} = render(
      <CountryTable />,
    );

    await user.type(getByPlaceholderText('Search...'), 'jap');
    expect(getByText('Japan')).toBeInTheDocument();
    expect(queryByText('France')).not.toBeInTheDocument();
    expect(queryByText('Brazil')).not.toBeInTheDocument();
  });

  it('filters by region', async () => {
    const user = userEvent.setup();
    const {getByRole, getByText, queryByText} = render(<CountryTable />);

    const select = getByRole('combobox');
    await user.selectOptions(select, 'Asia');

    expect(getByText('Japan')).toBeInTheDocument();
    expect(queryByText('France')).not.toBeInTheDocument();
    expect(queryByText('Brazil')).not.toBeInTheDocument();
  });

  it('shows empty state when no results', async () => {
    const user = userEvent.setup();
    const {getByPlaceholderText, getByText} = render(<CountryTable />);

    await user.type(getByPlaceholderText('Search...'), 'zzzzz');
    expect(getByText('No countries found')).toBeInTheDocument();
  });

  it('clears region filter when country is selected from globe', async () => {
    const {useCountryState} = await import('../hooks/useCountryState.ts');

    vi.mocked(useCountryState).mockReturnValue({
      selectedCode: null,
      hoveredCode: null,
    });

    const user = userEvent.setup();
    const {getByRole, rerender, getByText, queryByText} = render(
      <CountryTable />,
    );

    // Filter to Asia only
    await user.selectOptions(getByRole('combobox'), 'Asia');
    expect(getByText('Japan')).toBeInTheDocument();
    expect(queryByText('Brazil')).not.toBeInTheDocument();

    // Simulate globe click selecting Brazil (not in Asia filter)
    vi.mocked(useCountryState).mockReturnValue({
      selectedCode: 'BRA',
      hoveredCode: null,
    });
    rerender(<CountryTable />);

    // Region filter should be cleared, Brazil visible
    expect(getByRole('combobox')).toHaveValue('');
    expect(getByText('Brazil')).toBeInTheDocument();
  });

  it('sorts by population when header clicked', async () => {
    const {container} = render(<CountryTable />);
    const user = userEvent.setup();

    // Find the Pop. header and click it
    const headers = container.querySelectorAll('[class*="select-none"]');
    const popHeader = Array.from(headers).find((h) =>
      h.textContent.startsWith('Pop.'),
    );
    expect(popHeader).toBeDefined();

    // Default sort is by name. Click Pop. to sort descending
    await user.click(popHeader as Element);

    // After sorting by population, first visible row should have largest population
    const rows = container.querySelectorAll('[role="button"]');
    // Brazil has highest population in our mock data (212M)
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].textContent).toContain('Brazil');
  });

  it('does not clear region filter on internal table click', async () => {
    const selectFn = vi.fn();
    const {useGlobeContext} = await import('../hooks/useGlobeContext.ts');
    vi.mocked(useGlobeContext).mockReturnValue({
      ctx: {
        modules: {
          countryState: {select: selectFn, hover: vi.fn()},
        },
      },
    } as unknown as ReturnType<typeof useGlobeContext>);

    const user = userEvent.setup();
    const {getByRole, getByText} = render(<CountryTable />);

    // Filter to Asia
    await user.selectOptions(getByRole('combobox'), 'Asia');
    expect(getByText('Japan')).toBeInTheDocument();

    // Click Japan in the table (internal click)
    await user.click(getByText('Japan'));
    expect(selectFn).toHaveBeenCalledWith('JPN');

    // Region filter should NOT be cleared
    expect(getByRole('combobox')).toHaveValue('Asia');
  });
});
