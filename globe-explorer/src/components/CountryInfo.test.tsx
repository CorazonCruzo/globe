import {describe, expect, it, vi} from 'vitest';
import {render} from '@testing-library/react';
import {CountryInfo} from './CountryInfo.tsx';

vi.mock('../hooks/useCountryState.ts', () => ({
  useCountryState: vi.fn(() => ({selectedCode: null, hoveredCode: null})),
}));

vi.mock('../hooks/useCountries.ts', () => ({
  useCountries: vi.fn(() => ({data: []})),
}));

describe('CountryInfo', () => {
  it('renders without crashing when no country selected', () => {
    const {container} = render(<CountryInfo />);
    expect(container).toBeDefined();
  });

  it('is hidden when no country is selected', () => {
    const {container} = render(<CountryInfo />);
    const panel = container.querySelector('[class*="opacity-0"]');
    expect(panel).not.toBeNull();
  });

  it('shows country details when selected', async () => {
    const {useCountryState} = await import('../hooks/useCountryState.ts');
    const {useCountries} = await import('../hooks/useCountries.ts');

    vi.mocked(useCountryState).mockReturnValue({
      selectedCode: 'FRA',
      hoveredCode: null,
    });
    vi.mocked(useCountries).mockReturnValue({
      data: [
        {
          name: {common: 'France', official: 'French Republic'},
          cca3: 'FRA',
          capital: ['Paris'],
          population: 67390000,
          area: 551695,
          region: 'Europe',
          subregion: 'Western Europe',
          languages: {fra: 'French'},
          currencies: {EUR: {name: 'Euro', symbol: '\u20AC'}},
          flags: {png: '', svg: '', alt: 'Flag of France'},
          latlng: [46, 2] as [number, number],
        },
      ],
    } as unknown as ReturnType<typeof useCountries>);

    const {getByText} = render(<CountryInfo />);
    expect(getByText('France')).toBeInTheDocument();
    expect(getByText('French Republic')).toBeInTheDocument();
    expect(getByText('Paris')).toBeInTheDocument();
    expect(getByText('Europe')).toBeInTheDocument();
    expect(getByText('Western Europe')).toBeInTheDocument();
    expect(getByText('67.4M')).toBeInTheDocument();
    expect(getByText('French')).toBeInTheDocument();
  });
});
