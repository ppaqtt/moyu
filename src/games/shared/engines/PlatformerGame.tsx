import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import { useGameLoop } from '../../../hooks/useGameLoop';
import type { EngineProps, GameStatus } from '../types';

const W = 840;
const H = 440;
const GRAVITY = 0.75;
const MOVE = 4.2;
const JUMP = -13.5;

interface Platform { x: number; y: number; w: number; h: number }
interface Coin { x: number; y: number; taken: boolean }

const PLATFORMS: Platform[] = [
  { x: 0, y: 390, w: W, h: 50 },
  { x: 120, y: 310, w: 130, h: 14 },
  { x: 310, y: 250, w: 120, h: 14 },
  { x: 490, y: 315, w: 120, h: 14 },
  { x: 660, y: 235, w: 140, h: 14 },
  { x: 720, y: 150, w: 90, h: 14 },
];

const COIN_SPOTS: [number, number][] = [
  [155, 270], [215, 270], [345, 210], [405, 210], [525, 275], [585, 275], [695, 195], [760, 110],
];

const GOAL = { x: 745, y: 90, w: 44, h: 60 };

export default function PlatformerGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [coinsGot, setCoinsGot] = useState(0);

  const px = useRef(50);
  const py = useRef(340);
  const vx = useRef(0);
  const vy = useRef(0);
  const onGround = useRef(false);
  const keys = useRef<Set<string>>(new Set());
  const coins = useRef<Coin[]>([]);
  const heartsRef = useRef(3);
  const scoreRef = useRef(0);
  const frame = useRef(0);

  const start = useCallback(() => {
    px.current = 50;
    py.current = 340;
    vx.current = 0;
    vy.current = 0;
    onGround.current = false;
    keys.current.clear();
    coins.current = COIN_SPOTS.map(([x, y]) => ({ x, y, taken: false }));
    heartsRef.current = 3;
    scoreRef.current = 0;
    frame.current = 0;
    setHearts(3);
    setCoinsGot(0);
    setScore(0);
    setStatus('playing');
    report(0);
  }, [report]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) e.preventDefault();
      keys.current.add(e.key);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
    };
  }, []);

  useGameLoop({
    delay: 16,
    enabled: status === 'playing',
    callback: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      frame.current++;
      const k = keys.current;
      const left = k.has('ArrowLeft') || k.has('a') || k.has('A');
      const right = k.has('ArrowRight') || k.has('d') || k.has('D');
      const jump = k.has('ArrowUp') || k.has('w') || k.has('W') || k.has(' ');
      vx.current = left && !right ? -MOVE : right && !left ? MOVE : 0;

      if (jump && onGround.current) {
        vy.current = JUMP;
        onGround.current = false;
      }

      vy.current += GRAVITY;
      px.current += vx.current;
      py.current += vy.current;
      px.current = Math.max(0, Math.min(W - 34, px.current));

      onGround.current = false;
      for (const platform of PLATFORMS) {
        if (
          px.current + 34 > platform.x &&
          px.current < platform.x + platform.w &&
          py.current + 42 >= platform.y &&
          py.current + 42 <= platform.y + platform.h + Math.abs(vy.current) + 6 &&
          vy.current >= 0
        ) {
          py.current = platform.y - 42;
          vy.current = 0;
          onGround.current = true;
        }
      }

      for (const coin of coins.current) {
        if (!coin.taken && Math.abs(px.current + 17 - coin.x) < 26 && Math.abs(py.current + 21 - coin.y) < 30) {
          coin.taken = true;
          scoreRef.current += 50;
          setCoinsGot(prev => prev + 1);
          setScore(scoreRef.current);
          report(scoreRef.current);
        }
      }

      if (py.current > H + 80) {
        heartsRef.current -= 1;
        setHearts(heartsRef.current);
        px.current = 50;
        py.current = 340;
        vy.current = 0;
        if (heartsRef.current <= 0) {
          setStatus('lost');
          finish(scoreRef.current);
          return;
        }
      }

      if (px.current + 30 > GOAL.x && px.current < GOAL.x + GOAL.w && py.current + 42 > GOAL.y && py.current < GOAL.y + GOAL.h) {
        const finalScore = scoreRef.current + heartsRef.current * 100 + 500;
        scoreRef.current = finalScore;
        setScore(finalScore);
        setStatus('won');
        finish(finalScore);
        return;
      }

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0b1026');
      sky.addColorStop(0.7, '#16213e');
      sky.addColorStop(1, '#0f3460');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 50; i++) {
        const x = (i * 137) % W;
        const y = (i * 71 + frame.current * 0.4) % 300;
        ctx.fillRect(x, y, 2, 2);
      }

      for (const platform of PLATFORMS) {
        ctx.fillStyle = platform.y === 390 ? '#14532d' : '#334155';
        ctx.beginPath();
        ctx.roundRect(platform.x, platform.y, platform.w, platform.h, 5);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(platform.x, platform.y, platform.w, 4);
      }

      for (const coin of coins.current) {
        if (coin.taken) continue;
        const bob = Math.sin((frame.current + coin.x) / 14) * 3;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y + bob, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = '#22c55e';
      ctx.fillRect(GOAL.x, GOAL.y, 6, GOAL.h);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(GOAL.x + 6, GOAL.y);
      ctx.lineTo(GOAL.x + 44, GOAL.y + 14);
      ctx.lineTo(GOAL.x + 6, GOAL.y + 28);
      ctx.closePath();
      ctx.fill();

      const grad = ctx.createLinearGradient(px.current, py.current, px.current + 34, py.current + 42);
      grad.addColorStop(0, meta.primary);
      grad.addColorStop(1, meta.secondary);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(px.current, py.current, 34, 42, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(px.current + 23, py.current + 13, 4, 0, Math.PI * 2);
      ctx.fill();
    },
  });

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '生命', value: '❤️'.repeat(Math.max(0, hearts)) }, { label: '金币', value: `${coinsGot}/${COIN_SPOTS.length}` }]}
      resultText={`收集了 ${coinsGot} 枚金币`}
      hint="← → / A D 移动，空格 / ↑ / W 跳跃；收集金币并到达终点旗帜"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          横版跳跃冒险。<br />利用平台跳跃，收集金币，抵达右上角的终点旗帜。
        </StartPanel>
      ) : (
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: '100%', maxWidth: 840, aspectRatio: `${W} / ${H}`, borderRadius: 14, border: `1px solid ${meta.primary}44`, touchAction: 'none' }}
        />
      )}
    </GameFrame>
  );
}
