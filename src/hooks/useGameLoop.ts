import { useEffect, useRef, useCallback } from 'react';

interface UseGameLoopOptions {
  callback: () => void;
  delay: number;
  enabled: boolean;
}

export function useGameLoop({ callback, delay, enabled }: UseGameLoopOptions) {
  const savedCallback = useRef(callback);
  const delayRef = useRef(delay);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    delayRef.current = delay;
  }, [delay]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let id: number;
    const tick = () => {
      if (enabledRef.current) {
        savedCallback.current();
        id = window.setTimeout(tick, delayRef.current);
      }
    };

    id = window.setTimeout(tick, delayRef.current);
    return () => clearTimeout(id);
  }, [enabled, delay]);
}

export function useRAFLoop(callback: () => void, enabled: boolean) {
  const savedCallback = useRef(callback);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const animate = (time: number) => {
      if (time - lastTimeRef.current >= 16) {
        savedCallback.current();
        lastTimeRef.current = time;
      }
      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [enabled]);
}
