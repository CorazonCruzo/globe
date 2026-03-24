import {describe, expect, it, vi} from 'vitest';
import {render, waitFor} from '@testing-library/react';
import {GlobeCanvas} from './GlobeCanvas.tsx';

// Mock createGlobeContext to avoid WebGPU dependency in tests
const mocks = vi.hoisted(() => ({
  createGlobeContext: vi.fn(() => new Promise(() => {})),
  loadCountryData: vi.fn(),
  setSceneTheme: vi.fn(),
}));

vi.mock('../three/createGlobeContext.ts', () => ({
  createGlobeContext: mocks.createGlobeContext,
  loadCountryData: mocks.loadCountryData,
  setSceneTheme: mocks.setSceneTheme,
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

  it('uses flex layout on mobile for canvas sizing', () => {
    const {container} = render(<GlobeCanvas />);
    const canvasContainer = container.querySelector('.touch-none');

    expect(canvasContainer).toHaveClass('max-md:h-[55dvh]');
  });
});
