import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { TETRIS_CONSTANTS, STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GameTetrisEngine, Position } from './engine';

const { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE } = TETRIS_CONSTANTS;

interface TetrisProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

export default function Tetris({ onScoreUpdate, onGameOver, onExit }: TetrisProps) {
  const [engine] = useState(() => new GameTetrisEngine());
  const [board, setBoard] = useState(() => engine.getState().board);
  const [currentPiece, setCurrentPiece] = useState(() => engine.getState().currentPiece);
  const [currentPosition, setCurrentPosition] = useState<Position>(() => engine.getState().currentPosition);
  const [score, setScore] = useState(() => engine.getState().score);
  const [level, setLevel] = useState(() => engine.getState().level);
  const [lines, setLines] = useState(() => engine.getState().lines);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(() => engine.getState().speed);
  const [nextPieceType, setNextPieceType] = useState(() => engine.getNextPieceType());
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.TETRIS);

  const handleTick = useCallback(() => {
    if (isPaused) return;

    const moved = engine.tick();
    const state = engine.getState();
    setBoard([...state.board.map(row => [...row])]);
    setCurrentPiece(state.currentPiece ? { ...state.currentPiece } : null);
    setCurrentPosition({ ...state.currentPosition });
    setScore(state.score);
    setLevel(state.level);
    setLines(state.lines);
    setSpeed(state.speed);
    setNextPieceType(engine.getNextPieceType());
    onScoreUpdate(state.score);

    if (state.isGameOver) {
      setIsGameOver(true);
      updateScore(state.score);
      onGameOver(state.score);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore, isPaused]);

  useGameLoop({ callback: handleTick, delay: speed, enabled: !isPaused && !isGameOver });

  const handleMove = useCallback((direction: 'left' | 'right' | 'down') => {
    engine.move(direction);
    const state = engine.getState();
    setCurrentPiece(state.currentPiece ? { ...state.currentPiece } : null);
    setCurrentPosition({ ...state.currentPosition });
    setScore(state.score);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  const handleRotate = useCallback(() => {
    engine.rotate();
    const state = engine.getState();
    setCurrentPiece(state.currentPiece ? { ...state.currentPiece } : null);
  }, [engine]);

  const handleHardDrop = useCallback(() => {
    engine.hardDrop();
    const state = engine.getState();
    setBoard([...state.board.map(row => [...row])]);
    setCurrentPiece(state.currentPiece ? { ...state.currentPiece } : null);
    setCurrentPosition({ ...state.currentPosition });
    setScore(state.score);
    setLevel(state.level);
    setLines(state.lines);
    setSpeed(state.speed);
    setNextPieceType(engine.getNextPieceType());
    onScoreUpdate(state.score);

    if (state.isGameOver) {
      setIsGameOver(true);
      updateScore(state.score);
      onGameOver(state.score);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore]);

  const handleRestart = useCallback(() => {
    engine.reset();
    const state = engine.getState();
    setBoard([...state.board.map(row => [...row])]);
    setCurrentPiece(state.currentPiece ? { ...state.currentPiece } : null);
    setCurrentPosition({ ...state.currentPosition });
    setScore(state.score);
    setLevel(state.level);
    setLines(state.lines);
    setSpeed(state.speed);
    setNextPieceType(engine.getNextPieceType());
    setIsGameOver(false);
    setIsPaused(false);
    onScoreUpdate(state.score);
  }, [engine, onScoreUpdate]);

  useKeyboard({
    onArrowLeft: () => handleMove('left'),
    onArrowRight: () => handleMove('right'),
    onArrowDown: () => handleMove('down'),
    onArrowUp: () => handleRotate(),
    onSpace: () => handleHardDrop(),
    onEscape: () => {
      setIsPaused(p => !p);
      engine.togglePause();
    },
    enabled: !isGameOver
  });

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    if (currentPiece) {
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            const boardY = currentPosition.y + r;
            const boardX = currentPosition.x + c;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.type + 1;
            }
          }
        }
      }
    }

    return displayBoard.map((row, r) =>
      row.map((cell, c) => (
        <div
          key={`${r}-${c}`}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: cell ? engine.getPieceColor(cell) : 'rgba(26, 26, 46, 0.6)',
            border: cell ? `2px solid ${engine.getPieceColor(cell)}` : '1px solid rgba(255,255,255,0.05)',
            boxShadow: cell ? `inset 0 0 15px rgba(255,255,255,0.3), 0 0 10px ${engine.getPieceColor(cell)}80` : 'none'
          }}
        />
      ))
    );
  };

  const renderNextPiece = () => {
    const pieces = [
      [[1, 1, 1, 1]],
      [[1, 1], [1, 1]],
      [[0, 1, 0], [1, 1, 1]],
      [[1, 0, 0], [1, 1, 1]],
      [[0, 0, 1], [1, 1, 1]],
      [[0, 1, 1], [1, 1, 0]],
      [[1, 1, 0], [0, 1, 1]]
    ];

    const shape = pieces[nextPieceType];
    const color = ['#00d2ff', '#ffd700', '#a855f7', '#ff6b9d', '#22c55e', '#f97316', '#06b6d4'][nextPieceType];

    return (
      <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${shape[0].length}, 20px)` }}>
        {shape.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`next-${r}-${c}`}
              style={{
                width: 20,
                height: 20,
                backgroundColor: cell ? color : 'transparent',
                boxShadow: cell ? `0 0 8px ${color}` : 'none',
                borderRadius: cell ? '3px' : '0'
              }}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <motion.div
      className="flex flex-col lg:flex-row items-center gap-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center gap-5">
        <motion.button
          onClick={onExit}
          className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}
          whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonCyan}50` }}
          whileTap={{ scale: 0.95 }}
        >
          ← 返回
        </motion.button>

        <div
          className="text-center p-4 rounded-2xl backdrop-blur-xl"
          style={{
            background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 26, 0.95))',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>当前分数</div>
          <div className="text-3xl font-black" style={{ 
            color: NEON_COLORS.neonPink,
            textShadow: `0 0 20px ${NEON_COLORS.neonPink}80`
          }}>{score}</div>
        </div>

        <div
          className="text-center p-4 rounded-2xl backdrop-blur-xl"
          style={{
            background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 26, 0.95))',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>最高记录</div>
          <div className="text-2xl font-bold" style={{ 
            color: NEON_COLORS.neonCyan,
            textShadow: `0 0 15px ${NEON_COLORS.neonCyan}80`
          }}>{record.bestScore}</div>
        </div>

        <div
          className="text-center p-4 rounded-2xl backdrop-blur-xl"
          style={{
            background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 26, 0.95))',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>下一块</div>
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          >
            {renderNextPiece()}
          </div>
        </div>

        <div className="flex gap-4 text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          <div className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            等级: <span className="font-bold" style={{ color: NEON_COLORS.neonPurple }}>{level}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            行数: <span className="font-bold" style={{ color: NEON_COLORS.neonGreen }}>{lines}</span>
          </div>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.95), rgba(15, 15, 26, 0.98))',
          boxShadow: `0 0 40px ${NEON_COLORS.neonPurple}30, 0 20px 60px rgba(0, 0, 0, 0.5)`,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="grid" style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)` }}>
          {renderBoard()}
        </div>

        {isPaused && !isGameOver && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center backdrop-blur-md"
            style={{ backgroundColor: 'rgba(15, 15, 26, 0.9)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div 
              className="text-4xl font-black" 
              style={{ 
                color: NEON_COLORS.neonCyan,
                textShadow: `0 0 30px ${NEON_COLORS.neonCyan}`
              }}
            >
              暂停
            </div>
          </motion.div>
        )}

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-md"
            style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div 
              className="text-4xl font-black mb-4" 
              style={{ 
                color: NEON_COLORS.neonPink,
                textShadow: `0 0 30px ${NEON_COLORS.neonPink}`
              }}
            >
              游戏结束
            </div>
            <div 
              className="text-2xl mb-6" 
              style={{ color: NEON_COLORS.gold }}
            >
              最终得分: {score}
            </div>
            <div className="flex gap-4">
              <motion.button
                onClick={handleRestart}
                className="px-6 py-3 rounded-xl font-bold"
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
                  color: '#ffffff',
                  boxShadow: `0 0 25px ${NEON_COLORS.neonPink}60`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再玩一次
              </motion.button>
              <motion.button
                onClick={onExit}
                className="px-6 py-3 rounded-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  color: '#ffffff',
                  border: `1px solid ${NEON_COLORS.neonCyan}`,
                  boxShadow: `0 0 15px ${NEON_COLORS.neonCyan}30`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                返回首页
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      <div 
        className="hidden lg:block p-4 rounded-2xl backdrop-blur-xl space-y-2" 
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="text-xs uppercase tracking-wider mb-3" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>操作说明</div>
        {['← → 移动', '↑ 旋转', '↓ 加速下落', '空格 立即下落', 'ESC 暂停'].map((key, i) => (
          <div 
            key={i} 
            className="text-sm flex items-center gap-2" 
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            <span 
              className="px-2 py-0.5 rounded text-xs font-mono" 
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: NEON_COLORS.neonCyan
              }}
            >
              {key.split(' ')[0]}
            </span>
            <span>{key.split(' ').slice(1).join(' ')}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
