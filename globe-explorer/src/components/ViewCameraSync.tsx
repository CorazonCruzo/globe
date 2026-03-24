import {useEffect, useRef} from 'react';
import {useGlobeContext} from '../hooks/useGlobeContext.ts';

/**
 * Syncs the current view mode with the 3D camera.
 * When table is active, zooms out so globe fits; restores on switch back.
 */
export function ViewCameraSync({view}: {view: 'list' | 'table'}) {
  const globe = useGlobeContext();
  const restoreRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!globe) return;
    const camera = globe.ctx.modules.camera;

    if (view === 'table') {
      restoreRef.current = camera.pushZoomToFit(true);
    } else if (restoreRef.current) {
      restoreRef.current();
      restoreRef.current = null;
    }
  }, [view, globe]);

  return null;
}
