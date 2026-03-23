import {describe, expect, it, vi} from 'vitest';
import {render} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CountryList} from './CountryList.tsx';

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
    name: {common: 'Germany', official: 'Federal Republic of Germany'},
    cca3: 'DEU',
    capital: ['Berlin'],
    population: 83240000,
    area: 357114,
    region: 'Europe',
    flags: {png: '', svg: '', alt: ''},
    latlng: [51, 9] as [number, number],
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

describe('CountryList', () => {
  it('renders sorted country list', () => {
    const {getByText} = render(<CountryList />);
    expect(getByText('Brazil')).toBeInTheDocument();
    expect(getByText('France')).toBeInTheDocument();
    expect(getByText('Germany')).toBeInTheDocument();
  });

  it('filters countries by search input', async () => {
    const user = userEvent.setup();
    const {getByPlaceholderText, getByText, queryByText} = render(
      <CountryList />,
    );

    const input = getByPlaceholderText('Search countries...');
    await user.type(input, 'fra');

    expect(getByText('France')).toBeInTheDocument();
    expect(queryByText('Germany')).not.toBeInTheDocument();
    expect(queryByText('Brazil')).not.toBeInTheDocument();
  });

  it('shows empty state when no results', async () => {
    const user = userEvent.setup();
    const {getByPlaceholderText, getByText} = render(<CountryList />);

    await user.type(getByPlaceholderText('Search countries...'), 'zzzzz');
    expect(getByText('No countries found')).toBeInTheDocument();
  });

  it('highlights selected country', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    const {useCountryState} = await import('../hooks/useCountryState.ts');
    vi.mocked(useCountryState).mockReturnValue({
      selectedCode: 'FRA',
      hoveredCode: null,
    });

    const {getByText} = render(<CountryList />);
    const item = getByText('France').closest('button');
    expect(item?.className).toContain('amber');
  });

  it('calls countryState.select on list item click', async () => {
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
    const {getByText} = render(<CountryList />);
    await user.click(getByText('France'));

    expect(selectFn).toHaveBeenCalledWith('FRA');
  });

  it('calls countryState.hover on pointer enter/leave', async () => {
    const hoverFn = vi.fn();
    const {useGlobeContext} = await import('../hooks/useGlobeContext.ts');
    vi.mocked(useGlobeContext).mockReturnValue({
      ctx: {
        modules: {
          countryState: {select: vi.fn(), hover: hoverFn},
        },
      },
    } as unknown as ReturnType<typeof useGlobeContext>);

    const user = userEvent.setup();
    const {getByText} = render(<CountryList />);
    const item = getByText('France').closest('button')!;

    await user.hover(item);
    expect(hoverFn).toHaveBeenCalledWith('FRA');

    await user.unhover(item);
    expect(hoverFn).toHaveBeenCalledWith(null);
  });

  it('clears search and scrolls when country is selected from globe', async () => {
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    const {useCountryState} = await import('../hooks/useCountryState.ts');

    vi.mocked(useCountryState).mockReturnValue({
      selectedCode: null,
      hoveredCode: null,
    });

    const {getByPlaceholderText, rerender, getByText} = render(<CountryList />);
    const input = getByPlaceholderText('Search countries...');
    const user = userEvent.setup();
    await user.type(input, 'fra');

    // Simulate globe click selecting Brazil (not in filtered list)
    vi.mocked(useCountryState).mockReturnValue({
      selectedCode: 'BRA',
      hoveredCode: null,
    });
    rerender(<CountryList />);

    // Search should be cleared, Brazil should be visible and scrolled to
    expect(input).toHaveValue('');
    expect(getByText('Brazil')).toBeInTheDocument();
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });
});
