import {Raycaster, Vector2} from 'three/webgpu';
import {CoreContextModule} from '@vladkrutenyuk/three-kvy-core';
import type {Mesh, Object3D} from 'three/webgpu';
import type {CoreContext} from '@vladkrutenyuk/three-kvy-core';
import type {GlobeModules} from '../types.ts';

export class RaycastModule extends CoreContextModule<
  string | symbol,
  GlobeModules
> {
  private raycaster = new Raycaster();
  private pointer = new Vector2();
  private targets: Array<Object3D> = [];

  setTargets(meshes: Array<Object3D>) {
    this.targets = meshes;
  }

  protected useCtx(ctx: CoreContext<GlobeModules>) {
    let activeContainer: HTMLDivElement | null = null;

    let pointerMoved = false;
    let pointerDownPos = new Vector2();

    const updatePointer = (e: PointerEvent) => {
      if (!activeContainer) return;
      const rect = activeContainer.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerMoved = false;
      pointerDownPos = new Vector2(e.clientX, e.clientY);
    };

    const onPointerMove = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        pointerMoved = true;
      }

      // Skip hover on touch devices — only hover with mouse
      if (e.pointerType !== 'mouse') {
        if (pointerMoved) {
          ctx.modules.countryState.hover(null);
        }
        return;
      }

      updatePointer(e);
      this.raycaster.setFromCamera(this.pointer, ctx.three.camera);
      const hits = this.raycaster.intersectObjects(this.targets, false);

      const countryState = ctx.modules.countryState;
      if (hits.length > 0) {
        const code = (hits[0].object as Mesh).userData['countryCode'] as
          | string
          | null;
        if (code) {
          countryState.hover(code);
          if (activeContainer) activeContainer.style.cursor = 'pointer';
        } else {
          countryState.hover(null);
          if (activeContainer) activeContainer.style.cursor = 'default';
        }
      } else {
        countryState.hover(null);
        if (activeContainer) activeContainer.style.cursor = 'default';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerMoved) return;

      updatePointer(e);
      this.raycaster.setFromCamera(this.pointer, ctx.three.camera);
      const hits = this.raycaster.intersectObjects(this.targets, false);

      const countryState = ctx.modules.countryState;
      if (hits.length > 0) {
        const code = (hits[0].object as Mesh).userData['countryCode'] as
          | string
          | null;
        if (code) {
          countryState.select(code);
        }
      } else {
        countryState.select(null);
      }

      if (e.pointerType !== 'mouse') {
        countryState.hover(null);
        if (activeContainer) activeContainer.style.cursor = 'default';
      }
    };

    const onPointerLeave = () => {
      ctx.modules.countryState.hover(null);
      if (activeContainer) activeContainer.style.cursor = 'default';
    };

    const attachListeners = (container: HTMLDivElement) => {
      activeContainer = container;
      container.addEventListener('pointerdown', onPointerDown);
      container.addEventListener('pointermove', onPointerMove);
      container.addEventListener('pointerup', onPointerUp);
      container.addEventListener('pointerleave', onPointerLeave);
    };

    const container = ctx.three.container;
    if (container) {
      attachListeners(container);
    }
    ctx.three.on('mount', attachListeners);

    return () => {
      ctx.three.off('mount', attachListeners);
      if (activeContainer) {
        activeContainer.removeEventListener('pointerdown', onPointerDown);
        activeContainer.removeEventListener('pointermove', onPointerMove);
        activeContainer.removeEventListener('pointerup', onPointerUp);
        activeContainer.removeEventListener('pointerleave', onPointerLeave);
        activeContainer.style.cursor = 'default';
      }
    };
  }
}
