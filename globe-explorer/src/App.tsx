import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GlobeCanvas} from './components/GlobeCanvas.tsx';
import {useCountries} from './hooks/useCountries.ts';

const queryClient = new QueryClient();

function GlobeApp() {
  const {data: countries} = useCountries();

  return (
    <div className="h-full w-full bg-slate-900">
      <GlobeCanvas countries={countries} />
    </div>
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
