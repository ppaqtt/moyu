import { useEffect, useRef, useCallback } from 'react';

export interface GameLoopCallback {
  (deltaTime: number): void;
}

interface GameLoopOptions {
  callback: GameLoopCallback;
  delay?: number;
  enabled?: boolean;
}

type UseGameLoopArgs =
  | [callback: GameLoopCallback, isRunning: boolean]
  | [options: GameLoopOptions];

export function useGameLoop(...args: UseGameLoopArgs) {
  // Support both call signatures:
  //   useGameLoop(callback, isRunning)
  //   useGameLoop({ callback, delay, enabled })
  let callback: GameLoopCallback;
  let isRunning: boolean;
  let delay: number | undefined;

  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
    const opts = args[0] as GameLoopOptions;
    callback = opts.callback;
    isRunning = opts.enabled ?? true;
    delay = opts.delay;
  } else {
    callback = args[0] as GameLoopCallback;
    isRunning = args[1] as boolean;
  }

  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callbackRef.current(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    previousTimeRef.current = undefined;

    if (delay !== undefined && delay > 0) {
      // Use interval-based loop when a delay is specified
      const intervalId = setInterval(() => {
        callbackRef.current(delay);
      }, delay);
      return () => clearInterval(intervalId);
    }

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning, delay, animate]);
}
