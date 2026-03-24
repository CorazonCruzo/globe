import type {Clock} from 'three/webgpu';

/**
 * Lightweight Clock-compatible implementation using performance.now().
 * Avoids importing the deprecated THREE.Clock constructor.
 */
class FrameClockImpl {
  autoStart: boolean;
  startTime = 0;
  oldTime = 0;
  elapsedTime = 0;
  running = false;

  constructor(autoStart = true) {
    this.autoStart = autoStart;
  }

  start() {
    const now = performance.now() / 1000;
    this.startTime = now;
    this.oldTime = now;
    this.elapsedTime = 0;
    this.running = true;
  }

  stop() {
    this.getElapsedTime();
    this.running = false;
  }

  getElapsedTime() {
    this.getDelta();
    return this.elapsedTime;
  }

  getDelta() {
    if (!this.running) {
      if (this.autoStart) {
        this.start();
        return 0;
      }
      return 0;
    }
    const now = performance.now() / 1000;
    const diff = now - this.oldTime;
    this.oldTime = now;
    this.elapsedTime += diff;
    return diff;
  }
}

export function createClock(): Clock {
  return new FrameClockImpl() as unknown as Clock;
}
