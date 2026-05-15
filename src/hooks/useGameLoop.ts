import { useEffect, useRef, useCallback } from 'react';

export interface GameLoopOptions {
  callback: (deltaTime: number) => void;
  delay?: number;
  enabled?: boolean;
}

export function useGameLoop(options: GameLoopOptions): void;
export function useGameLoop(callback: (deltaTime: number) => void, isRunning: boolean): void;
export function useGameLoop(
  optionsOrCallback: GameLoopOptions | ((deltaTime: number) => void),
  isRunning?: boolean
) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const lastCallbackTimeRef = useRef<number>(0);

  // 解析参数
  const isObjectFormat = typeof optionsOrCallback === 'object' && optionsOrCallback !== null;
  const callback = isObjectFormat 
    ? (optionsOrCallback as GameLoopOptions).callback 
    : optionsOrCallback as (deltaTime: number) => void;
  const enabled = isObjectFormat 
    ? (optionsOrCallback as GameLoopOptions).enabled !== false 
    : isRunning !== false;
  const delay = isObjectFormat 
    ? (optionsOrCallback as GameLoopOptions).delay || 0 
    : 0;

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const animate = useCallback((time: number) => {
    // 处理 delay 参数
    if (delay > 0) {
      const elapsed = time - lastCallbackTimeRef.current;
      if (elapsed < delay) {
        requestRef.current = requestAnimationFrame(animate);
        return;
      }
      lastCallbackTimeRef.current = time;
    }

    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callbackRef.current(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [delay]);

  useEffect(() => {
    if (enabled) {
      previousTimeRef.current = undefined;
      lastCallbackTimeRef.current = 0;
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [enabled, animate]);
}
