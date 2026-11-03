import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import { useGameLoop } from '../../../hooks/useGameLoop';
import { useKeyboard } from '../../../hooks/useKeyboard';
import type { EngineProps, GameStatus } from '../types';

const W = 560;
const H = 620;
const PADDLE_W = 104;
const PADDLE_H = 12;
const BALL_R = 8;
const ROWS = 6;
const COLS = 9;
const BRICK_W = (W - 40) / COLS;
const BRICK_H = 22;
const MAX_LEVEL = 3;

interface Brick { x: number; y: number; alive: boolean; color: string }
interface Ball { x: number; y: number; vx: number; vy: number }

const BRICK_COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#a855f7'];

function makeBricks(level: number): Brick[] {
  const bricks: Brick[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({
        x: 20 + c * BRICK_W,
        y: 70 + r * (BRICK_H + 8),
        alive: true,
        color: BRICK_COLORS[(r + level) % BRICK_COLORS.length],
      });
    }
  }
  return bricks;
}

export default function BreakoutGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);

  const paddleX = useRef(W / 2);
  const paddleTarget = useRef(W / 2);
  const ball = useRef<Ball>({ x: W / 2, y: H - 90, vx: 3.2, vy: -3.8 });
  const bricks = useRef<Brick[]>(makeBricks(1));
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const statusRef = useRef<GameStatus>('idle');
  statusRef.current = status;

  const resetBall = () => {
    ball.current = {
      x: W / 2,
      y: H - 90,
      vx: (Math.random() < 0.5 ? -1 : 1) * (3 + levelRef.current * 0.4),
      vy: -(4 + levelRef.current * 0.35),
    };
  };

  const startLevel = (nextLevel: number) => {
    levelRef.current = nextLevel;
    setLevel(nextLevel);
    bricks.current = makeBricks(nextLevel);
    paddleX.current = W / 2;
    resetBall();
  };

  const start = useCallback(() => {
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    startLevel(1);
    setStatus('playing');
    report(0);
  }, [report]);

  const loseLife = () => {
    livesRef.current -= 1;
    setLives(livesRef.current);
    if (livesRef.current <= 0) {
      setStatus('lost');
      finish(scoreRef.current);
    } else {
      resetBall();
    }
  };

  useKeyboard({
    onArrowLeft: () => { paddleTarget.current = Math.max(0, paddleTarget.current - 42); },
    onArrowRight: () => { paddleTarget.current = Math.min(W - PADDLE_W, paddleTarget.current + 42); },
    onA: () => { paddleTarget.current = Math.max(0, paddleTarget.current - 42); },
    onD: () => { paddleTarget.current = Math.min(W - PADDLE_W, paddleTarget.current + 42); },
    enabled: status === 'playing',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const move = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      const x = ((clientX - rect.left) / rect.width) * W;
      paddleTarget.current = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
    };
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('touchmove', move, { passive: true });
    return () => {
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('touchmove', move);
    };
  }, []);

  useGameLoop({
    delay: 16,
    enabled: status === 'playing',
    callback: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      paddleX.current += (paddleTarget.current - paddleX.current) * 0.28;
      const b = ball.current;
      b.x += b.vx;
      b.y += b.vy;

      if (b.x < BALL_R) { b.x = BALL_R; b.vx = Math.abs(b.vx); }
      if (b.x > W - BALL_R) { b.x = W - BALL_R; b.vx = -Math.abs(b.vx); }
      if (b.y < BALL_R) { b.y = BALL_R; b.vy = Math.abs(b.vy); }

      const paddleY = H - 42;
      if (
        b.vy > 0 &&
        b.y + BALL_R >= paddleY &&
        b.y + BALL_R <= paddleY + PADDLE_H + 6 &&
        b.x >= paddleX.current - BALL_R &&
        b.x <= paddleX.current + PADDLE_W + BALL_R
      ) {
        const hit = (b.x - (paddleX.current + PADDLE_W / 2)) / (PADDLE_W / 2);
        const speed = Math.min(9, Math.hypot(b.vx, b.vy) + 0.08);
        const angle = hit * 1.05;
        b.vx = Math.sin(angle) * speed;
        b.vy = -Math.cos(angle) * speed;
        b.y = paddleY - BALL_R - 1;
      }

      if (b.y > H + 20) {
        loseLife();
        return;
      }

      for (const brick of bricks.current) {
        if (!brick.alive) continue;
        if (b.x + BALL_R > brick.x && b.x - BALL_R < brick.x + BRICK_W && b.y + BALL_R > brick.y && b.y - BALL_R < brick.y + BRICK_H) {
          brick.alive = false;
          scoreRef.current += 10;
          setScore(scoreRef.current);
          report(scoreRef.current);
          const overlapX = Math.min(b.x + BALL_R - brick.x, brick.x + BRICK_W - (b.x - BALL_R));
          const overlapY = Math.min(b.y + BALL_R - brick.y, brick.y + BRICK_H - (b.y - BALL_R));
          if (overlapX < overlapY) b.vx = -b.vx;
          else b.vy = -b.vy;
          break;
        }
      }

      if (bricks.current.every(brick => !brick.alive)) {
        if (levelRef.current >= MAX_LEVEL) {
          setStatus('won');
          finish(scoreRef.current + 500);
          return;
        }
        scoreRef.current += 100;
        setScore(scoreRef.current);
        startLevel(levelRef.current + 1);
        return;
      }

      ctx.fillStyle = '#080b16';
      ctx.fillRect(0, 0, W, H);
      for (const brick of bricks.current) {
        if (!brick.alive) continue;
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x + 2, brick.y + 2, BRICK_W - 4, BRICK_H - 4, 4);
        ctx.fill();
      }
      ctx.fillStyle = meta.primary;
      ctx.shadowColor = meta.primary;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(paddleX.current, paddleY, PADDLE_W, PADDLE_H, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '13px sans-serif';
      ctx.fillText(`第 ${levelRef.current} 关`, 20, H - 12);
    },
  });

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '生命', value: '❤️'.repeat(Math.max(0, lives)) }, { label: '关卡', value: `${level}/${MAX_LEVEL}` }]}
      resultText={`打到第 ${level} 关`}
      hint="移动鼠标或按 ← → / A D 控制挡板，弹球击碎所有砖块；共 3 关"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          移动挡板接住弹球，击碎全部砖块。<br />漏球会失去生命，共有 3 条命、3 个关卡。
        </StartPanel>
      ) : (
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: '100%', maxWidth: 560, aspectRatio: `${W} / ${H}`, borderRadius: 14, border: `1px solid ${meta.primary}44`, touchAction: 'none' }}
        />
      )}
    </GameFrame>
  );
}
