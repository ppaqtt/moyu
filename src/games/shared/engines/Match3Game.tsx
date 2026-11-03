import React, { useCallback, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import type { EngineProps, GameStatus } from '../types';

const ROWS = 8;
const COLS = 8;
const COLORS = 6;
const SYMBOLS = ['🍬', '💎', '🍇', '🍋', '🫐', '🍊'];
const GEM_COLORS = ['#ff6b9d', '#22d3ee', '#a855f7', '#facc15', '#3b82f6', '#fb923c'];
const MOVES = 30;
const TARGET = 1200;

function randomGrid(): number[] {
  return Array.from({ length: ROWS * COLS }, () => Math.floor(Math.random() * COLORS));
}

function findMatches(grid: number[]): Set<number> {
  const matched = new Set<number>();
  for (let r = 0; r < ROWS; r++) {
    let runStart = 0;
    for (let c = 1; c <= COLS; c++) {
      const same = c < COLS && grid[r * COLS + c] === grid[r * COLS + c - 1] && grid[r * COLS + c] >= 0;
      if (!same) {
        if (c - runStart >= 3) {
          for (let k = runStart; k < c; k++) matched.add(r * COLS + k);
        }
        runStart = c;
      }
    }
  }
  for (let c = 0; c < COLS; c++) {
    let runStart = 0;
    for (let r = 1; r <= ROWS; r++) {
      const same = r < ROWS && grid[r * COLS + c] === grid[(r - 1) * COLS + c] && grid[r * COLS + c] >= 0;
      if (!same) {
        if (r - runStart >= 3) {
          for (let k = runStart; k < r; k++) matched.add(k * COLS + c);
        }
        runStart = r;
      }
    }
  }
  return matched;
}

function collapse(grid: number[]): number[] {
  const next = [...grid];
  for (let c = 0; c < COLS; c++) {
    const column: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      const v = next[r * COLS + c];
      if (v >= 0) column.push(v);
    }
    while (column.length < ROWS) column.unshift(Math.floor(Math.random() * COLORS));
    for (let r = 0; r < ROWS; r++) next[r * COLS + c] = column[r];
  }
  return next;
}

function resolve(grid: number[]): { grid: number[]; gained: number; combo: number } {
  let current = [...grid];
  let gained = 0;
  let combo = 0;
  let matches = findMatches(current);
  while (matches.size > 0 && combo < 30) {
    combo++;
    gained += matches.size * 10 * Math.min(combo, 5);
    matches.forEach(i => { current[i] = -1; });
    current = collapse(current);
    matches = findMatches(current);
  }
  return { grid: current, gained, combo };
}

function freshGrid(): number[] {
  let grid = randomGrid();
  let guard = 0;
  while (findMatches(grid).size > 0 && guard < 100) {
    grid = randomGrid();
    guard++;
  }
  return grid;
}

export default function Match3Game({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [grid, setGrid] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(MOVES);
  const [comboText, setComboText] = useState('');

  const start = useCallback(() => {
    setGrid(freshGrid());
    setSelected(null);
    setScore(0);
    setMoves(MOVES);
    setComboText('');
    setStatus('playing');
    report(0);
  }, [report]);

  const clickCell = (index: number) => {
    if (status !== 'playing') return;
    if (selected === null) {
      setSelected(index);
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    const sr = Math.floor(selected / COLS);
    const sc = selected % COLS;
    const r = Math.floor(index / COLS);
    const c = index % COLS;
    if (Math.abs(sr - r) + Math.abs(sc - c) !== 1) {
      setSelected(index);
      return;
    }

    const swapped = [...grid];
    [swapped[selected], swapped[index]] = [swapped[index], swapped[selected]];
    if (findMatches(swapped).size === 0) {
      setSelected(null);
      setComboText('这样换不能消除');
      window.setTimeout(() => setComboText(''), 600);
      return;
    }

    const result = resolve(swapped);
    const nextScore = score + result.gained;
    const nextMoves = moves - 1;
    setGrid(result.grid);
    setScore(nextScore);
    setMoves(nextMoves);
    setSelected(null);
    setComboText(result.combo >= 3 ? `${result.combo} 连击！+${result.gained}` : `+${result.gained}`);
    report(nextScore);

    if (nextScore >= TARGET) {
      setStatus('won');
      finish(nextScore + nextMoves * 20);
    } else if (nextMoves <= 0) {
      setStatus('lost');
      finish(nextScore);
    }
  };

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '剩余步数', value: moves }, { label: '目标', value: TARGET }]}
      resultText={`消除得分 ${score}`}
      hint="点击两个相邻宝石交换；三个以上同色连成一线即可消除，连锁消除会获得更高倍率"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          在 {MOVES} 步内达到 {TARGET} 分。<br />交换相邻宝石，凑出三个或更多同色宝石即可消除。
        </StartPanel>
      ) : (
        <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gap: 4,
              padding: 8,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${meta.primary}33`,
              aspectRatio: '1 / 1',
              maxWidth: 460,
              margin: '0 auto',
            }}
          >
            {grid.map((value, index) => {
              const isSelected = selected === index;
              return (
                <button
                  key={index}
                  onClick={() => clickCell(index)}
                  style={{
                    border: isSelected ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.25)',
                    borderRadius: 10,
                    background: `linear-gradient(145deg, ${GEM_COLORS[value]}dd, ${GEM_COLORS[value]}77)`,
                    fontSize: 'clamp(16px, 3vw, 24px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.08)' : 'none',
                    boxShadow: isSelected ? `0 0 16px ${GEM_COLORS[value]}` : 'inset 0 0 10px rgba(255,255,255,0.12)',
                    transition: 'transform .1s',
                    padding: 0,
                    aspectRatio: '1 / 1',
                  }}
                >
                  {SYMBOLS[value]}
                </button>
              );
            })}
          </div>
          <div style={{ height: 28, textAlign: 'center', marginTop: 10, color: meta.secondary, fontWeight: 700 }}>{comboText}</div>
        </div>
      )}
    </GameFrame>
  );
}
