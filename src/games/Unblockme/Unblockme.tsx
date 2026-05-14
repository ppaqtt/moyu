import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const CELL_SIZE = 40;
const BOARD_COLS = 6;
const BOARD_ROWS = 6;
const CANVAS_WIDTH = BOARD_COLS * CELL_SIZE;
const CANVAS_HEIGHT = BOARD_ROWS * CELL_SIZE;

interface Block {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  isHorizontal: boolean;
}

const INITIAL_LEVELS: Block[][] = [
  [
    { id: 1, x: 1, y: 2, w: 2, h: 1, color: '#EF4444', isHorizontal: true },
    { id: 2, x: 3, y: 1, w: 1, h: 2, color: '#3B82F6', isHorizontal: false },
    { id: 3, x: 4, y: 2, w: 1, h: 2, color: '#22C55E', isHorizontal: false },
    { id: 4, x: 0, y: 0, w: 1, h: 2, color: '#EAB308', isHorizontal: false },
    { id: 5, x: 1, y: 0, w: 1, h: 1, color: '#8B5CF6', isHorizontal: true },
    { id: 6, x: 3, y: 0, w: 1, h: 1, color: '#EC4899', isHorizontal: true },
    { id: 7, x: 5, y: 0, w: 1, h: 2, color: '#06B6D4', isHorizontal: false },
    { id: 8, x: 0, y: 3, w: 1, h: 2, color: '#F97316', isHorizontal: false },
    { id: 9, x: 1, y: 4, w: 2, h: 1, color: '#14B8A6', isHorizontal: true },
    { id: 10, x: 4, y: 4, w: 1, h: 2, color: '#A855F7', isHorizontal: false },
    { id: 11, x: 5, y: 3, w: 1, h: 1, color: '#84CC16', isHorizontal: true },
  ],
  [
    { id: 1, x: 0, y: 2, w: 3, h: 1, color: '#EF4444', isHorizontal: true },
    { id: 2, x: 3, y: 0, w: 1, h: 3, color: '#3B82F6', isHorizontal: false },
    { id: 3, x: 4, y: 1, w: 1, h: 2, color: '#22C55E', isHorizontal: false },
    { id: 4, x: 5, y: 0, w: 1, h: 2, color: '#EAB308', isHorizontal: false },
    { id: 5, x: 0, y: 0, w: 1, h: 2, color: '#8B5CF6', isHorizontal: false },
    { id: 6, x: 1, y: 0, w: 2, h: 1, color: '#EC4899', isHorizontal: true },
    { id: 7, x: 4, y: 3, w: 2, h: 1, color: '#06B6D4', isHorizontal: true },
    { id: 8, x: 0, y: 3, w: 1, h: 3, color: '#F97316', isHorizontal: false },
    { id: 9, x: 1, y: 4, w: 1, h: 2, color: '#14B8A6', isHorizontal: false },
    { id: 10, x: 2, y: 3, w: 2, h: 1, color: '#A855F7', isHorizontal: true },
    { id: 11, x: 2, y: 5, w: 1, h: 1, color: '#84CC16', isHorizontal: true },
    { id: 12, x: 5, y: 4, w: 1, h: 2, color: '#F43F5E', isHorizontal: false },
  ],
];

const EXIT_X = 5;
const EXIT_Y = 2;

