import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

const CELL_SIZE = 50;
const BOARD_COLS = 4;
const BOARD_ROWS = 5;
const CANVAS_WIDTH = BOARD_COLS * CELL_SIZE;
const CANVAS_HEIGHT = BOARD_ROWS * CELL_SIZE;

interface Block {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const INITIAL_BLOCKS: Block[] = [
  { id: 1, x: 0, y: 0, w: 2, h: 2, color: '#FF6B6B' },
  { id: 2, x: 2, y: 0, w: 1, h: 1, color: '#4ECDC4' },
  { id: 3, x: 3, y: 0, w: 1, h: 1, color: '#45B7D1' },
  { id: 4, x: 2, y: 1, w: 1, h: 1, color: '#96CEB4' },
  { id: 5, x: 3, y: 1, w: 1, h: 1, color: '#FFEAA7' },
  { id: 6, x: 0, y: 2, w: 1, h: 1, color: '#DDA0DD' },
  { id: 7, x: 1, y: 2, w: 1, h: 1, color: '#98D8C8' },
  { id: 8, x: 2, y: 2, w: 1, h: 1, color: '#F7DC6F' },
  { id: 9, x: 3, y: 2, w: 1, h: 1, color: '#BB8FCE' },
  { id: 10, x: 0, y: 3, w: 1, h: 2, color: '#85C1E9' },
  { id: 11, x: 1, y: 3, w: 1, h: 1, color: '#F8B500' },
  { id: 12, x: 2, y: 3, w: 1, h: 1, color: '#00CED1' },
  { id: 13, x: 1, y: 4, w: 1, h: 1, color: '#FF7F50' },
  { id: 14, x: 2, y: 4, w: 2, h: 1, color: '#9370DB' },
];

const TARGET_BLOCK = INITIAL_BLOCKS[0];
const TARGET_X = 0;
const TARGET_Y = 3;

export default function Klotski() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blocks, setBlocks] = useState<Block[]>(INITIAL_BLOCKS);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won'>('idle');
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [time, setTime] = useState(0);
  const [minMoves, setMinMoves] = useState(0);

  const initGame = useCallback(() => {
    setBlocks(INITIAL_BLOCKS.map(b => ({ ...b })));
    setMoves(0);
    setSelectedBlock(null);
    setGameState('playing');
    setTime(0);
    setMinMoves(0);
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const canMove = useCallback((block: Block, newX: number, newY: number) => {
    if (newX < 0 || newX + block.w > BOARD_COLS || newY < 0 || newY + block.h > BOARD_ROWS) {
      return false;
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

  const handleMove = useCallback((dx: number, dy: number) => {
    if (gameState !== 'playing' || selectedBlock === null) return;

    const block = blocks.find(b => b.id === selectedBlock);
    if (!block) return;

    const newX = block.x + dx;
    const newY = block.y + dy;

    if (canMove(block, newX, newY)) {
      const newBlocks = blocks.map(b =>
        b.id === selectedBlock ? { ...b, x: newX, y: newY } : b
      );
      setBlocks(newBlocks);
      setMoves(m => m + 1);

      if (block.id === TARGET_BLOCK.id && newX === TARGET_X && newY === TARGET_Y) {
        setGameState('won');
        setMinMoves(moves + 1);
      }
    }
  }, [gameState, selectedBlock, blocks, canMove, moves]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedBlock !== null) {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            e.preventDefault();
            handleMove(0, -1);
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            e.preventDefault();
            handleMove(0, 1);
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            e.preventDefault();
            handleMove(-1, 0);
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            e.preventDefault();
            handleMove(1, 0);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    ctx.fillRect(TARGET_X * CELL_SIZE + 2, TARGET_Y * CELL_SIZE + 2, CELL_SIZE * 2 - 4, CELL_SIZE - 4);

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
      ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 6);
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(block.id), x + w / 2, y + h / 2);
    });

    ctx.fillStyle = '#22c55e';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('出口', TARGET_X * CELL_SIZE + CELL_SIZE, TARGET_Y * CELL_SIZE + CELL_SIZE / 2);
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
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#FF6B6B', fontSize: 28, marginBottom: 10 }}>🧱 华容道经典</motion.h1>
      <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
        <span style={{ color: '#fff' }}>步数: {moves}</span>
        <span style={{ color: '#fff' }}>时间: {time}s</span>
      </div>
      <div style={{ color: '#888', fontSize: 14, marginBottom: 10 }}>用方向键或WASD移动方块，让红色大方块(1)到达底部绿色出口</div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleClick}
        style={{ border: '2px solid #FF6B6B', borderRadius: 8, cursor: 'pointer' }}
      />
      {selectedBlock !== null && (
        <div style={{ marginTop: 10, color: '#fff', fontSize: 14 }}>
          已选中方块 {selectedBlock}，使用方向键移动
        </div>
      )}
      {gameState === 'won' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: '#22c55e', fontSize: 24, marginTop: 10 }}>
          🎉 恭喜通关! 步数: {moves} 用时: {time}秒
        </motion.div>
      )}
      <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={initGame}
          style={{ padding: '10px 24px', background: '#FF6B6B', color: '#000', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', fontWeight: 'bold' }}>
          {gameState === 'idle' ? '开始游戏' : '重新开始'}
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/')}
          style={{ padding: '10px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>
          返回首页
        </motion.button>
      </div>
    </div>
  );
}
