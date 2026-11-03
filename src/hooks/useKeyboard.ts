import { useEffect, useCallback, useRef } from 'react';

export interface UseKeyboardOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  /** 方向键别名，兼容不同游戏的写法 */
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onW?: () => void;
  onA?: () => void;
  onS?: () => void;
  onD?: () => void;
  onSpace?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onKey?: (key: string) => void;
  /** 默认开启，只有显式传 false 时才禁用 */
  enabled?: boolean;
}

export function useKeyboard(options: UseKeyboardOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const opts = optionsRef.current;
    if (opts.enabled === false) return;

    const key = e.key;
    const lower = key.toLowerCase();

    switch (key) {
      case 'ArrowUp':
      case 'Up':
        e.preventDefault();
        e.stopPropagation();
        (opts.onArrowUp || opts.onUp)?.();
        return;
      case 'ArrowDown':
      case 'Down':
        e.preventDefault();
        e.stopPropagation();
        (opts.onArrowDown || opts.onDown)?.();
        return;
      case 'ArrowLeft':
      case 'Left':
        e.preventDefault();
        e.stopPropagation();
        (opts.onArrowLeft || opts.onLeft)?.();
        return;
      case 'ArrowRight':
      case 'Right':
        e.preventDefault();
        e.stopPropagation();
        (opts.onArrowRight || opts.onRight)?.();
        return;
      case ' ':
      case 'Spacebar':
      case 'Space':
        e.preventDefault();
        e.stopPropagation();
        opts.onSpace?.();
        return;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        (opts.onEnter || opts.onSpace)?.();
        return;
      case 'Escape':
      case 'Esc':
        e.preventDefault();
        e.stopPropagation();
        opts.onEscape?.();
        return;
    }

    if (lower === 'w') { e.preventDefault(); (opts.onW || opts.onArrowUp || opts.onUp)?.(); }
    else if (lower === 'a') { e.preventDefault(); (opts.onA || opts.onArrowLeft || opts.onLeft)?.(); }
    else if (lower === 's') { e.preventDefault(); (opts.onS || opts.onArrowDown || opts.onDown)?.(); }
    else if (lower === 'd') { e.preventDefault(); (opts.onD || opts.onArrowRight || opts.onRight)?.(); }

    opts.onKey?.(key);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);
}

export default useKeyboard;
