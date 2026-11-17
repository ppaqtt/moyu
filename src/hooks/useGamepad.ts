import { useEffect, useRef, useState } from 'react';

export const GAMEPAD_ENABLED_KEY = 'moyu_gamepad_enabled';
export const GAMEPAD_TOGGLE_EVENT = 'moyu:gamepad-toggle';

export interface GamepadBinding {
  action: string;
  source: string;
  key: string;
  code: string;
}

export const GAMEPAD_BINDINGS: GamepadBinding[] = [
  { action: '方向上', source: '十字键 ↑ / 左摇杆', key: 'ArrowUp', code: 'ArrowUp' },
  { action: '方向下', source: '十字键 ↓ / 左摇杆', key: 'ArrowDown', code: 'ArrowDown' },
  { action: '方向左', source: '十字键 ← / 左摇杆', key: 'ArrowLeft', code: 'ArrowLeft' },
  { action: '方向右', source: '十字键 → / 左摇杆', key: 'ArrowRight', code: 'ArrowRight' },
  { action: 'A 键（确认/跳跃/射击）', source: 'A / ×', key: ' ', code: 'Space' },
  { action: 'B 键（返回/取消）', source: 'B / ○', key: 'Escape', code: 'Escape' },
  { action: 'Start 键（暂停）', source: 'Start / Options', key: 'p', code: 'KeyP' },
];

export interface ConnectedGamepad {
  index: number;
  id: string;
  mapping: string;
  buttons: number;
  axes: number;
}

export function isGamepadEnabled() {
  return localStorage.getItem(GAMEPAD_ENABLED_KEY) !== 'false';
}

export function setGamepadEnabled(enabled: boolean) {
  localStorage.setItem(GAMEPAD_ENABLED_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new Event(GAMEPAD_TOGGLE_EVENT));
}

export function useGamepadStatus(): ConnectedGamepad[] {
  const [pads, setPads] = useState<ConnectedGamepad[]>([]);

  useEffect(() => {
    let frame = 0;
    let lastSignature = '';

    const update = () => {
      const list = navigator.getGamepads ? navigator.getGamepads() : [];
      const connected: ConnectedGamepad[] = [];
      for (let i = 0; i < list.length; i++) {
        const pad = list[i];
        if (!pad || !pad.connected) continue;
        connected.push({
          index: pad.index,
          id: pad.id,
          mapping: pad.mapping || 'standard',
          buttons: pad.buttons.length,
          axes: pad.axes.length,
        });
      }
      const signature = connected.map(p => `${p.index}:${p.id}`).join('|');
      if (signature !== lastSignature) {
        lastSignature = signature;
        setPads(connected);
      }
    };

    const loop = () => {
      update();
      frame = window.setTimeout(loop, 500);
    };

    update();
    loop();
    window.addEventListener('gamepadconnected', update);
    window.addEventListener('gamepaddisconnected', update);
    return () => {
      window.clearTimeout(frame);
      window.removeEventListener('gamepadconnected', update);
      window.removeEventListener('gamepaddisconnected', update);
    };
  }, []);

  return pads;
}

interface DirectionState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

const DIRECTIONS: Array<{ name: keyof DirectionState; key: string; code: string }> = [
  { name: 'up', key: 'ArrowUp', code: 'ArrowUp' },
  { name: 'down', key: 'ArrowDown', code: 'ArrowDown' },
  { name: 'left', key: 'ArrowLeft', code: 'ArrowLeft' },
  { name: 'right', key: 'ArrowRight', code: 'ArrowRight' },
];

function dispatchKey(type: 'keydown' | 'keyup', key: string, code: string) {
  window.dispatchEvent(
    new KeyboardEvent(type, {
      key,
      code,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function isTypingTarget() {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  );
}

/**
 * 全局手柄桥接：把标准手柄的方向键/左摇杆/AB/Start 映射为键盘事件，
 * 让现有键盘操作的游戏无需逐个改造即可支持手柄。
 */
export function useGamepadBridge() {
  const enabledRef = useRef(isGamepadEnabled());
  const pressedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const syncEnabled = () => {
      enabledRef.current = isGamepadEnabled();
      if (!enabledRef.current) {
        pressedRef.current = {};
      }
    };
    window.addEventListener('storage', syncEnabled);
    window.addEventListener(GAMEPAD_TOGGLE_EVENT, syncEnabled);
    return () => {
      window.removeEventListener('storage', syncEnabled);
      window.removeEventListener(GAMEPAD_TOGGLE_EVENT, syncEnabled);
    };
  }, []);

  useEffect(() => {
    let frame = 0;

    const setPressed = (id: string, pressed: boolean, key: string, code: string) => {
      const previous = pressedRef.current[id] || false;
      if (previous === pressed) return;
      pressedRef.current[id] = pressed;
      if (isTypingTarget()) return;
      dispatchKey(pressed ? 'keydown' : 'keyup', key, code);
    };

    const poll = () => {
      if (enabledRef.current) {
        const list = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < list.length; i++) {
          const pad = list[i];
          if (!pad || !pad.connected) continue;

          const dirs: DirectionState = {
            up: Boolean(pad.buttons[12]?.pressed),
            down: Boolean(pad.buttons[13]?.pressed),
            left: Boolean(pad.buttons[14]?.pressed),
            right: Boolean(pad.buttons[15]?.pressed),
          };

          const axisX = pad.axes[0] || 0;
          const axisY = pad.axes[1] || 0;
          const threshold = 0.55;
          if (!dirs.left && axisX < -threshold) dirs.left = true;
          if (!dirs.right && axisX > threshold) dirs.right = true;
          if (!dirs.up && axisY < -threshold) dirs.up = true;
          if (!dirs.down && axisY > threshold) dirs.down = true;

          for (const dir of DIRECTIONS) {
            setPressed(`pad${pad.index}-dir-${dir.name}`, dirs[dir.name], dir.key, dir.code);
          }

          setPressed(`pad${pad.index}-a`, Boolean(pad.buttons[0]?.pressed), ' ', 'Space');
          setPressed(`pad${pad.index}-b`, Boolean(pad.buttons[1]?.pressed), 'Escape', 'Escape');
          setPressed(`pad${pad.index}-start`, Boolean(pad.buttons[9]?.pressed), 'p', 'KeyP');
        }
      }
      frame = window.requestAnimationFrame(poll);
    };

    frame = window.requestAnimationFrame(poll);
    return () => window.cancelAnimationFrame(frame);
  }, []);
}
