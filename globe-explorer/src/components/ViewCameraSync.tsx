import {useEffect, useRef} from 'react';
import {useGlobeContext} from '../hooks/useGlobeContext.ts';

const TABLE_WIDTH_PX = 576; // 36rem

/**
 * Syncs the current view mode with the 3D camera.
 * When table is active on desktop, zooms out and shifts the globe right
 * via camera focal offset (no CSS transforms).
 */
export function ViewCameraSync({view}: {view: 'list' | 'table'}) {
  const globe = useGlobeContext();
  const restoreRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!globe) return;
    const camera = globe.ctx.modules.camera;
    const threeCtx = globe.ctx.three;

    if (view === 'table') {
      const isDesktop = window.matchMedia('(min-width: 768px)').matches;

      // Zoom out so the full globe is visible
      const savedDistance = camera.pushZoomToFit(true);
      const fitDistance = camera.getComputedFitDistance();

      // Shift globe to the right on desktop (table takes left side)
      if (isDesktop) {
        camera.setFocalOffsetPxAtDistance(
          -(TABLE_WIDTH_PX / 2),
          0,
          fitDistance,
          true,
        );
      }

      // Recalculate offset on resize
      const onResize = () => {
        const nowDesktop = window.matchMedia('(min-width: 768px)').matches;
        if (nowDesktop) {
          const newFitDistance = camera.getComputedFitDistance();
          camera.setFocalOffsetPxAtDistance(
            -(TABLE_WIDTH_PX / 2),
            0,
            newFitDistance,
            false,
          );
        } else {
          camera.clearFocalOffset(false);
        }
      };
      threeCtx.on('resize', onResize);

      restoreRef.current = [
        savedDistance,
        () => camera.clearFocalOffset(true),
        () => threeCtx.off('resize', onResize),
      ];
    } else {
      for (const restore of restoreRef.current) restore();
      restoreRef.current = [];
    }
  }, [view, globe]);

  return null;
}
