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
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  enabled?: boolean;
}

const ACTION_BY_KEY: Record<string, keyof Omit<UseKeyboardOptions, 'enabled'>> = {
  ArrowUp: 'onArrowUp',
  Up: 'onArrowUp',
  w: 'onW',
  W: 'onW',
  ArrowDown: 'onArrowDown',
  Down: 'onArrowDown',
  s: 'onS',
  S: 'onS',
  ArrowLeft: 'onArrowLeft',
  Left: 'onArrowLeft',
  a: 'onA',
  A: 'onA',
  ArrowRight: 'onArrowRight',
  Right: 'onArrowRight',
  d: 'onD',
  D: 'onD',
  q: 'onLeft',
  Q: 'onLeft',
  e: 'onRight',
  E: 'onRight',
  ' ': 'onSpace',
  Spacebar: 'onSpace',
  Space: 'onSpace',
  Escape: 'onEscape',
  Esc: 'onEscape',
};

export function useKeyboard(options: UseKeyboardOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!optionsRef.current.enabled) return;

    const action = ACTION_BY_KEY[e.key];
    if (!action) return;

    e.preventDefault();
    e.stopPropagation();
    optionsRef.current[action]?.();

    const aliasByAction: Partial<Record<typeof action, keyof Omit<UseKeyboardOptions, 'enabled'>>> = {
      onArrowUp: 'onUp',
      onArrowDown: 'onDown',
      onArrowLeft: 'onLeft',
      onArrowRight: 'onRight',
    };
    const alias = aliasByAction[action];
    if (alias) optionsRef.current[alias]?.();
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);
}
