import { useEffect, useRef } from 'react';

export interface GameLoopCallback {
  (deltaTime: number): void;
}

export interface GameLoopOptions {
  callback: GameLoopCallback;
  /** 固定步长（毫秒），0 或不传表示跟随浏览器帧率 */
  delay?: number;
  enabled?: boolean;
}

/**
 * 兼容两种调用方式：
 *   useGameLoop(callback, isRunning)
 *   useGameLoop({ callback, delay, enabled })
 */
export function useGameLoop(
  callbackOrOptions: GameLoopCallback | GameLoopOptions,
  isRunning: boolean = true
) {
  const isOptions = typeof callbackOrOptions !== 'function';
  const callback = isOptions ? callbackOrOptions.callback : callbackOrOptions;
  const delay = isOptions ? callbackOrOptions.delay ?? 0 : 0;
  const enabled = isOptions ? callbackOrOptions.enabled !== false : isRunning !== false;

  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const delayRef = useRef(delay);
  delayRef.current = delay;

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    let lastTime = performance.now();
    let accumulator = 0;

    const animate = (time: number) => {
      const delta = Math.min(time - lastTime, 200);
      lastTime = time;

      const step = delayRef.current;
      if (step > 0) {
        accumulator += delta;
        if (accumulator >= step) {
          const elapsed = accumulator;
          accumulator = 0;
          callbackRef.current(elapsed);
        }
      } else {
        callbackRef.current(delta);
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
}

export default useGameLoop;
