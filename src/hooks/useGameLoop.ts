import { useEffect, useRef, useCallback } from 'react';

/**
 * 两种调用形式：
 *  1. 函数形式：useGameLoop(callback, isRunning)
 *     - callback: (deltaTime: number) => void
 *     - 使用 requestAnimationFrame，回调参数为帧间隔毫秒数
 *  2. 对象形式：useGameLoop({ callback, delay, enabled })
 *     - callback: () => void  （无参）
 *     - delay: number （毫秒，固定间隔触发）
 *     - enabled: boolean （是否运行）
 *
 * 历史代码使用了对象形式但旧实现只支持函数形式，导致大量游戏运行时崩溃。
 * 这里做向后兼容的双形式分发。
 */

export type GameLoopCallback = (deltaTime: number) => void;

export interface UseGameLoopOptions {
  callback: () => void;
  delay?: number;
  enabled?: boolean;
}

type AnyArgs = unknown;

function isOptionsObject(args: AnyArgs): args is UseGameLoopOptions {
  return (
    typeof args === 'object' &&
    args !== null &&
    !Array.isArray(args) &&
    typeof (args as UseGameLoopOptions).callback === 'function'
  );
}

// 函数形式重载：rAF 驱动，向回调传入 deltaTime
function useGameLoopFn(callback: GameLoopCallback, isRunning: boolean): void {
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
    if (isRunning) {
      previousTimeRef.current = undefined;
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning, animate]);
}

// 对象形式重载：setInterval 驱动，固定延迟触发
function useGameLoopOptions(options: UseGameLoopOptions): void {
  const { callback, delay = 16, enabled = true } = options;
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      callbackRef.current();
    }, delay);
    return () => window.clearInterval(id);
  }, [delay, enabled]);
}

export function useGameLoop(
  argsOrCallback: UseGameLoopOptions | GameLoopCallback,
  isRunning?: boolean
): void {
  if (isOptionsObject(argsOrCallback)) {
    useGameLoopOptions(argsOrCallback);
    return;
  }
  // 函数形式
  useGameLoopFn(argsOrCallback as GameLoopCallback, Boolean(isRunning));
}

export default useGameLoop;
