import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import { useGameLoop } from '../../../hooks/useGameLoop';
import { useKeyboard } from '../../../hooks/useKeyboard';
import type { EngineProps, GameStatus } from '../types';

const GRID = 20;
const CELL = 24;
const W = GRID * CELL;
const H = GRID * CELL;

type Point = { x: number; y: number };

function randomFood(snake: Point[]): Point {
  let p: Point;
  do {
    p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some(s => s.x === p.x && s.y === p.y));
  return p;
}

export default function SnakeGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(140);
  const dirRef = useRef<Point>({ x: 1, y: 0 });
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const scoreRef = useRef(0);
  const speedRef = useRef(140);
  snakeRef.current = snake;
  foodRef.current = food;
  scoreRef.current = score;
  speedRef.current = speed;

  const start = useCallback(() => {
    const initial = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dirRef.current = { x: 1, y: 0 };
    setSnake(initial);
    setFood(randomFood(initial));
    setScore(0);
    setSpeed(140);
    setStatus('playing');
    report(0);
  }, [report]);

  const setDir = useCallback((x: number, y: number) => {
    const current = dirRef.current;
    if (current.x === -x && current.y === -y) return;
    dirRef.current = { x, y };
  }, []);

  useKeyboard({
    onArrowUp: () => setDir(0, -1),
    onArrowDown: () => setDir(0, 1),
    onArrowLeft: () => setDir(-1, 0),
    onArrowRight: () => setDir(1, 0),
    onW: () => setDir(0, -1),
    onS: () => setDir(0, 1),
    onA: () => setDir(-1, 0),
    onD: () => setDir(1, 0),
    enabled: status === 'playing',
  });

  useGameLoop({
    delay: speed,
    enabled: status === 'playing',
    callback: () => {
      const body = snakeRef.current;
      const head = body[0];
      const dir = dirRef.current;
      const next = { x: head.x + dir.x, y: head.y + dir.y };
      if (next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID || body.some(s => s.x === next.x && s.y === next.y)) {
        setStatus('lost');
        finish(scoreRef.current);
        return;
      }
      const ate = next.x === foodRef.current.x && next.y === foodRef.current.y;
      const nextSnake = [next, ...(ate ? body : body.slice(0, -1))];
      setSnake(nextSnake);
      if (ate) {
        const nextScore = scoreRef.current + 10;
        setScore(nextScore);
        report(nextScore);
        setSpeed(prev => Math.max(70, prev - 4));
        setFood(randomFood(nextSnake));
      }
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#080b16';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(W, i * CELL);
      ctx.stroke();
    }
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    snake.forEach((seg, i) => {
      const ratio = 1 - i / Math.max(snake.length, 1) * 0.55;
      ctx.fillStyle = i === 0 ? '#ffffff' : meta.primary;
      ctx.globalAlpha = ratio;
      ctx.beginPath();
      ctx.roundRect(seg.x * CELL + 2, seg.y * CELL + 2, CELL - 4, CELL - 4, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }, [snake, food, meta]);

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '长度', value: snake.length }, { label: '速度', value: `${Math.round(1000 / speed)} 格/秒` }]}
      resultText={`蛇身长度 ${snake.length}`}
      hint="方向键 / WASD 控制方向；吃到红点变长并加速，撞墙或撞到自己会结束"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          经典贪吃蛇。<br />吃掉红点让蛇变长，注意不要撞墙或咬到自己。
        </StartPanel>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{ width: '100%', maxWidth: 480, aspectRatio: '1 / 1', borderRadius: 12, border: `1px solid ${meta.primary}44` }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 50px)', gap: 6 }}>
            <span />
            <button onClick={() => setDir(0, -1)} style={padStyle(meta)}>↑</button>
            <span />
            <button onClick={() => setDir(-1, 0)} style={padStyle(meta)}>←</button>
            <button onClick={() => setDir(0, 1)} style={padStyle(meta)}>↓</button>
            <button onClick={() => setDir(1, 0)} style={padStyle(meta)}>→</button>
          </div>
        </div>
      )}
    </GameFrame>
  );
}

function padStyle(meta: EngineProps['meta']): React.CSSProperties {
  return {
    width: 50,
    height: 50,
    borderRadius: 10,
    border: `1px solid ${meta.primary}55`,
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
  };
}
