import {useEffect, useRef, useState} from 'react';
import {GlobeContext} from '../hooks/useGlobeContext.ts';
import {cn} from '../lib/cn.ts';
import {
  createGlobeContext,
  loadCountryData,
  setSceneTheme,
} from '../three/createGlobeContext.ts';
import type {GlobeContextResult} from '../three/createGlobeContext.ts';
import type {Country} from '../types/country.ts';
import type {Theme} from '../hooks/useTheme.ts';

interface GlobeCanvasProps {
  countries?: Array<Country>;
  /** Error from country data fetch (react-query) */
  countriesError?: Error | null;
  theme?: Theme;
  /** CSS translateY for the 3D canvas on mobile, e.g. "-5rem" to shift globe upward */
  canvasOffsetY?: string;
  children?: React.ReactNode;
}

export function GlobeCanvas({
  countries,
  countriesError,
  theme = 'dark',
  canvasOffsetY,
  children,
}: GlobeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<GlobeContextResult | null>(null);
  const [rendererReady, setRendererReady] = useState(false);
  const [countriesReady, setCountriesReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataLoadedRef = useRef(false);

  // Initialize 3D context
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;
    let contextResult: GlobeContextResult | null = null;

    createGlobeContext(container)
      .then((res) => {
        if (destroyed) {
          res.ctx.destroy();
          return;
        }
        contextResult = res;
        setResult(res);
        setRendererReady(true);
      })
      .catch((err: unknown) => {
        if (destroyed) return;
        const message =
          err instanceof Error ? err.message : 'Unknown renderer error';
        console.error('[GlobeCanvas] Failed to initialize 3D scene:', err);
        setError(message);
      });

    return () => {
      destroyed = true;
      if (contextResult) {
        contextResult.ctx.destroy();
      }
    };
  }, []);

  // Load country data when both context and API data are ready
  useEffect(() => {
    if (!result || !countries || dataLoadedRef.current) return;
    dataLoadedRef.current = true;
    try {
      loadCountryData(result, countries);
      setCountriesReady(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unknown country data error';
      console.error('[GlobeCanvas] Failed to build country meshes:', err);
      setError(message);
    }
  }, [result, countries]);

  // Surface API fetch error
  useEffect(() => {
    if (countriesError) {
      setError(countriesError.message);
    }
  }, [countriesError]);

  // Update scene background on theme change
  useEffect(() => {
    if (!result) return;
    setSceneTheme(result.ctx, theme);
  }, [result, theme]);

  const loading = !error && (!rendererReady || !countriesReady);
  const loadingLabel = rendererReady
    ? 'Loading countries...'
    : 'Loading 3D scene...';

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className={cn(
          'h-full w-full touch-none',
          canvasOffsetY ? 'max-md:translate-y-[var(--canvas-offset-y)]' : '',
        )}
        style={
          canvasOffsetY
            ? ({'--canvas-offset-y': canvasOffsetY} as React.CSSProperties)
            : undefined
        }
      />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
          <p className="text-lg">{loadingLabel}</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 text-white">
          <p className="text-lg font-semibold">Something went wrong</p>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      )}
      {result && (
        <GlobeContext.Provider
          value={{ctx: result.ctx, countriesFeature: result.countriesFeature}}
        >
          {children}
        </GlobeContext.Provider>
      )}
    </div>
  );
}
