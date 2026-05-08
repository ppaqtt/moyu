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
        e.preventDefault();
        optionsRef.current.onArrowUp?.();
        optionsRef.current.onW?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        optionsRef.current.onArrowDown?.();
        optionsRef.current.onS?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        optionsRef.current.onArrowLeft?.();
        optionsRef.current.onA?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        optionsRef.current.onArrowRight?.();
        optionsRef.current.onD?.();
        break;
      case ' ':
        e.preventDefault();
        optionsRef.current.onSpace?.();
        break;
      case 'Escape':
        e.preventDefault();
        optionsRef.current.onEscape?.();
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
