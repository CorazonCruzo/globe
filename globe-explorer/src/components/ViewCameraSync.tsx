import {useEffect, useRef} from 'react';
import {useGlobeContext} from '../hooks/useGlobeContext.ts';

const TABLE_WIDTH_PX = 576; // 36rem on lg+
const LIST_WIDTH_PX = 256; // w-64
const TABLET_QUERY = '(min-width: 768px) and (max-width: 1023px)';
const DESKTOP_QUERY = '(min-width: 1024px)';

function getOffset(view: 'list' | 'table'): {x: number; y: number} {
  const isTablet = window.matchMedia(TABLET_QUERY).matches;
  const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;

  let x = 0;

  if (view === 'table' && isDesktop) {
    // lg+: wide table panel on the left
    x = -(TABLE_WIDTH_PX / 2);
  } else if (isTablet) {
    // md-lg: both list and table are w-64 on the left
    x = -(LIST_WIDTH_PX / 2);
  }

  return {x, y: 0};
}

/**
 * Syncs the current view mode with the 3D camera.
 * - Table view on desktop: zooms out + shifts globe right
 * - List view on tablet: shifts globe right
 * - Mobile: shifts globe down below top controls
 */
export function ViewCameraSync({view}: {view: 'list' | 'table'}) {
  const globe = useGlobeContext();
  const restoreRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!globe) return;
    const camera = globe.ctx.modules.camera;
    const threeCtx = globe.ctx.three;

    // Clean up previous state
    for (const restore of restoreRef.current) restore();
    restoreRef.current = [];

    const offset = getOffset(view);
    const hasOffset = offset.x !== 0 || offset.y !== 0;

    // Determine panel width that reduces available space
    const isTablet = window.matchMedia(TABLET_QUERY).matches;
    const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
    let panelInset = 0;
    if (view === 'table' && isDesktop) {
      panelInset = TABLE_WIDTH_PX;
    } else if (isTablet) {
      panelInset = LIST_WIDTH_PX;
    }

    // Zoom out to fit in available space (excluding panel)
    let savedDistance: (() => void) | null = null;
    if (panelInset > 0) {
      savedDistance = camera.pushZoomToFit(true, panelInset);
    }

    // Apply focal offset
    if (hasOffset) {
      const fitDistance = camera.getComputedFitDistance(panelInset);
      camera.setFocalOffsetPxAtDistance(offset.x, offset.y, fitDistance, true);
    }

    // Recalculate on resize
    const onResize = () => {
      const newOffset = getOffset(view);
      const newHasOffset = newOffset.x !== 0 || newOffset.y !== 0;
      const nowTablet = window.matchMedia(TABLET_QUERY).matches;
      const nowDesktop = window.matchMedia(DESKTOP_QUERY).matches;
      let newInset = 0;
      if (view === 'table' && nowDesktop) newInset = TABLE_WIDTH_PX;
      else if (nowTablet) newInset = LIST_WIDTH_PX;

      if (newHasOffset) {
        const fitDist = camera.getComputedFitDistance(newInset);
        camera.setFocalOffsetPxAtDistance(
          newOffset.x,
          newOffset.y,
          fitDist,
          false,
        );
      } else {
        camera.clearFocalOffset(false);
      }
    };
    threeCtx.on('resize', onResize);

    restoreRef.current = [
      ...(savedDistance ? [savedDistance] : []),
      ...(hasOffset ? [() => camera.clearFocalOffset(true)] : []),
      () => threeCtx.off('resize', onResize),
    ];
  }, [view, globe]);

  return null;
}
