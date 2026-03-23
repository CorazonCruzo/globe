import {useCallback, useEffect, useState} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GlobeCanvas} from './components/GlobeCanvas.tsx';
import {CountryInfo} from './components/CountryInfo.tsx';
import {CountryList} from './components/CountryList.tsx';
import {CountryTable} from './components/CountryTable.tsx';
import {ThemeToggle} from './components/ThemeToggle.tsx';
import {useCountries} from './hooks/useCountries.ts';
import {ThemeContext} from './hooks/useTheme.ts';
import {cn} from './lib/cn.ts';
import type {Theme} from './hooks/useTheme.ts';

const queryClient = new QueryClient();

function ViewToggle({
  view,
  onViewChange,
}: {
  view: 'list' | 'table';
  onViewChange: (v: 'list' | 'table') => void;
}) {
  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-lg border border-white/10 bg-slate-800/90 p-1 backdrop-blur-md max-md:bottom-auto max-md:top-4 max-md:left-1/2">
      <button
        type="button"
        className={cn(
          'rounded-md px-3 py-1 text-xs transition-colors',
          view === 'list'
            ? 'bg-slate-600 text-white'
            : 'text-slate-400 hover:text-white',
        )}
        onClick={() => onViewChange('list')}
      >
        List
      </button>
      <button
        type="button"
        className={cn(
          'rounded-md px-3 py-1 text-xs transition-colors',
          view === 'table'
            ? 'bg-slate-600 text-white'
            : 'text-slate-400 hover:text-white',
        )}
        onClick={() => onViewChange('table')}
      >
        Table
      </button>
    </div>
  );
}

function GlobeApp() {
  const {data: countries} = useCountries();
  const [view, setView] = useState<'list' | 'table'>('list');
  const [theme, setTheme] = useState<Theme>('dark');

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  // Apply theme to document for Tailwind dark mode and background
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{theme, toggleTheme}}>
      <div
        className={cn(
          'relative h-full w-full transition-colors duration-500',
          theme === 'dark' ? 'bg-slate-900' : 'bg-slate-200',
        )}
      >
        <GlobeCanvas countries={countries} theme={theme}>
          {view === 'list' ? <CountryList /> : <CountryTable />}
          <CountryInfo />
          <ViewToggle view={view} onViewChange={setView} />
          <ThemeToggle />
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