export default function Unblockme() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won'>('idle');
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);

  const initGame = useCallback((level: number) => {
    const levelData = INITIAL_LEVELS[level % INITIAL_LEVELS.length];
    setBlocks(levelData.map(b => ({ ...b })));
    setCurrentLevel(level);
    setMoves(0);
    setSelectedBlock(null);
    setGameState('playing');
  }, []);

  const canMove = useCallback((block: Block, newX: number, newY: number) => {
    if (block.isHorizontal) {
      if (newY !== block.y) return false;
      if (newX < 0 || newX + block.w > BOARD_COLS) return false;
    } else {
      if (newX !== block.x) return false;
      if (newY < 0 || newY + block.h > BOARD_ROWS) return false;
    }

    for (const other of blocks) {
      if (other.id === block.id) continue;
      const overlap = !(
        newX >= other.x + other.w ||
        newX + block.w <= other.x ||
        newY >= other.y + other.h ||
        newY + block.h <= other.y
      );
      if (overlap) return false;
    }
    return true;
  }, [blocks]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    let clickedBlock: Block | null = null;
    for (const block of blocks) {
      if (x >= block.x && x < block.x + block.w && y >= block.y && y < block.y + block.h) {
        clickedBlock = block;
        break;
      }
    }

    if (clickedBlock) {
      setSelectedBlock(clickedBlock.id);
    } else {
      setSelectedBlock(null);
    }
  }, [gameState, blocks]);

  const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameState !== 'playing' || selectedBlock === null) return;

    const block = blocks.find(b => b.id === selectedBlock);
    if (!block) return;

    let dx = 0, dy = 0;
    let step = 1;

    if (block.isHorizontal) {
      if (direction === 'left') { dx = -step; dy = 0; }
      else if (direction === 'right') { dx = step; dy = 0; }
      else return;
    } else {
      if (direction === 'up') { dx = 0; dy = -step; }
      else if (direction === 'down') { dx = 0; dy = step; }
      else return;
    }

    let newX = block.x;
    let newY = block.y;

    while (canMove(block, newX + dx, newY + dy)) {
      newX += dx;
      newY += dy;
    }

    if (newX !== block.x || newY !== block.y) {
      const newBlocks = blocks.map(b =>
        b.id === selectedBlock ? { ...b, x: newX, y: newY } : b
      );
      setBlocks(newBlocks);
      setMoves(m => m + 1);

      const redBlock = newBlocks.find(b => b.color === '#EF4444');
      if (redBlock && redBlock.x + redBlock.w === EXIT_X + 1 && redBlock.y === EXIT_Y) {
        setGameState('won');
      }
    }
  }, [gameState, selectedBlock, blocks, canMove]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedBlock !== null) {
        switch (e.key) {
          case 'ArrowLeft':
          case 'a':
          case 'A':
            e.preventDefault();
            handleMove('left');
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            e.preventDefault();
            handleMove('right');
            break;
          case 'ArrowUp':
          case 'w':
          case 'W':
            e.preventDefault();
            handleMove('up');
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            e.preventDefault();
            handleMove('down');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedBlock, handleMove]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let x = 0; x <= BOARD_COLS; x++) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
      ctx.stroke();
    }

    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(EXIT_X * CELL_SIZE, EXIT_Y * CELL_SIZE - 2, CELL_SIZE, CELL_SIZE + 4);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('→', EXIT_X * CELL_SIZE + CELL_SIZE / 2, EXIT_Y * CELL_SIZE + CELL_SIZE / 2);

    blocks.forEach(block => {
      const x = block.x * CELL_SIZE;
      const y = block.y * CELL_SIZE;
      const w = block.w * CELL_SIZE;
      const h = block.h * CELL_SIZE;

      if (block.id === selectedBlock) {
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15;
      } else {
        ctx.shadowBlur = 0;
      }

      const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
      gradient.addColorStop(0, block.color);
      gradient.addColorStop(1, shadeColor(block.color, -30));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 4);
      ctx.fill();

      ctx.strokeStyle = block.color === '#EF4444' ? '#fff' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = block.color === '#EF4444' ? 3 : 1;
      ctx.stroke();

      ctx.shadowBlur = 0;
    });
  }, [blocks, selectedBlock]);

  function shadeColor(color: string, percent: number) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  return (
    <div style={{ background: '#0a0a1a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}>
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#EF4444', fontSize: 28, marginBottom: 10 }}>🚗 解锁大师</motion.h1>
      <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
        <span style={{ color: '#fff' }}>关卡: {currentLevel + 1}</span>
        <span style={{ color: '#fff' }}>步数: {moves}</span>
      </div>
      <div style={{ color: '#888', fontSize: 14, marginBottom: 10 }}>移动方块让红色方块到达右边出口 →</div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleClick}
        style={{ border: '2px solid #EF4444', borderRadius: 8, cursor: 'pointer' }}
      />
      {selectedBlock !== null && (
        <div style={{ marginTop: 10, color: '#fff', fontSize: 14 }}>
          已选中方块，使用方向键或WASD移动
        </div>
      )}
      {gameState === 'won' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: '#22c55e', fontSize: 24, marginTop: 10 }}>
          🎉 恭喜通关! 步数: {moves}
        </motion.div>
      )}
      <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => initGame(currentLevel)}
          style={{ padding: '10px 24px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', fontWeight: 'bold' }}>
          重新开始
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => initGame(currentLevel + 1)}
          style={{ padding: '10px 24px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', fontWeight: 'bold' }}>
          下一关
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/')}
          style={{ padding: '10px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>
          返回首页
        </motion.button>
      </div>
    </div>
  );
}
