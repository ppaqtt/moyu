import { useEffect, useCallback, useRef } from 'react';

interface UseKeyboardOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onW?: () => void;
  onA?: () => void;
  onS?: () => void;
  onD?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onChange?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  enabled?: boolean;
}

export function useKeyboard(options: UseKeyboardOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (optionsRef.current.enabled === false) return;

    const key = e.key;
    let handled = true;

    switch (key) {
      case 'ArrowUp':
      case 'Up':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onArrowUp?.();
        optionsRef.current.onUp?.();
        optionsRef.current.onW?.();
        optionsRef.current.onChange?.('up');
        break;
      case 'ArrowDown':
      case 'Down':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onArrowDown?.();
        optionsRef.current.onDown?.();
        optionsRef.current.onS?.();
        optionsRef.current.onChange?.('down');
        break;
      case 'ArrowLeft':
      case 'Left':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onArrowLeft?.();
        optionsRef.current.onLeft?.();
        optionsRef.current.onA?.();
        optionsRef.current.onChange?.('left');
        break;
      case 'ArrowRight':
      case 'Right':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onArrowRight?.();
        optionsRef.current.onRight?.();
        optionsRef.current.onD?.();
        optionsRef.current.onChange?.('right');
        break;
      case 'w':
      case 'W':
        optionsRef.current.onW?.();
        optionsRef.current.onUp?.();
        optionsRef.current.onArrowUp?.();
        optionsRef.current.onChange?.('up');
        break;
      case 's':
      case 'S':
        optionsRef.current.onS?.();
        optionsRef.current.onDown?.();
        optionsRef.current.onArrowDown?.();
        optionsRef.current.onChange?.('down');
        break;
      case 'a':
      case 'A':
        optionsRef.current.onA?.();
        optionsRef.current.onLeft?.();
        optionsRef.current.onArrowLeft?.();
        optionsRef.current.onChange?.('left');
        break;
      case 'd':
      case 'D':
        optionsRef.current.onD?.();
        optionsRef.current.onRight?.();
        optionsRef.current.onArrowRight?.();
        optionsRef.current.onChange?.('right');
        break;
      case ' ':
      case 'Spacebar':
      case 'Space':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onSpace?.();
        break;
      case 'Escape':
      case 'Esc':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onEscape?.();
        break;
      default:
        handled = false;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);
}
