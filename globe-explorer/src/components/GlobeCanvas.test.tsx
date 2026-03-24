import {describe, expect, it, vi} from 'vitest';
import {render, waitFor} from '@testing-library/react';
import {GlobeCanvas} from './GlobeCanvas.tsx';

// Mock createGlobeContext to avoid WebGPU dependency in tests
const mocks = vi.hoisted(() => ({
  createGlobeContext: vi.fn(() => new Promise(() => {})),
  loadCountryData: vi.fn(),
}));

vi.mock('../three/createGlobeContext.ts', () => ({
  createGlobeContext: mocks.createGlobeContext,
  loadCountryData: mocks.loadCountryData,
}));

describe('GlobeCanvas', () => {
  it('shows loading state initially', () => {
    const {getByText} = render(<GlobeCanvas />);
    expect(getByText('Loading 3D scene...')).toBeInTheDocument();
  });

  it('renders a container div for the 3D canvas', () => {
    const {container} = render(<GlobeCanvas />);
    const divs = container.querySelectorAll('div');
    // Root > container + loading overlay
    expect(divs.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps showing a loading overlay until country data is ready', async () => {
    mocks.createGlobeContext.mockResolvedValueOnce({
      ctx: {destroy: vi.fn(), three: {scene: {background: null}}},
      countriesFeature: {},
    });

    const {getByText} = render(<GlobeCanvas />);

    await waitFor(() => {
      expect(getByText('Loading countries...')).toBeInTheDocument();
    });
  });

  it('applies a mobile Y offset when provided', () => {
    const {container} = render(<GlobeCanvas canvasOffsetY="-5rem" />);
    const canvasContainer = container.querySelector('.origin-center');

    expect(canvasContainer).toHaveClass(
      'max-md:translate-y-[var(--canvas-offset-y)]',
    );
    expect(canvasContainer).toHaveStyle({'--canvas-offset-y': '-5rem'});
  });
});
