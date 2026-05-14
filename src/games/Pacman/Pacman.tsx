import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GamePacmanEngine, PacMan, Ghost, Position } from './engine';

interface PacmanProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CELL_SIZE = 24;

export default function Pacman({ onScoreUpdate, onGameOver, onExit }: PacmanProps) {
  const [engine] = useState(() => new GamePacmanEngine());
  const [state, setState] = useState(() => engine.getState());
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.PACMAN);
  const { width, height } = engine.getCanvasSize();
  const maze = engine.getMaze();

  const handleTick = useCallback(() => {
    engine.tick();
    const newState = engine.getState();
    setState(newState);
    onScoreUpdate(newState.score);

    if (newState.isGameOver && !state.isGameOver) {
      updateScore(newState.score);
      onGameOver(newState.score);
    }
    if (newState.isWin) {
      updateScore(newState.score);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore, state.isGameOver]);

  useGameLoop({ callback: handleTick, delay: 50, enabled: true });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          e.preventDefault();
          e.stopPropagation();
          engine.setDirection('up');
          break;
        case 'arrowdown':
        case 's':
          e.preventDefault();
          e.stopPropagation();
          engine.setDirection('down');
          break;
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          e.stopPropagation();
          engine.setDirection('left');
          break;
        case 'arrowright':
        case 'd':
          e.preventDefault();
          e.stopPropagation();
          engine.setDirection('right');
          break;
        case ' ':
        case 'spacebar':
        case 'space':
          e.preventDefault();
          e.stopPropagation();
          engine.togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [engine]);

  const handleRestart = () => {
    engine.reset();
    setState(engine.getState());
    onScoreUpdate(0);
  };

  const getDirectionRotation = (dir: string): number => {
    switch (dir) {
      case 'right': return 0;
      case 'down': return 90;
      case 'left': return 180;
      case 'up': return 270;
      default: return 0;
    }
  };

  const renderPacman = () => {
    const mouthDeg = state.pacman.mouthOpen ? 30 : 0;
    return (
      <motion.div
        className="absolute"
        style={{
          left: state.pacman.x - CELL_SIZE / 2,
          top: state.pacman.y - CELL_SIZE / 2,
          width: CELL_SIZE,
          height: CELL_SIZE,
        }}
        animate={{ rotate: getDirectionRotation(state.pacman.direction) }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <svg viewBox="0 0 100 100">
          <defs>
            <clipPath id="mouthClip">
              <path d={`
                M 50 50
                L ${50 + 45 * Math.cos((mouthDeg * Math.PI) / 180)} ${50 + 45 * Math.sin((mouthDeg * Math.PI) / 180)}
                A 45 45 0 1 1 ${50 + 45 * Math.cos((-mouthDeg * Math.PI) / 180)} ${50 + 45 * Math.sin((-mouthDeg * Math.PI) / 180)}
                Z
              `} />
            </clipPath>
          </defs>
          <circle cx="50" cy="50" r="45" fill="#FFFF00" clipPath="url(#mouthClip)" />
        </svg>
      </motion.div>
    );
  };

  const renderGhost = (ghost: Ghost, index: number) => {
    let fillColor = ghost.color;
    if (ghost.isVulnerable) {
      fillColor = ghost.isRecovering ? '#FFFFFF' : '#0000FF';
    }

    return (
      <motion.div
        key={index}
        className="absolute"
        style={{
          left: ghost.x - CELL_SIZE / 2,
          top: ghost.y - CELL_SIZE / 2,
          width: CELL_SIZE,
          height: CELL_SIZE,
        }}
      >
        <svg viewBox="0 0 100 100">
          <path
            d="M 10 40 L 10 90 L 25 80 L 35 90 L 50 80 L 65 90 L 75 80 L 90 90 L 90 40 A 40 40 0 0 0 10 40 Z"
            fill={fillColor}
          />
          <circle cx="30" cy="40" r="12" fill={ghost.isVulnerable ? '#FFF' : '#FFF'} />
          <circle cx="70" cy="40" r="12" fill={ghost.isVulnerable ? '#FFF' : '#FFF'} />
          <circle
            cx="30"
            cy="40"
            r="6"
            fill={ghost.isVulnerable ? '#0000FF' : '#000'}
          />
          <circle
            cx="70"
            cy="40"
            r="6"
            fill={ghost.isVulnerable ? '#0000FF' : '#000'}
          />
        </svg>
      </motion.div>
    );
  };

  const renderDots = () => {
    return (
      <>
        {state.dots.map((dot, i) => (
          <div
            key={`dot-${i}`}
            className="absolute rounded-full"
            style={{
              left: dot.x - 3,
              top: dot.y - 3,
              width: 6,
              height: 6,
              backgroundColor: '#FFE4B5',
              boxShadow: '0 0 4px #FFE4B5'
            }}
          />
        ))}
      </>
    );
  };

  const renderPowerDots = () => {
    return (
      <>
        {state.powerDots.map((dot, i) => (
          <motion.div
            key={`power-${i}`}
            className="absolute rounded-full"
            style={{
              left: dot.x - 8,
              top: dot.y - 8,
              width: 16,
              height: 16,
              backgroundColor: '#FF69B4',
              boxShadow: '0 0 10px #FF69B4'
            }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        ))}
      </>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[540px] px-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.darkPurple,
            color: NEON_COLORS.neonBlue,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {Array.from({ length: state.lives }).map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-yellow-400" />
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>得分</div>
          <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{state.score}</div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: width + 4,
          height: height + 4,
          backgroundColor: '#000',
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `2px solid ${NEON_COLORS.neonPink}40`
        }}
      >
        <div className="absolute inset-0 grid"
             style={{ gridTemplateColumns: `repeat(21, ${CELL_SIZE}px)`, gridTemplateRows: `repeat(21, ${CELL_SIZE}px)` }}>
          {maze.map((row, rowIndex) =>
            row.split('').map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="flex items-center justify-center"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: cell === '#' ? '#1a1a4a' : 'transparent'
                }}
              >
                {cell === '#' && (
                  <div className="w-full h-full border border-blue-900/30" />
                )}
              </div>
            ))
          )}
        </div>

        {renderDots()}
        {renderPowerDots()}
        {renderPacman()}
        {state.ghosts.map(renderGhost)}

        {state.isPaused && !state.isGameOver && !state.isWin && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
              暂停
            </div>
            <div className="text-lg" style={{ color: NEON_COLORS.gold }}>
              按空格继续
            </div>
          </motion.div>
        )}

        {(state.isGameOver || state.isWin) && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
              {state.isWin ? '🎉 胜利!' : '游戏结束'}
            </div>
            <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
              得分: {state.score}
            </div>
            <div className="text-xl mb-6" style={{ color: NEON_COLORS.neonBlue }}>
              最高: {record.bestScore}
            </div>
            <motion.button
              onClick={handleRestart}
              className="px-8 py-4 rounded-xl text-xl font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonPink,
                color: NEON_COLORS.white,
                boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              再来一局
            </motion.button>
          </motion.div>
        )}
      </div>

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>方向键或 WASD 控制吃豆人</div>
        <div>吃光所有豆子获胜，吃到粉色能量球可以吃幽灵</div>
      </div>
    </div>
  );
}
