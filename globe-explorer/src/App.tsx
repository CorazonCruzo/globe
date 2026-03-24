import {Suspense, lazy, useCallback, useState} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Tabs} from '@base-ui/react/tabs';
import {CountryInfo} from './components/CountryInfo.tsx';
import {CountryList} from './components/CountryList.tsx';
import {CountryTable} from './components/CountryTable.tsx';
import {ViewCameraSync} from './components/ViewCameraSync.tsx';
import {useCountries} from './hooks/useCountries.ts';
import {ThemeContext} from './hooks/useTheme.ts';
import {cn} from './lib/cn.ts';
import type {Theme} from './hooks/useTheme.ts';

const queryClient = new QueryClient();

const GlobeCanvas = lazy(async () => {
  const module = await import('./components/GlobeCanvas.tsx');
  return {default: module.GlobeCanvas};
});

function ViewToggle({
  view,
  onViewChange,
  theme,
}: {
  view: 'list' | 'table';
  onViewChange: (v: 'list' | 'table') => void;
  theme: Theme;
}) {
  return (
    <Tabs.Root
      value={view}
      onValueChange={(value) => onViewChange(value as 'list' | 'table')}
    >
      <Tabs.List
        className={cn(
          'pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-lg border p-1 backdrop-blur-md max-md:static max-md:translate-x-0',
          theme === 'dark'
            ? 'border-white/10 bg-slate-800/90'
            : 'border-slate-200 bg-slate-100 shadow-lg',
        )}
      >
        {(['list', 'table'] as const).map((v) => (
          <Tabs.Tab
            key={v}
            value={v}
            className={cn(
              'cursor-pointer rounded-md px-3 py-1 text-xs capitalize transition-colors max-md:px-4 max-md:py-2 max-md:text-sm',
              view === v
                ? theme === 'dark'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-700 text-white'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {v}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}

function ThemeButton({theme, onToggle}: {theme: Theme; onToggle: () => void}) {
  return (
    <button
      type="button"
      className={cn(
        'pointer-events-auto absolute right-4 bottom-4 z-10 rounded-lg border px-3 py-1.5 text-xs backdrop-blur-md transition-colors max-md:static max-md:px-4 max-md:py-2.5 max-md:text-sm',
        theme === 'dark'
          ? 'border-white/10 bg-slate-800/90 text-slate-400 hover:text-white'
          : 'border-slate-200 bg-slate-100 text-slate-500 shadow-lg hover:text-slate-800',
      )}
      onClick={onToggle}
    >
      {theme === 'dark' ? '\u2600\uFE0F Light' : '\uD83C\uDF19 Dark'}
    </button>
  );
}

function GlobeCanvasFallback({theme}: {theme: Theme}) {
  return (
    <div className="relative h-full w-full">
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center text-white',
          theme === 'dark' ? 'bg-slate-900' : 'bg-slate-800',
        )}
      >
        <p className="text-lg">Loading 3D scene...</p>
      </div>
    </div>
  );
}

function GlobeApp() {
  const {data: countries, error: countriesError} = useCountries();
  const [view, setView] = useState<'list' | 'table'>('list');
  const [theme, setTheme] = useState<Theme>('dark');

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{theme, toggleTheme}}>
      <div
        className={cn(
          'relative h-full w-full transition-colors duration-500',
          theme === 'dark' ? 'bg-slate-900' : 'bg-slate-800',
        )}
      >
        <Suspense fallback={<GlobeCanvasFallback theme={theme} />}>
          <GlobeCanvas
            countries={countries}
            countriesError={countriesError}
            theme={theme}
            toolbar={
              <div className="flex shrink-0 items-center justify-between px-4 py-2 md:hidden">
                <ViewToggle view={view} onViewChange={setView} theme={theme} />
                <ThemeButton theme={theme} onToggle={toggleTheme} />
              </div>
            }
          >
            {view === 'list' ? <CountryList /> : <CountryTable />}
            <CountryInfo />
            {/* Desktop-only: buttons as overlay */}
            <div className="hidden md:contents">
              <ViewToggle view={view} onViewChange={setView} theme={theme} />
              <ThemeButton theme={theme} onToggle={toggleTheme} />
            </div>
            <ViewCameraSync view={view} />
          </GlobeCanvas>
        </Suspense>
      </div>
    </ThemeContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobeApp />
    </QueryClientProvider>
  );
}

export default App;
