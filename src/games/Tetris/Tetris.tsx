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
          className="border"
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: cell ? engine.getPieceColor(cell) : 'rgba(22, 33, 62, 0.5)',
            borderColor: cell ? engine.getPieceColor(cell) : 'rgba(255,255,255,0.1)',
            boxShadow: cell ? `inset 0 0 10px rgba(255,255,255,0.3), 0 0 5px ${engine.getPieceColor(cell)}` : 'none'
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
    const color = ['#00f5ff', '#ffff00', '#a000ff', '#ff8c00', '#0000ff', '#00ff00', '#ff0000'][nextPieceType];

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
                boxShadow: cell ? `0 0 5px ${color}` : 'none'
              }}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="flex flex-col items-center gap-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
          style={{
            backgroundColor: NEON_COLORS.darkPurple,
            color: NEON_COLORS.neonBlue,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`
          }}
          whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}` }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>当前分数</div>
          <div className="text-3xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高记录</div>
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>下一块</div>
          <div
            className="mt-2 p-2 rounded-lg"
            style={{ backgroundColor: NEON_COLORS.darkPurple }}
          >
            {renderNextPiece()}
          </div>
        </div>

        <div className="flex gap-2 text-sm" style={{ color: NEON_COLORS.gold }}>
          <div>等级: <span className="font-bold" style={{ color: NEON_COLORS.neonPink }}>{level}</span></div>
          <div>行数: <span className="font-bold" style={{ color: NEON_COLORS.neonBlue }}>{lines}</span></div>
        </div>
      </div>

      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          backgroundColor: NEON_COLORS.darkPurple,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`
        }}
      >
        <div className="grid" style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)` }}>
          {renderBoard()}
        </div>

        {isPaused && !isGameOver && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.9)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-3xl font-bold" style={{ color: NEON_COLORS.neonPink }}>暂停</div>
          </motion.div>
        )}

        {isGameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>游戏结束</div>
            <div className="text-2xl mb-6" style={{ color: NEON_COLORS.gold }}>最终得分: {score}</div>
            <div className="flex gap-4">
              <motion.button
                onClick={handleRestart}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPink,
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再玩一次
              </motion.button>
              <motion.button
                onClick={onExit}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.darkPurple,
                  color: NEON_COLORS.neonBlue,
                  border: `2px solid ${NEON_COLORS.neonBlue}`
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

      <div className="hidden lg:block text-sm space-y-1" style={{ color: NEON_COLORS.gold, opacity: 0.7 }}>
        <div>← → 移动</div>
        <div>↑ 旋转</div>
        <div>↓ 加速下落</div>
        <div>空格 立即下落</div>
        <div>ESC 暂停</div>
      </div>
    </div>
  );
}
