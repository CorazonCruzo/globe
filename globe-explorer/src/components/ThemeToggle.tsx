import {useTheme} from '../hooks/useTheme.ts';
import {cn} from '../lib/cn.ts';

export function ThemeToggle() {
  const {theme, toggleTheme} = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'pointer-events-auto absolute top-4 right-4 z-10 rounded-lg border px-3 py-1.5 text-sm backdrop-blur-md transition-colors',
        theme === 'dark'
          ? 'border-white/10 bg-slate-800/90 text-slate-300 hover:text-white'
          : 'border-white/15 bg-slate-700/85 text-slate-200 hover:text-white',
      )}
    >
      {theme === 'dark' ? '\u2600\uFE0F Light' : '\uD83C\uDF19 Dark'}
    </button>
  );
}
