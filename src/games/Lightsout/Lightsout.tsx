import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const GRID_SIZE = 5;
const CELL_SIZE = 60;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const PRIMARY = '#FFD700';
const SECONDARY = '#FFA500';
const ON_COLOR = '#FFD700';
const OFF_COLOR = '#2a2a4a';

export default function Lightsout() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won'>('idle');
  const [time, setTime] = useState(0);

  const initGame = useCallback(() => {
    const newGrid: boolean[][] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      newGrid[i] = [];
      for (let j = 0; j < GRID_SIZE; j++) {
        newGrid[i][j] = Math.random() > 0.5;
      }
    }

    let allOff = true;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (newGrid[i][j]) {
          allOff = false;
          break;
        }
      }
      if (!allOff) break;
    }
    if (allOff) {
      const mid = Math.floor(GRID_SIZE / 2);
      newGrid[mid][mid] = true;
    }

    setGrid(newGrid);
    setMoves(0);
    setTime(0);
    setGameState('playing');
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const toggleCell = useCallback((row: number, col: number) => {
    if (gameState !== 'playing') return;

    const newGrid = grid.map(r => [...r]);

    const toggle = (r: number, c: number) => {
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        newGrid[r][c] = !newGrid[r][c];
      }
    };

    toggle(row, col);
    toggle(row - 1, col);
    toggle(row + 1, col);
    toggle(row, col - 1);
    toggle(row, col + 1);

    setGrid(newGrid);
    setMoves(m => m + 1);

    let allOff = true;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (newGrid[i][j]) {
          allOff = false;
          break;
        }
      }
      if (!allOff) break;
    }

    if (allOff) {
      setGameState('won');
    }
  }, [gameState, grid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const x = j * CELL_SIZE;
        const y = i * CELL_SIZE;
        const isOn = grid[i]?.[j];

        if (isOn) {
          ctx.shadowColor = ON_COLOR;
          ctx.shadowBlur = 20;
          const gradient = ctx.createRadialGradient(
            x + CELL_SIZE / 2, y + CELL_SIZE / 2, 0,
            x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2
          );
          gradient.addColorStop(0, '#fff');
          gradient.addColorStop(0.3, ON_COLOR);
          gradient.addColorStop(1, '#b8860b');
          ctx.fillStyle = gradient;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = OFF_COLOR;
        }

        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8, 8);
        ctx.fill();

        if (isOn) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
    }
  }, [grid]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      toggleCell(row, col);
    }
  }, [toggleCell]);

  const getHint = useCallback(() => {
    const emptyGrid = grid.map(r => r.map(c => false));
    const testGrid = (test: boolean[][], row: number, col: number): boolean => {
      const g = test.map(r => [...r]);
      const toggle = (r: number, c: number) => {
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
          g[r][c] = !g[r][c];
        }
      };
      toggle(row, col);
      toggle(row - 1, col);
      toggle(row + 1, col);
      toggle(row, col - 1);
      toggle(row, col + 1);

      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (g[i][j]) return false;
        }
      }
      return true;
    };

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (testGrid(emptyGrid, i, j)) {
          return { row: i, col: j };
        }
      }
    }
    return null;
  }, [grid]);

  return (
    <div style={{ background: '#0a0a1a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}>
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ color: PRIMARY, fontSize: 28, marginBottom: 10 }}>💡 灯灯灯灭</motion.h1>
      <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
        <span style={{ color: '#fff' }}>步数: {moves}</span>
        <span style={{ color: '#fff' }}>时间: {time}s</span>
      </div>
      <div style={{ color: '#888', fontSize: 14, marginBottom: 10 }}>
        点击格子会翻转周围格子的状态，目标是关闭所有灯
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onClick={handleClick}
        style={{ border: `3px solid ${PRIMARY}`, borderRadius: 12, cursor: 'pointer' }}
      />
      {gameState === 'won' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: '#22c55e', fontSize: 24, marginTop: 10 }}>
          🎉 恭喜通关! 步数: {moves} 用时: {time}秒
        </motion.div>
      )}
      <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={initGame}
          style={{ padding: '10px 24px', background: PRIMARY, color: '#000', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', fontWeight: 'bold' }}>
          {gameState === 'idle' ? '开始游戏' : '重新开始'}
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/')}
          style={{ padding: '10px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>
          返回首页
        </motion.button>
      </div>
      <div style={{ marginTop: 20, color: '#666', fontSize: 12, textAlign: 'center', maxWidth: 300 }}>
        提示: 每个灯的开关会影响自身和上下左右的灯。找到一种方式让所有灯都熄灭即可通关。
      </div>
    </div>
  );
}
