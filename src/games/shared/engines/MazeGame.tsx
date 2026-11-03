import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import { useKeyboard } from '../../../hooks/useKeyboard';
import type { EngineProps, GameStatus } from '../types';

const SIZE = 21;
const CELL = 24;
const W = SIZE * CELL;
const H = SIZE * CELL;

function generateMaze(): number[][] {
  const maze: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(1));
  const carve = (r: number, c: number) => {
    maze[r][c] = 0;
    const dirs = ([[0, 2], [0, -2], [2, 0], [-2, 0]] as [number, number][]).sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr > 0 && nr < SIZE - 1 && nc > 0 && nc < SIZE - 1 && maze[nr][nc] === 1) {
        maze[r + dr / 2][c + dc / 2] = 0;
        carve(nr, nc);
      }
    }
  };
  carve(1, 1);
  maze[SIZE - 2][SIZE - 2] = 0;
  return maze;
}

export default function MazeGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [maze, setMaze] = useState<number[][]>(() => generateMaze());
  const [player, setPlayer] = useState<[number, number]>([1, 1]);
  const [steps, setSteps] = useState(0);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);

  const start = useCallback(() => {
    setMaze(generateMaze());
    setPlayer([1, 1]);
    setSteps(0);
    setTime(0);
    setScore(0);
    setStatus('playing');
    report(0);
  }, [report]);

  useEffect(() => {
    if (status !== 'playing') return;
    const timer = window.setInterval(() => setTime(t => t + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  const move = useCallback((dr: number, dc: number) => {
    if (status !== 'playing') return;
    const [r, c] = player;
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || maze[nr][nc] === 1) return;
    const nextSteps = steps + 1;
    setPlayer([nr, nc]);
    setSteps(nextSteps);
    const nextScore = Math.max(100, 2400 - nextSteps * 6 - time * 4);
    setScore(nextScore);
    report(nextScore);
    if (nr === SIZE - 2 && nc === SIZE - 2) {
      const finalScore = Math.max(200, 2400 - nextSteps * 6 - time * 4) + 300;
      setScore(finalScore);
      setStatus('won');
      finish(finalScore);
    }
  }, [status, player, maze, steps, time, report, finish]);

  useKeyboard({
    onArrowUp: () => move(-1, 0),
    onArrowDown: () => move(1, 0),
    onArrowLeft: () => move(0, -1),
    onArrowRight: () => move(0, 1),
    onW: () => move(-1, 0),
    onS: () => move(1, 0),
    onA: () => move(0, -1),
    onD: () => move(0, 1),
    enabled: status === 'playing',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#080b16');
    bg.addColorStop(1, '#111a2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (maze[r][c] === 1) {
          ctx.fillStyle = '#1f2b46';
          ctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
        }
      }
    }

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc((SIZE - 2) * CELL + CELL / 2, (SIZE - 2) * CELL + CELL / 2, CELL * 0.32, 0, Math.PI * 2);
    ctx.fill();

    const px = player[1] * CELL + CELL / 2;
    const py = player[0] * CELL + CELL / 2;
    const grad = ctx.createRadialGradient(px, py, 1, px, py, CELL * 0.45);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, meta.primary);
    grad.addColorStop(1, meta.secondary);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, CELL * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = meta.primary;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = meta.primary;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [maze, player, meta]);

  const dpad = (label: string, dr: number, dc: number) => (
    <button
      key={label}
      onClick={() => move(dr, dc)}
      style={{ width: 54, height: 54, borderRadius: 12, border: `1px solid ${meta.primary}55`, background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 20, cursor: 'pointer' }}
    >
      {label}
    </button>
  );

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '步数', value: steps }, { label: '用时', value: `${time}s` }]}
      resultText={`用 ${steps} 步走出迷宫`}
      hint="方向键 / WASD 移动，也可以使用下方方向按钮；到达绿色终点即通关"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          在随机生成的迷宫中找到出口。<br />步数和用时越少，得分越高。
        </StartPanel>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{ width: '100%', maxWidth: 520, aspectRatio: '1 / 1', borderRadius: 12, border: `1px solid ${meta.primary}44` }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 54px)', gap: 6, justifyContent: 'center' }}>
            <span />{dpad('↑', -1, 0)}<span />
            {dpad('←', 0, -1)}<span />{dpad('→', 0, 1)}
            <span />{dpad('↓', 1, 0)}<span />
          </div>
        </div>
      )}
    </GameFrame>
  );
}
