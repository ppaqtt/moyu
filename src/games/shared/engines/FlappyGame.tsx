import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import { useGameLoop } from '../../../hooks/useGameLoop';
import type { EngineProps, GameStatus } from '../types';

const W = 420;
const H = 620;
const BIRD_X = 110;
const BIRD_R = 15;
const GRAVITY = 0.42;
const FLAP = -7.2;
const GAP = 150;
const PIPE_W = 64;
const PIPE_GAP_EVERY = 92;

interface Pipe { x: number; gapY: number; scored: boolean }

export default function FlappyGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);

  const birdY = useRef(H / 2);
  const vy = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const frame = useRef(0);
  const scoreRef = useRef(0);

  const start = useCallback(() => {
    birdY.current = H / 2;
    vy.current = 0;
    pipes.current = [];
    frame.current = 0;
    scoreRef.current = 0;
    setScore(0);
    setStatus('playing');
    report(0);
  }, [report]);

  const flap = useCallback(() => {
    if (status !== 'playing') return;
    vy.current = FLAP;
  }, [status]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [flap]);

  useGameLoop({
    delay: 16,
    enabled: status === 'playing',
    callback: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      frame.current++;
      vy.current += GRAVITY;
      birdY.current += vy.current;

      if (frame.current % PIPE_GAP_EVERY === 0) {
        pipes.current.push({ x: W + 40, gapY: 120 + Math.random() * (H - 300), scored: false });
      }

      for (const pipe of pipes.current) {
        pipe.x -= 2.7;
        if (!pipe.scored && pipe.x + PIPE_W < BIRD_X) {
          pipe.scored = true;
          scoreRef.current += 10;
          setScore(scoreRef.current);
          report(scoreRef.current);
        }
      }
      pipes.current = pipes.current.filter(p => p.x > -PIPE_W - 20);

      const hitPipe = pipes.current.some(pipe => {
        if (BIRD_X + BIRD_R > pipe.x && BIRD_X - BIRD_R < pipe.x + PIPE_W) {
          return birdY.current - BIRD_R < pipe.gapY || birdY.current + BIRD_R > pipe.gapY + GAP;
        }
        return false;
      });

      if (birdY.current + BIRD_R > H - 40 || birdY.current - BIRD_R < 0 || hitPipe) {
        setStatus('lost');
        finish(scoreRef.current);
        return;
      }

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0b1a33');
      sky.addColorStop(1, '#12324a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      for (const pipe of pipes.current) {
        const topH = pipe.gapY;
        const bottomY = pipe.gapY + GAP;
        ctx.fillStyle = meta.secondary;
        ctx.fillRect(pipe.x, 0, PIPE_W, topH);
        ctx.fillRect(pipe.x, bottomY, PIPE_W, H - 40 - bottomY);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(pipe.x + 6, 0, 8, topH);
        ctx.fillRect(pipe.x + 6, bottomY, 8, H - 40 - bottomY);
      }

      ctx.fillStyle = '#1f4d2e';
      ctx.fillRect(0, H - 40, W, 40);

      ctx.save();
      ctx.translate(BIRD_X, birdY.current);
      ctx.rotate(Math.max(-0.5, Math.min(1.1, vy.current / 12)));
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(6, -5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(8, -5, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(BIRD_R - 1, 2);
      ctx.lineTo(BIRD_R + 9, 6);
      ctx.lineTo(BIRD_R - 1, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(scoreRef.current), W / 2, 70);
    },
  });

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      resultText={`飞过 ${score / 10} 个管道`}
      hint="空格 / ↑ / W 或点击画面让小鸟上升；穿过管道之间得 10 分"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          点击或按空格让小鸟拍翅膀。<br />穿过管道空隙，撞到管道或地面就结束。
        </StartPanel>
      ) : (
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={flap}
          onTouchStart={e => { e.preventDefault(); flap(); }}
          style={{ width: '100%', maxWidth: 420, aspectRatio: `${W} / ${H}`, borderRadius: 14, border: `1px solid ${meta.primary}44`, touchAction: 'none', cursor: 'pointer' }}
        />
      )}
    </GameFrame>
  );
}
