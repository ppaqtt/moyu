import { useEffect, useRef, useCallback } from 'react';

export interface GameLoopCallback {
  (deltaTime: number): void;
}

export interface GameLoopOptions {
  callback: GameLoopCallback;
  /** 两次逻辑更新之间的最小间隔（毫秒），默认按每帧执行 */
  delay?: number;
  /** 是否运行 */
  enabled?: boolean;
}

/**
 * 游戏主循环。
 *
 * 支持两种调用方式：
 * - useGameLoop(callback, isRunning)          每帧执行，回调参数为帧间隔
 * - useGameLoop({ callback, delay, enabled }) 按 delay 节流执行（适合格子类/回合类游戏）
 */
export function useGameLoop(
  callbackOrOptions: GameLoopCallback | GameLoopOptions,
  isRunning?: boolean
) {
  const isOptions = typeof callbackOrOptions === 'object' && callbackOrOptions !== null;
  const callback: GameLoopCallback =
    typeof callbackOrOptions === 'function' ? callbackOrOptions : callbackOrOptions.callback;
  const delay = isOptions ? Math.max(0, callbackOrOptions.delay ?? 0) : 0;
  const running = isOptions ? callbackOrOptions.enabled !== false : !!isRunning;

  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  const animate = useCallback(
    (time: number) => {
      const previous = previousTimeRef.current;
      const delta = previous === undefined ? 0 : time - previous;

      if (previous === undefined || delay <= 0 || delta >= delay) {
        callbackRef.current(delta || delay || 16.67);
        previousTimeRef.current = time;
      }

      requestRef.current = requestAnimationFrame(animate);
    },
    [delay]
  );

  useEffect(() => {
    if (!running) return;

    previousTimeRef.current = undefined;
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [running, animate]);
}
