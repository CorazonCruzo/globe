import {useEffect, useRef, useState} from 'react';
import {Color} from 'three';
import {GlobeContext} from '../hooks/useGlobeContext.ts';
import {cn} from '../lib/cn.ts';
import {
  createGlobeContext,
  loadCountryData,
} from '../three/createGlobeContext.ts';
import type {GlobeContextResult} from '../three/createGlobeContext.ts';
import type {Country} from '../types/country.ts';
import type {Theme} from '../hooks/useTheme.ts';

const SCENE_BG = {
  dark: new Color(0x0f172a),
  light: new Color(0x1a2744),
};

interface GlobeCanvasProps {
  countries?: Array<Country>;
  theme?: Theme;
  /** CSS translateX for the 3D canvas, e.g. "30%" to shift globe right */
  canvasOffsetX?: string;
  children?: React.ReactNode;
}

export function GlobeCanvas({
  countries,
  theme = 'dark',
  canvasOffsetX,
  children,
}: GlobeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<GlobeContextResult | null>(null);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (destroyed) return;
        const message =
          err instanceof Error ? err.message : 'Unknown renderer error';
        console.error('[GlobeCanvas] Failed to initialize 3D scene:', err);
        setError(message);
        setLoading(false);
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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unknown country data error';
      console.error('[GlobeCanvas] Failed to build country meshes:', err);
      setError(message);
    }
  }, [result, countries]);

  // Update scene background on theme change
  useEffect(() => {
    if (!result) return;
    result.ctx.three.scene.background = SCENE_BG[theme];
  }, [result, theme]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className={cn(
          'h-full w-full origin-center transition-transform duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
          canvasOffsetX
            ? 'md:translate-x-[var(--canvas-offset)] md:scale-[0.65]'
            : '',
        )}
        style={
          canvasOffsetX
            ? ({'--canvas-offset': canvasOffsetX} as React.CSSProperties)
            : undefined
        }
      />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
          <p className="text-lg">Loading 3D scene...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 text-white">
          <p className="text-lg font-semibold">
            Failed to initialize 3D renderer
          </p>
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
