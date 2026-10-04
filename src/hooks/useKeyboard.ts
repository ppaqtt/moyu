import { useEffect, useCallback, useRef } from 'react';

/**
 * useKeyboard
 *
 * 支持的回调：
 *  - onArrowUp / onArrowDown / onArrowLeft / onArrowRight  方向键
 *  - onSpace                                                空格
 *  - onEscape                                               Esc
 *  - onW / onA / onS / onD                                  WASD（大小写均触发）
 *  - onKey?: (key: string) => void                          任意按键的兜底回调
 *
 *  enabled 为 false 时整体禁用。
 *
 * 历史实现只识别方向键/空格/Esc，导致大量使用 WASD 的游戏无法控制。
 */
export interface UseKeyboardOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onW?: () => void;
  onA?: () => void;
  onS?: () => void;
  onD?: () => void;
  onKey?: (key: string) => void;
  enabled?: boolean;
}

export function useKeyboard(options: UseKeyboardOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const opts = optionsRef.current;
    if (opts.enabled === false) return;

    const key = e.key;
    const lower = key.length === 1 ? key.toLowerCase() : key;

    // 始终允许通过 onKey 暴露原始按键
    if (opts.onKey) {
      opts.onKey(key);
    }

    switch (key) {
      case 'ArrowUp':
      case 'Up':
        e.preventDefault();
        e.stopPropagation();
        opts.onArrowUp?.();
        break;
      case 'ArrowDown':
      case 'Down':
        e.preventDefault();
        e.stopPropagation();
        opts.onArrowDown?.();
        break;
      case 'ArrowLeft':
      case 'Left':
        e.preventDefault();
        e.stopPropagation();
        opts.onArrowLeft?.();
        break;
      case 'ArrowRight':
      case 'Right':
        e.preventDefault();
        e.stopPropagation();
        opts.onArrowRight?.();
        break;
      case ' ':
      case 'Spacebar':
      case 'Space':
        e.preventDefault();
        e.stopPropagation();
        opts.onSpace?.();
        break;
      case 'Escape':
      case 'Esc':
        e.preventDefault();
        e.stopPropagation();
        opts.onEscape?.();
        break;
      default:
        // WASD 等
        if (lower !== key) {
          // 小写化后才进入此处（即字母键）
          switch (lower) {
            case 'w':
              e.preventDefault();
              opts.onW?.();
              break;
            case 'a':
              e.preventDefault();
              opts.onA?.();
              break;
            case 's':
              e.preventDefault();
              opts.onS?.();
              break;
            case 'd':
              e.preventDefault();
              opts.onD?.();
              break;
          }
        }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);
}

export default useKeyboard;
