import {describe, expect, it, vi} from 'vitest';
import {render} from '@testing-library/react';
import {GlobeCanvas} from './GlobeCanvas.tsx';

// Mock createGlobeContext to avoid WebGPU dependency in tests
vi.mock('../three/createGlobeContext.ts', () => ({
  createGlobeContext: () => new Promise(() => {}), // Never resolves — stays in loading
  loadCountryData: vi.fn(),
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
});
