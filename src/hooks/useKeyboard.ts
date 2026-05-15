import { useEffect, useCallback, useRef } from 'react';

interface UseKeyboardOptions {
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
  enabled?: boolean;
}

export function useKeyboard(options: UseKeyboardOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!optionsRef.current.enabled) return;

    switch (e.key) {
      case 'ArrowUp':
      case 'Up':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onArrowUp?.();
        break;
      case 'ArrowDown':
      case 'Down':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onArrowDown?.();
        break;
      case 'ArrowLeft':
      case 'Left':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onArrowLeft?.();
        break;
      case 'ArrowRight':
      case 'Right':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onArrowRight?.();
        break;
      case 'w':
      case 'W':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onW?.();
        break;
      case 'a':
      case 'A':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onA?.();
        break;
      case 's':
      case 'S':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onS?.();
        break;
      case 'd':
      case 'D':
        e.preventDefault();
        e.stopPropagation();
        optionsRef.current.onD?.();
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
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);
}
