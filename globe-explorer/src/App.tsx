import {useCallback, useState} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GlobeCanvas} from './components/GlobeCanvas.tsx';
import {CountryInfo} from './components/CountryInfo.tsx';
import {CountryList} from './components/CountryList.tsx';
import {CountryTable} from './components/CountryTable.tsx';
import {ViewCameraSync} from './components/ViewCameraSync.tsx';
import {useCountries} from './hooks/useCountries.ts';
import {ThemeContext} from './hooks/useTheme.ts';
import {cn} from './lib/cn.ts';
import type {Theme} from './hooks/useTheme.ts';

const queryClient = new QueryClient();

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
    <div
      className={cn(
        'pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-lg border p-1 backdrop-blur-md max-md:bottom-auto max-md:top-4 max-md:left-1/2',
        theme === 'dark'
          ? 'border-white/10 bg-slate-800/90'
          : 'border-white/15 bg-slate-700/85',
      )}
    >
      {(['list', 'table'] as const).map((v) => (
        <button
          key={v}
          type="button"
          className={cn(
            'rounded-md px-3 py-1 text-xs capitalize transition-colors',
            view === v
              ? 'bg-slate-600 text-white'
              : 'text-slate-400 hover:text-white',
          )}
          onClick={() => onViewChange(v)}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function ThemeButton({theme, onToggle}: {theme: Theme; onToggle: () => void}) {
  return (
    <button
      type="button"
      className={cn(
        'pointer-events-auto absolute right-4 bottom-4 z-10 rounded-lg border px-3 py-1.5 text-xs backdrop-blur-md transition-colors max-md:bottom-auto max-md:top-4',
        theme === 'dark'
          ? 'border-white/10 bg-slate-800/90 text-slate-400 hover:text-white'
          : 'border-white/15 bg-slate-700/85 text-slate-300 hover:text-white',
      )}
      onClick={onToggle}
    >
      {theme === 'dark' ? '\u2600\uFE0F Light' : '\uD83C\uDF19 Dark'}
    </button>
  );
}

function GlobeApp() {
  const {data: countries} = useCountries();
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
        <GlobeCanvas
          countries={countries}
          theme={theme}
          canvasOffsetX={view === 'table' ? '18rem' : undefined}
        >
          {view === 'list' ? <CountryList /> : <CountryTable />}
          <CountryInfo />
          <ViewToggle view={view} onViewChange={setView} theme={theme} />
          <ThemeButton theme={theme} onToggle={toggleTheme} />
          <ViewCameraSync view={view} />
        </GlobeCanvas>
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
