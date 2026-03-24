import {Vector3} from 'three/webgpu';
import {uniform} from 'three/tsl';
import {getSunDirection} from '../utils/sunPosition.ts';

/** Shared sun direction uniform — updated each frame from UTC time. */
export const sunDirection = new Vector3();
export const sunDirUniform = uniform(sunDirection);

/** Call once per frame to refresh the sun direction from the system clock. */
export function updateSunDirection() {
  const dir = getSunDirection();
  sunDirection.copy(dir);
  sunDirUniform.value.copy(dir);
}

// Initialize immediately
updateSunDirection();
