import type {Theme} from '../hooks/useTheme.ts';

/** Common panel appearance classes based on theme */
export function panelClass(theme: Theme) {
  return theme === 'dark'
    ? 'border-white/10 bg-slate-800/90 text-slate-200 backdrop-blur-md'
    : 'border-slate-200 bg-slate-100 text-slate-800 shadow-lg';
}

/** Common input appearance classes based on theme */
export function inputClass(theme: Theme) {
  return theme === 'dark'
    ? 'bg-slate-700/50 text-white placeholder-slate-400 focus:ring-slate-500'
    : 'bg-slate-200 text-slate-800 placeholder-slate-400 focus:ring-slate-400';
}

/** Muted text */
export function mutedClass(theme: Theme) {
  return theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
}

/** List item base style */
export function listItemClass(
  theme: Theme,
  isSelected: boolean,
  isHovered: boolean,
) {
  if (isSelected) {
    return theme === 'dark'
      ? 'bg-amber-500/20 text-amber-200'
      : 'bg-amber-100 text-amber-900';
  }
  if (isHovered) {
    return theme === 'dark'
      ? 'bg-slate-700/50 text-white'
      : 'bg-slate-200 text-slate-900';
  }
  return theme === 'dark'
    ? 'text-slate-300 hover:bg-slate-700/30'
    : 'text-slate-700 hover:bg-slate-200/70';
}
