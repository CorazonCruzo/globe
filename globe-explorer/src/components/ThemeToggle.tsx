import {useTheme} from '../hooks/useTheme.ts';

export function ThemeToggle() {
  const {theme, toggleTheme} = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="pointer-events-auto absolute top-4 right-4 z-10 rounded-lg border border-white/10 bg-slate-800/90 px-3 py-1.5 text-sm text-slate-300 backdrop-blur-md transition-colors hover:text-white max-md:top-4 max-md:right-4"
    >
      {theme === 'dark' ? '\u2600\uFE0F Light' : '\uD83C\uDF19 Dark'}
    </button>
  );
}
