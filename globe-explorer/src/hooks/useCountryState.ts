import {useEffect, useState} from 'react';
import {useGlobeContext} from './useGlobeContext.ts';

export function useCountryState() {
  const globe = useGlobeContext();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  useEffect(() => {
    if (!globe) return;
    const countryState = globe.ctx.modules.countryState;

    const onSelect = (code: string) => setSelectedCode(code);
    const onDeselect = () => setSelectedCode(null);
    const onHover = (code: string) => setHoveredCode(code);
    const onUnhover = () => setHoveredCode(null);

    countryState.on('select', onSelect);
    countryState.on('deselect', onDeselect);
    countryState.on('hover', onHover);
    countryState.on('unhover', onUnhover);

    return () => {
      countryState.off('select', onSelect);
      countryState.off('deselect', onDeselect);
      countryState.off('hover', onHover);
      countryState.off('unhover', onUnhover);
    };
  }, [globe]);

  return {selectedCode, hoveredCode};
}
